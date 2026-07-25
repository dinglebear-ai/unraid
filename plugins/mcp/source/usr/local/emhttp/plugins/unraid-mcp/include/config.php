<?php
/**
 * unraid-mcp settings endpoint.
 *
 * GET  -> current config as JSON. Secret values are never returned; each secret
 *         is reported only as "<KEY>_configured": bool (write-only pattern).
 * POST -> JSON body of {key: value} changes; merges into the env file
 *         atomically, enforces permissions, restarts the service when running,
 *         returns the fresh GET payload.
 *
 * Auth: served by emhttp's nginx, so the webGUI session is already required.
 * CSRF: POSTs must carry the session token (header X-Csrf-Token or field
 * csrf_token) matching /var/local/emhttp/var.ini — same model the stock
 * webGUI update.php uses.
 */

header('Content-Type: application/json');

const CFG_DIR = '/boot/config/plugins/unraid-mcp';
const ENV_FILE = CFG_DIR . '/.env';
const CFG_FILE = CFG_DIR . '/unraid-mcp.cfg';
const RC = '/etc/rc.d/rc.unraid-mcp';
const UPDATE_SH = '/usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-update.sh';
const PID_FILE = '/var/run/unraid-mcp.pid';

/** Env keys whose values must never be sent back to the browser. */
const SECRET_KEYS = [
    'UNRAID_API_KEY',
    'UNRAID_MCP_BEARER_TOKEN',
    'UNRAID_MCP_GOOGLE_CLIENT_SECRET',
    'UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY',
    'UNRAID_MCP_GOOGLE_ENCRYPTION_KEY',
];

/**
 * The exhaustive set of keys the settings UI may write. Writes are gated on
 * this list (NOT a broad UNRAID_* prefix) so a value crossing the endpoint
 * cannot persist unmanaged keys like UNRAID_CREDENTIALS_DIR that alter runtime
 * behavior the page never exposes. Must stay in sync with web/src/fields.ts.
 */
const ALLOWED_KEYS = [
    'UNRAID_API_URL',
    'UNRAID_API_KEY',
    'UNRAID_VERIFY_SSL',
    'UNRAID_ALLOW_INSECURE_TLS',
    'UNRAID_MCP_TRANSPORT',
    'UNRAID_MCP_HOST',
    'UNRAID_MCP_PORT',
    'UNRAID_MCP_TAILSCALE_SERVE',
    'UNRAID_MCP_LOG_LEVEL',
    'UNRAID_MCP_LOG_FILE',
    'UNRAID_MCP_BEARER_TOKEN',
    'UNRAID_MCP_DISABLE_HTTP_AUTH',
    'UNRAID_MCP_TRUST_PROXY',
    'UNRAID_MCP_MAX_RESPONSE_BYTES',
    'UNRAID_AUTO_START_SUBSCRIPTIONS',
    'UNRAID_MAX_RECONNECT_ATTEMPTS',
    'UNRAID_SUBSCRIPTION_COLLECT_MAX_EVENTS',
    'UNRAID_SUBSCRIPTION_COLLECT_MAX_BYTES',
    'UNRAID_SUBSCRIPTION_COLLECT_MAX_SECONDS',
    'UNRAID_SUBSCRIPTION_CACHE_MAX_AGE_SECONDS',
    'UNRAID_SUBSCRIPTION_TIMEOUT_MAX_SECONDS',
    'UNRAID_MCP_ENABLE_RAW_SUBSCRIPTION_PROBE',
    'UNRAID_MCP_GOOGLE_CLIENT_ID',
    'UNRAID_MCP_GOOGLE_CLIENT_SECRET',
    'UNRAID_MCP_GOOGLE_BASE_URL',
    'UNRAID_MCP_GOOGLE_ALLOWED_EMAILS',
    'UNRAID_MCP_GOOGLE_ALLOWED_DOMAINS',
    'UNRAID_MCP_GOOGLE_ALLOW_ANY_USER',
    'UNRAID_MCP_GOOGLE_REQUIRED_SCOPES',
    'UNRAID_MCP_GOOGLE_REDIRECT_PATH',
    'UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY',
    'UNRAID_MCP_GOOGLE_ENCRYPTION_KEY',
    'UNRAID_MCP_GOOGLE_STORAGE_DIR',
];

function fail(int $code, string $msg): void
{
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

/** Parse a dotenv file into [key => value], tolerating quotes and comments. */
function read_env(string $path): array
{
    $out = [];
    foreach (@file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }
        [$k, $v] = explode('=', $line, 2);
        $k = trim($k);
        $v = trim($v);
        if (strlen($v) >= 2 && ($v[0] === '"' || $v[0] === "'") && str_ends_with($v, $v[0])) {
            $v = substr($v, 1, -1);
        }
        $out[$k] = $v;
    }
    return $out;
}

/** Serialize + write atomically, enforcing 600 before content lands. */
function write_env(string $path, array $env): void
{
    $lines = ["# unraid-mcp configuration — managed by the plugin settings page.",
              "# Manual edits are preserved for keys the UI does not manage."];
    foreach ($env as $k => $v) {
        $lines[] = $k . "='" . str_replace("'", "'\\''", (string) $v) . "'";
    }
    $tmp = $path . '.tmp';
    if (is_link($tmp)) {
        @unlink($tmp); // never follow a pre-planted symlink
    }
    // Create the temp file already restricted (0600) rather than chmod-after,
    // closing the brief world-readable window. On the FAT32 flash the mount
    // umask governs the real mode, so this is belt-and-braces.
    $old = umask(0077);
    $ok = @file_put_contents($tmp, implode("\n", $lines) . "\n");
    umask($old);
    if ($ok === false) {
        fail(500, 'failed to write config');
    }
    @chmod($tmp, 0600);
    if (!@rename($tmp, $path)) {
        @unlink($tmp);
        fail(500, 'failed to move config into place');
    }
    @chmod(CFG_DIR, 0700);
    @chmod($path, 0600);
}

function service_running(): bool
{
    exec(RC . ' status 2>/dev/null', $out, $code);
    return $code === 0;
}

function tailscale_info(): array
{
    $bin = '/usr/local/sbin/tailscale';
    if (!is_executable($bin)) {
        return ['available' => false, 'dnsName' => '', 'serveActive' => false];
    }
    exec($bin . ' status --json 2>/dev/null', $out, $code);
    $dns = '';
    if ($code === 0) {
        $status = json_decode(implode('', $out), true);
        $dns = rtrim((string) ($status['Self']['DNSName'] ?? ''), '.');
    }
    exec($bin . ' serve status 2>/dev/null', $serveOut, $serveCode);
    $serveActive = $serveCode === 0 && str_contains(implode("\n", $serveOut), ':6970');
    // serveActive is a heuristic on the default port; the rc script owns truth.
    return ['available' => $dns !== '', 'dnsName' => $dns, 'serveActive' => $serveActive];
}

function process_stats(): array
{
    $pid = (int) @trim((string) @file_get_contents(PID_FILE));
    if ($pid <= 0 || !is_dir("/proc/$pid")) {
        return ['pid' => 0, 'cpu' => 0.0, 'memMB' => 0.0, 'uptime' => 0];
    }
    // Sum the process group (parent + worker threads/children share the tree).
    $out = [];
    exec('ps -o %cpu=,rss=,etimes= -p ' . $pid . ' 2>/dev/null', $out);
    $cpu = 0.0;
    $rss = 0.0;
    $etimes = 0;
    if (!empty($out[0])) {
        $parts = preg_split('/\\s+/', trim($out[0]));
        $cpu = (float) ($parts[0] ?? 0);
        $rss = (float) ($parts[1] ?? 0);
        $etimes = (int) ($parts[2] ?? 0);
    }
    return [
        'pid' => $pid,
        'cpu' => round($cpu, 1),
        'memMB' => round($rss / 1024, 1),
        'uptime' => $etimes,
    ];
}

function version_info(): array
{
    $installed = trim((string) @shell_exec(escapeshellarg(UPDATE_SH) . ' installed 2>/dev/null'));
    $overlay = trim((string) @shell_exec(escapeshellarg(UPDATE_SH) . ' which 2>/dev/null'));
    return [
        'installed' => $installed ?: 'unknown',
        'overlay' => str_contains($overlay, '/appdata/'),
    ];
}

function current_payload(): array
{
    $env = read_env(ENV_FILE);
    $cfg = @parse_ini_file(CFG_FILE) ?: [];
    $config = [];
    foreach (ALLOWED_KEYS as $key) {
        if (in_array($key, SECRET_KEYS, true)) {
            $config[$key . '_configured'] = isset($env[$key]) && $env[$key] !== '';
        } else {
            $config[$key] = $env[$key] ?? '';
        }
    }
    // Anything in the file the UI doesn't manage, shown read-only (non-secret).
    $extra = [];
    foreach ($env as $k => $v) {
        if (!in_array($k, ALLOWED_KEYS, true) && !in_array($k, SECRET_KEYS, true)) {
            $extra[$k] = $v;
        }
    }
    return [
        'config' => $config,
        'extra' => $extra,
        'service' => [
            'enabled' => ($cfg['SERVICE'] ?? 'disabled') === 'enabled',
            'running' => service_running(),
        ],
        'tailscale' => tailscale_info(),
        'version' => version_info(),
        'process' => process_stats(),
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(current_payload());
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'method not allowed');
}
// CSRF for this POST was already enforced by the global auto_prepend
// (webGui/include/local_prepend.php) before this script ran — the same gate
// every stock webGUI page uses. No plugin-level re-check needed.

$body = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($body)) {
    fail(400, 'invalid json body');
}

$action = $body['action'] ?? 'save';

if ($action === 'reveal') {
    // Return a stored secret to the (already session+CSRF authenticated)
    // webGUI admin — the bearer token exists to be copied into MCP clients.
    $key = $body['key'] ?? '';
    if (!in_array($key, SECRET_KEYS, true)) {
        fail(400, 'not a secret key');
    }
    $env = read_env(ENV_FILE);
    echo json_encode(['key' => $key, 'value' => $env[$key] ?? '']);
    exit;
}

if ($action === 'stats') {
    // Cheap poll for the dashboard: live service/process state, no env reads.
    $cfg = @parse_ini_file(CFG_FILE) ?: [];
    echo json_encode([
        'service' => [
            'enabled' => ($cfg['SERVICE'] ?? 'disabled') === 'enabled',
            'running' => service_running(),
        ],
        'process' => process_stats(),
    ]);
    exit;
}

if ($action === 'checkUpdate') {
    // Contacts GitHub — kept behind an explicit user click, not in every GET.
    $latest = trim((string) @shell_exec(escapeshellarg(UPDATE_SH) . ' latest 2>/dev/null'));
    echo json_encode(['latest' => $latest]);
    exit;
}

if ($action === 'update' || $action === 'resetVersion') {
    if ($action === 'update') {
        $ver = (string) ($body['version'] ?? '');
        if ($ver !== '' && !preg_match('/^v?\\d+\\.\\d+\\.\\d+$/', $ver)) {
            fail(400, 'invalid version');
        }
        $cmd = escapeshellarg(UPDATE_SH) . ' update ' . escapeshellarg($ver);
    } else {
        $cmd = escapeshellarg(UPDATE_SH) . ' reset';
    }
    // Stop first so the interpreter being replaced isn't in use (an overlay
    // venv can't be deleted while the running server holds files open in it).
    $wasRunning = service_running();
    if ($wasRunning) {
        exec(RC . ' stop >/dev/null 2>&1');
    }
    $out = [];
    $code = 0;
    exec($cmd . ' 2>&1', $out, $code);
    if ($wasRunning) {
        exec(RC . ' start >/dev/null 2>&1');
    }
    if ($code !== 0) {
        fail(500, 'update failed: ' . trim(implode(' ', array_slice($out, -3))));
    }
    echo json_encode(current_payload());
    exit;
}

if ($action === 'logs') {
    $lines = (int) ($body['lines'] ?? 200);
    $lines = max(10, min(1000, $lines));
    $log = '/var/log/unraid-mcp/server.log';
    $out = [];
    if (is_readable($log)) {
        exec('tail -n ' . $lines . ' ' . escapeshellarg($log), $out);
    }
    // Defense in depth: never surface a secret-looking value even if the
    // server ever logs one. Redact assignments to *KEY/TOKEN/SECRET names.
    $text = preg_replace(
        '/(UNRAID_[A-Z0-9_]*(?:KEY|TOKEN|SECRET)[A-Z0-9_]*\s*[=:]\s*)\S+/i',
        '$1<redacted>',
        implode("\n", $out)
    );
    echo json_encode(['log' => $text]);
    exit;
}

if ($action === 'service') {
    // {action: "service", op: "start"|"stop"|"restart"|"enable"|"disable"}
    $op = $body['op'] ?? '';
    if (in_array($op, ['enable', 'disable'], true)) {
        $enabled = $op === 'enable' ? 'enabled' : 'disabled';
        @file_put_contents(CFG_FILE, "SERVICE=\"$enabled\"\n");
        @chmod(CFG_FILE, 0600);
        if ($op === 'enable' && !service_running()) {
            exec(RC . ' start >/dev/null 2>&1');
        }
        if ($op === 'disable' && service_running()) {
            exec(RC . ' stop >/dev/null 2>&1');
        }
    } elseif (in_array($op, ['start', 'stop', 'restart'], true)) {
        exec(RC . ' ' . $op . ' >/dev/null 2>&1');
    } else {
        fail(400, 'unknown service op');
    }
    echo json_encode(current_payload());
    exit;
}

if ($action !== 'save') {
    fail(400, 'unknown action');
}

$changes = $body['changes'] ?? null;
if (!is_array($changes)) {
    fail(400, 'missing changes object');
}

$env = read_env(ENV_FILE);
foreach ($changes as $key => $value) {
    if (!in_array($key, ALLOWED_KEYS, true)) {
        fail(400, "key not allowed: $key");
    }
    if (!is_string($value)) {
        fail(400, "value for $key must be a string");
    }
    if (preg_match('/[\r\n]/', $value)) {
        fail(400, "value for $key must not contain newlines");
    }
    if ($value === '') {
        unset($env[$key]); // empty value removes the line
    } else {
        $env[$key] = $value;
    }
}
write_env(ENV_FILE, $env);

if (service_running()) {
    exec(RC . ' restart >/dev/null 2>&1');
}
echo json_encode(current_payload());
