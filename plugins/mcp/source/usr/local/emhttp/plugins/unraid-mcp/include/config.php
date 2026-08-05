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
header('Cache-Control: no-store, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

const CFG_DIR = '/boot/config/plugins/unraid-mcp';
const ENV_FILE = CFG_DIR . '/.env';
const CFG_FILE = CFG_DIR . '/unraid-mcp.cfg';
const RC = '/etc/rc.d/rc.unraid-mcp';
const UPDATE_SH = '/usr/local/emhttp/plugins/unraid-mcp/scripts/unraid-mcp-update.sh';
const PID_FILE = '/var/run/unraid-mcp.pid';

/** Env keys whose values must never be sent back to the browser. The two
 *  Python-era Google keys have no UNRAID_RMCP_* successor, so they are not in
 *  LEGACY_KEYS — listing them here keeps them out of the `extra` map on
 *  upgraded boxes. */
const SECRET_KEYS = [
    'UNRAID_API_KEY',
    'UNRAID_RMCP_TOKEN',
    'UNRAID_RMCP_GOOGLE_CLIENT_SECRET',
    'UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY',
    'UNRAID_MCP_GOOGLE_ENCRYPTION_KEY',
];

/** Secrets the settings UI legitimately needs to copy or inspect. Legacy JWT
 * and encryption keys remain hidden but can never be returned to the browser. */
const REVEALABLE_SECRET_KEYS = [
    'UNRAID_API_KEY',
    'UNRAID_RMCP_TOKEN',
    'UNRAID_RMCP_GOOGLE_CLIENT_SECRET',
];

/** Keys the Rust settings UI may persist. Must match web/src/fields.ts. */
const ALLOWED_KEYS = [
    'UNRAID_API_URL',
    'UNRAID_API_KEY',
    'UNRAID_API_SKIP_TLS_VERIFY',
    'UNRAID_RMCP_HOST',
    'UNRAID_RMCP_PORT',
    'UNRAID_MCP_TAILSCALE_SERVE',
    'RUST_LOG',
    'UNRAID_RMCP_TOKEN',
    'UNRAID_RMCP_DISABLE_HTTP_AUTH',
    'UNRAID_NOAUTH',
    'UNRAID_RMCP_ALLOWED_HOSTS',
    'UNRAID_RMCP_ALLOWED_ORIGINS',
    'UNRAID_RMCP_ENABLED_TOOLS',
    'UNRAID_RMCP_DISABLED_TOOLS',
    'UNRAID_RMCP_AUTH_MODE',
    'UNRAID_RMCP_PUBLIC_URL',
    'UNRAID_RMCP_GOOGLE_CLIENT_ID',
    'UNRAID_RMCP_GOOGLE_CLIENT_SECRET',
    'UNRAID_RMCP_AUTH_ADMIN_EMAIL',
];

/** Old Python-server keys accepted while installed configurations migrate. */
const LEGACY_KEYS = [
    'UNRAID_RMCP_HOST' => 'UNRAID_MCP_HOST',
    'UNRAID_RMCP_PORT' => 'UNRAID_MCP_PORT',
    'RUST_LOG' => 'UNRAID_MCP_LOG_LEVEL',
    'UNRAID_RMCP_TOKEN' => 'UNRAID_MCP_BEARER_TOKEN',
    'UNRAID_RMCP_DISABLE_HTTP_AUTH' => 'UNRAID_MCP_DISABLE_HTTP_AUTH',
    'UNRAID_NOAUTH' => 'UNRAID_MCP_TRUST_PROXY',
    'UNRAID_RMCP_PUBLIC_URL' => 'UNRAID_MCP_GOOGLE_BASE_URL',
    'UNRAID_RMCP_GOOGLE_CLIENT_ID' => 'UNRAID_MCP_GOOGLE_CLIENT_ID',
    'UNRAID_RMCP_GOOGLE_CLIENT_SECRET' => 'UNRAID_MCP_GOOGLE_CLIENT_SECRET',
];

/** Resolve a key from the env map: new key, else its legacy Python-era key
 *  from LEGACY_KEYS, else ''. */
function resolve_value(array $env, string $key): string
{
    $legacy = LEGACY_KEYS[$key] ?? '';
    return (string) ($env[$key] ?? ($legacy !== '' ? ($env[$legacy] ?? '') : ''));
}

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
        if (preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $k) !== 1) {
            continue; // never preserve a line that could become shell syntax
        }
        $v = trim($v);
        if (strlen($v) >= 2 && $v[0] === "'" && str_ends_with($v, "'")) {
            $v = substr($v, 1, -1);
            // Reverse write_env()'s POSIX-shell single-quote encoding:
            // foo'bar is serialized as 'foo'\''bar'.
            $v = str_replace("'\\''", "'", $v);
        } elseif (strlen($v) >= 2 && $v[0] === '"' && str_ends_with($v, '"')) {
            $v = substr($v, 1, -1);
            $v = str_replace('\\"', '"', $v);
            $v = str_replace('\\\\', '\\', $v);
        }
        if (preg_match('/[\x00\r\n]/', $v) === 1) {
            continue;
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
        if (preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', (string) $k) !== 1) {
            fail(500, 'refusing invalid config key');
        }
        if (preg_match('/[\x00\r\n]/', (string) $v) === 1) {
            fail(500, 'refusing config value with NUL or line break');
        }
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

function command_result(string $command): array
{
    $out = [];
    $code = 0;
    exec($command . ' 2>&1', $out, $code);
    return [$code, trim(implode(PHP_EOL, array_slice($out, -8)))];
}

function rc_result(string $op): array
{
    return command_result(escapeshellarg(RC) . ' ' . escapeshellarg($op));
}

function require_rc(string $op): void
{
    [$code, $output] = rc_result($op);
    if ($code !== 0) {
        fail(500, "service $op failed" . ($output !== '' ? ": $output" : ''));
    }
}

function write_service_state(bool $enabled): void
{
    $tmp = CFG_FILE . '.tmp';
    if (is_link($tmp)) {
        @unlink($tmp);
    }
    $old = umask(0077);
    $ok = @file_put_contents($tmp, 'SERVICE="' . ($enabled ? 'enabled' : 'disabled') . '"' . PHP_EOL);
    umask($old);
    if ($ok === false || !@rename($tmp, CFG_FILE)) {
        @unlink($tmp);
        fail(500, 'failed to persist service state');
    }
    @chmod(CFG_FILE, 0600);
}

function process_is_runraid_server(int $pid): bool
{
    if ($pid <= 0 || !is_dir("/proc/$pid")) {
        return false;
    }
    $cmdline = @file_get_contents("/proc/$pid/cmdline");
    if ($cmdline === false) {
        return false;
    }
    $args = explode(chr(0), rtrim($cmdline, chr(0)));
    foreach ($args as $index => $arg) {
        if (basename($arg) === 'runraid' && ($args[$index + 1] ?? '') === 'serve') {
            return true;
        }
    }
    return false;
}

function is_true_value(string $value): bool
{
    return in_array(strtolower($value), ['1', 'true', 'yes'], true);
}

function validate_bool_value(array $env, string $key): void
{
    $value = resolve_value($env, $key);
    if ($value !== '' && !in_array(strtolower($value), ['1', '0', 'true', 'false', 'yes', 'no'], true)) {
        fail(400, "$key must be true or false");
    }
}

function validate_url_value(string $key, string $value, bool $httpsOnly = false): void
{
    if ($value === '') {
        return;
    }
    $parts = parse_url($value);
    if ($parts === false || !isset($parts['host'])) {
        fail(400, "$key must be a complete http:// or https:// URL");
    }
    $scheme = strtolower((string) ($parts['scheme'] ?? ''));
    if (!in_array($scheme, ['http', 'https'], true)) {
        fail(400, "$key must be a complete http:// or https:// URL");
    }
    if (isset($parts['user']) || isset($parts['pass'])) {
        fail(400, "$key must not contain embedded credentials");
    }
    if ($httpsOnly && $scheme !== 'https') {
        fail(400, "$key must use https://");
    }
    if ($httpsOnly && (isset($parts['query']) || isset($parts['fragment']))) {
        fail(400, "$key must not contain a query string or fragment");
    }
}

function is_valid_bind_host(string $host): bool
{
    $value = trim($host, '[]');
    if (filter_var($value, FILTER_VALIDATE_IP) !== false) {
        return true;
    }
    if (preg_match('/^[0-9]+(?:\.[0-9]+){3}$/', $value) === 1) {
        return false;
    }
    if (strlen($value) > 253 || str_ends_with($value, '.')) {
        $value = rtrim($value, '.');
    }
    if ($value === '' || strlen($value) > 253) {
        return false;
    }
    foreach (explode('.', $value) as $label) {
        if ($label === '' || strlen($label) > 63
            || preg_match('/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/', $label) !== 1) {
            return false;
        }
    }
    return true;
}

function is_loopback_host(string $host): bool
{
    $host = trim($host, '[]');
    return strcasecmp($host, 'localhost') === 0
        || $host === '::1'
        || (str_starts_with($host, '127.') && filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false);
}

function validate_env(array $env): void
{
    $apiUrl = resolve_value($env, 'UNRAID_API_URL');
    if ($apiUrl === '') {
        fail(400, 'UNRAID_API_URL is required');
    }
    validate_url_value('UNRAID_API_URL', $apiUrl);

    $host = resolve_value($env, 'UNRAID_RMCP_HOST') ?: '0.0.0.0';
    if (strpbrk($host, " \t\r\n/") !== false || !is_valid_bind_host($host)) {
        fail(400, 'UNRAID_RMCP_HOST must be a valid IP address or hostname without a path');
    }

    $port = resolve_value($env, 'UNRAID_RMCP_PORT') ?: '40010';
    if (!ctype_digit($port) || (int) $port < 1 || (int) $port > 65535) {
        fail(400, 'UNRAID_RMCP_PORT must be an integer from 1 to 65535');
    }

    foreach (['UNRAID_API_SKIP_TLS_VERIFY', 'UNRAID_MCP_TAILSCALE_SERVE', 'UNRAID_RMCP_DISABLE_HTTP_AUTH', 'UNRAID_NOAUTH'] as $key) {
        validate_bool_value($env, $key);
    }

    $logLevel = strtolower(resolve_value($env, 'RUST_LOG'));
    if ($logLevel !== '' && !in_array($logLevel, ['trace', 'debug', 'info', 'warn', 'error'], true)) {
        fail(400, 'RUST_LOG must be trace, debug, info, warn, or error');
    }

    $authMode = strtolower(resolve_value($env, 'UNRAID_RMCP_AUTH_MODE') ?: 'bearer');
    if (!in_array($authMode, ['bearer', 'oauth'], true)) {
        fail(400, 'UNRAID_RMCP_AUTH_MODE must be bearer or oauth');
    }

    $authDisabled = is_true_value(resolve_value($env, 'UNRAID_RMCP_DISABLE_HTTP_AUTH'));
    $networkOverride = is_true_value(resolve_value($env, 'UNRAID_NOAUTH'));
    if ($authDisabled && !is_loopback_host($host) && !$networkOverride) {
        fail(400, 'Disabling HTTP auth on a non-loopback bind also requires UNRAID_NOAUTH=true');
    }

    if (!$authDisabled && $authMode === 'bearer' && resolve_value($env, 'UNRAID_RMCP_TOKEN') === '') {
        fail(400, 'UNRAID_RMCP_TOKEN is required in bearer mode');
    }

    if (!$authDisabled && $authMode === 'oauth') {
        validate_url_value('UNRAID_RMCP_PUBLIC_URL', resolve_value($env, 'UNRAID_RMCP_PUBLIC_URL'), true);
        foreach (['UNRAID_RMCP_PUBLIC_URL', 'UNRAID_RMCP_GOOGLE_CLIENT_ID', 'UNRAID_RMCP_GOOGLE_CLIENT_SECRET', 'UNRAID_RMCP_AUTH_ADMIN_EMAIL'] as $key) {
            if (resolve_value($env, $key) === '') {
                fail(400, "$key is required in OAuth mode");
            }
        }
        $email = resolve_value($env, 'UNRAID_RMCP_AUTH_ADMIN_EMAIL');
        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            fail(400, 'UNRAID_RMCP_AUTH_ADMIN_EMAIL must be a valid email address');
        }
    }

    foreach (['UNRAID_RMCP_ENABLED_TOOLS', 'UNRAID_RMCP_DISABLED_TOOLS'] as $key) {
        $value = resolve_value($env, $key);
        if ($value !== '' && count(array_filter(array_map('trim', explode(',', $value)))) === 0) {
            fail(400, "$key must contain at least one selector when set");
        }
    }
}

function validate_startable_env(array $env): void
{
    validate_env($env);
    if (resolve_value($env, 'UNRAID_API_KEY') === '') {
        fail(400, 'UNRAID_API_KEY is required before the service can start');
    }
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
    $env = read_env(ENV_FILE);
    $port = (int) (resolve_value($env, 'UNRAID_RMCP_PORT') ?: 40010);
    exec($bin . ' serve status 2>/dev/null', $serveOut, $serveCode);
    $serveText = implode("\n", $serveOut);
    $serveActive = $serveCode === 0
        && preg_match('/:' . preg_quote((string) $port, '/') . '(?:[^0-9]|$)/', $serveText) === 1;
    // serveActive is a heuristic; the rc script owns the authoritative state.
    return ['available' => $dns !== '', 'dnsName' => $dns, 'serveActive' => $serveActive];
}

function process_stats(): array
{
    $pid = (int) @trim((string) @file_get_contents(PID_FILE));
    if (!process_is_runraid_server($pid)) {
        return ['pid' => 0, 'cpu' => 0.0, 'memMB' => 0.0, 'uptime' => 0];
    }
    // Read the server process identified by the validated PID file.
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
        $value = resolve_value($env, $key);
        if ($key === 'UNRAID_NOAUTH' && !array_key_exists('UNRAID_NOAUTH', $env)) {
            // Mirror unraid-mcp-env.sh: legacy TRUST_PROXY only implies no-auth
            // when the legacy disable-http-auth switch is actually on.
            if (!is_true_value(resolve_value($env, 'UNRAID_RMCP_DISABLE_HTTP_AUTH'))) {
                $value = '';
            }
        }
        if ($key === 'UNRAID_API_SKIP_TLS_VERIFY' && $value === '') {
            $value = (!is_true_value($env['UNRAID_VERIFY_SSL'] ?? 'true')
                && is_true_value($env['UNRAID_ALLOW_INSECURE_TLS'] ?? 'false')) ? 'true' : 'false';
        }
        if (in_array($key, ['UNRAID_API_SKIP_TLS_VERIFY', 'UNRAID_MCP_TAILSCALE_SERVE', 'UNRAID_RMCP_DISABLE_HTTP_AUTH', 'UNRAID_NOAUTH'], true)) {
            $value = is_true_value($value) ? 'true' : 'false';
        }
        if ($key === 'UNRAID_RMCP_AUTH_MODE' && $value === '') {
            $value = 'bearer';
        }
        if ($key === 'RUST_LOG') {
            $value = strtolower($value);
            // Python's WARNING is not a tracing level; tracing spells it "warn"
            // (an invalid level silently falls back to info).
            if ($value === 'warning') {
                $value = 'warn';
            }
        }
        if (in_array($key, SECRET_KEYS, true)) {
            $config[$key . '_configured'] = $value !== '';
        } else {
            $config[$key] = $value;
        }
    }
    // Anything in the file the UI doesn't manage, shown read-only (non-secret).
    $extra = [];
    $legacyKeys = array_values(LEGACY_KEYS);
    foreach ($env as $k => $v) {
        if (!in_array($k, ALLOWED_KEYS, true)
            && !in_array($k, SECRET_KEYS, true)
            && !in_array($k, $legacyKeys, true)
            && !in_array($k, ['UNRAID_VERIFY_SSL', 'UNRAID_ALLOW_INSECURE_TLS'], true)
            && preg_match('/(?:KEY|TOKEN|SECRET)/i', $k) !== 1) {
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

if (defined('UNRAID_MCP_CONFIG_LIBRARY_ONLY') && UNRAID_MCP_CONFIG_LIBRARY_ONLY === true) {
    return;
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
    if (!in_array($key, REVEALABLE_SECRET_KEYS, true)) {
        fail(400, 'secret is not revealable');
    }
    $env = read_env(ENV_FILE);
    echo json_encode(['key' => $key, 'value' => resolve_value($env, $key)]);
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
    // Contacts GitHub only after an explicit user click.
    [$code, $latest] = command_result(escapeshellarg(UPDATE_SH) . ' latest');
    if ($code !== 0 || $latest === '') {
        fail(502, 'update check failed' . ($latest !== '' ? ': ' . $latest : ''));
    }
    echo json_encode(['latest' => trim($latest)]);
    exit;
}

if ($action === 'update' || $action === 'resetVersion') {
    if ($action === 'update') {
        $ver = (string) ($body['version'] ?? '');
        if ($ver !== '' && !preg_match('/^(?:unraid-rs-v|v)?\\d+\\.\\d+\\.\\d+$/', $ver)) {
            fail(400, 'invalid version');
        }
        $cmd = escapeshellarg(UPDATE_SH) . ' stage-update ' . escapeshellarg($ver);
    } else {
        $cmd = escapeshellarg(UPDATE_SH) . ' stage-reset';
    }
    // Stop first so the active overlay binary is not replaced mid-process.
    $wasRunning = service_running();
    if ($wasRunning) {
        [$stopCode, $stopOutput] = rc_result('stop');
        if ($stopCode !== 0) {
            fail(500, 'could not stop the service before the version change' . ($stopOutput !== '' ? ': ' . $stopOutput : ''));
        }
    }

    $updateCommand = escapeshellarg(UPDATE_SH);
    [$code, $output] = command_result($cmd);
    if ($code !== 0) {
        // A transaction may or may not have started before the updater failed.
        // Rollback is best-effort here; "no previous transaction" simply means
        // the original overlay was never touched.
        command_result($updateCommand . ' rollback');
        $restoreCode = 0;
        $restoreOutput = '';
        if ($wasRunning) {
            [$restoreCode, $restoreOutput] = rc_result('start');
        }
        $message = 'version change failed' . ($output !== '' ? ': ' . $output : '');
        if ($restoreCode !== 0) {
            $message .= '; restoring the previous service also failed' . ($restoreOutput !== '' ? ': ' . $restoreOutput : '');
        }
        fail(500, $message);
    }

    if ($wasRunning) {
        [$restartCode, $restartOutput] = rc_result('start');
        if ($restartCode !== 0) {
            [$rollbackCode, $rollbackOutput] = command_result($updateCommand . ' rollback');
            $restoreCode = 1;
            $restoreOutput = '';
            if ($rollbackCode === 0) {
                [$restoreCode, $restoreOutput] = rc_result('start');
            }
            $message = 'the new runtime failed to start and was rolled back' . ($restartOutput !== '' ? ': ' . $restartOutput : '');
            if ($rollbackCode !== 0) {
                $message .= '; runtime rollback also failed' . ($rollbackOutput !== '' ? ': ' . $rollbackOutput : '');
            } elseif ($restoreCode !== 0) {
                $message .= '; the previous service failed to restart' . ($restoreOutput !== '' ? ': ' . $restoreOutput : '');
            }
            fail(500, $message);
        }
    }

    [$commitCode, $commitOutput] = command_result($updateCommand . ' commit');
    if ($commitCode !== 0) {
        fail(500, 'version changed successfully, but transaction cleanup failed' . ($commitOutput !== '' ? ': ' . $commitOutput : ''));
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
    $op = (string) ($body['op'] ?? '');
    if ($op === 'enable') {
        validate_startable_env(read_env(ENV_FILE));
        write_service_state(true);
        if (!service_running()) {
            [$code, $output] = rc_result('start');
            if ($code !== 0) {
                write_service_state(false);
                fail(500, 'service enable failed' . ($output !== '' ? ': ' . $output : ''));
            }
        }
    } elseif ($op === 'disable') {
        write_service_state(false);
        require_rc('stop');
    } elseif (in_array($op, ['start', 'restart'], true)) {
        validate_startable_env(read_env(ENV_FILE));
        require_rc($op);
    } elseif ($op === 'stop') {
        require_rc('stop');
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
$previousEnv = $env;
foreach ($changes as $key => $value) {
    if (!in_array($key, ALLOWED_KEYS, true)) {
        fail(400, "key not allowed: $key");
    }
    if (!is_string($value)) {
        fail(400, "value for $key must be a string");
    }
    if (preg_match('/[\x00\r\n]/', $value)) {
        fail(400, "value for $key must not contain NUL or line breaks");
    }
    $legacy = LEGACY_KEYS[$key] ?? '';
    if ($legacy !== '') {
        unset($env[$legacy]);
    }
    if ($key === 'UNRAID_API_SKIP_TLS_VERIFY') {
        unset($env['UNRAID_VERIFY_SSL'], $env['UNRAID_ALLOW_INSECURE_TLS']);
    }
    if ($value === '') {
        unset($env[$key]); // empty value removes the line
    } else {
        $env[$key] = $value;
    }
}
$wasRunning = service_running();
if ($wasRunning) {
    validate_startable_env($env);
} else {
    validate_env($env);
}
write_env(ENV_FILE, $env);

if ($wasRunning) {
    [$restartCode, $restartOutput] = rc_result('restart');
    if ($restartCode !== 0) {
        // The new config was syntactically valid to the web layer but rejected
        // by runraid or failed at runtime. Restore the exact prior env and bring
        // the previous service back instead of persisting a broken deployment.
        write_env(ENV_FILE, $previousEnv);
        [$restoreCode, $restoreOutput] = rc_result('start');
        $message = 'settings were rejected by the running service; the previous configuration was restored';
        if ($restartOutput !== '') {
            $message .= ': ' . $restartOutput;
        }
        if ($restoreCode !== 0) {
            $message .= '; restoring the previous service also failed';
            if ($restoreOutput !== '') {
                $message .= ': ' . $restoreOutput;
            }
        }
        fail(500, $message);
    }
}
echo json_encode(current_payload());
