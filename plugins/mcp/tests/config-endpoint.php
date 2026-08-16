<?php

declare(strict_types=1);

define('UNRAID_MCP_CONFIG_LIBRARY_ONLY', true);
require __DIR__ . '/../source/usr/local/emhttp/plugins/unraid-mcp/include/config.php';

$case = $argv[1] ?? '';
if ($case === 'unsafe-noauth') {
    validate_env([
        'UNRAID_API_URL' => 'http://127.0.0.1/graphql',
        'UNRAID_RMCP_HOST' => '0.0.0.0',
        'UNRAID_RMCP_PORT' => '40010',
        'UNRAID_RMCP_AUTH_MODE' => 'bearer',
        'UNRAID_RMCP_DISABLE_HTTP_AUTH' => 'true',
        'UNRAID_NOAUTH' => 'false',
    ]);
    fwrite(STDERR, "unsafe no-auth configuration was accepted
");
    exit(1);
}
if ($case === 'missing-api-key') {
    validate_startable_env([
        'UNRAID_API_URL' => 'http://127.0.0.1/graphql',
        'UNRAID_RMCP_HOST' => '127.0.0.1',
        'UNRAID_RMCP_PORT' => '40010',
        'UNRAID_RMCP_AUTH_MODE' => 'bearer',
        'UNRAID_RMCP_TOKEN' => 'test-token',
        'UNRAID_RMCP_DISABLE_HTTP_AUTH' => 'false',
    ]);
    fwrite(STDERR, "startable config accepted a missing API key" . PHP_EOL);
    exit(1);
}
if ($case === 'incomplete-oauth') {
    validate_env([
        'UNRAID_API_URL' => 'http://127.0.0.1/graphql',
        'UNRAID_RMCP_HOST' => '127.0.0.1',
        'UNRAID_RMCP_PORT' => '40010',
        'UNRAID_RMCP_AUTH_MODE' => 'oauth',
        'UNRAID_RMCP_DISABLE_HTTP_AUTH' => 'false',
        'UNRAID_NOAUTH' => 'false',
        'UNRAID_RMCP_PUBLIC_URL' => 'http://mcp.example.com',
    ]);
    fwrite(STDERR, "incomplete OAuth configuration was accepted
");
    exit(1);
}

function expect_same(mixed $expected, mixed $actual, string $message): void
{
    if ($expected !== $actual) {
        fwrite(STDERR, $message . PHP_EOL);
        fwrite(STDERR, 'expected: ' . var_export($expected, true) . PHP_EOL);
        fwrite(STDERR, 'actual:   ' . var_export($actual, true) . PHP_EOL);
        exit(1);
    }
}

$tmp = tempnam(sys_get_temp_dir(), 'unraid-mcp-env-');
if ($tmp === false) {
    throw new RuntimeException('could not create temp env file');
}

$values = [
    'PLAIN' => 'hello world',
    'APOSTROPHE' => "Jake's server",
    'BACKSLASH' => 'C:\server\path',
    'SHELL_TEXT' => '$(not-a-command) still-text',
];
write_env($tmp, $values);
expect_same($values, read_env($tmp), 'dotenv values did not round-trip');
$serialized = (string) file_get_contents($tmp);
if (!str_contains($serialized, "APOSTROPHE='Jake'\\''s server'")) {
    fwrite(STDERR, 'apostrophe was not serialized with POSIX shell quoting' . PHP_EOL);
    exit(1);
}
file_put_contents($tmp, "BAD;KEY='must-not-survive'" . PHP_EOL, FILE_APPEND);
expect_same(false, array_key_exists('BAD;KEY', read_env($tmp)), 'invalid dotenv key was preserved');
@unlink($tmp);

$valid = [
    'UNRAID_API_URL' => 'http://127.0.0.1/graphql',
    'UNRAID_RMCP_HOST' => '127.0.0.1',
    'UNRAID_RMCP_PORT' => '40010',
    'UNRAID_RMCP_AUTH_MODE' => 'bearer',
    'UNRAID_RMCP_TOKEN' => 'test-token',
    'UNRAID_API_SKIP_TLS_VERIFY' => 'false',
    'UNRAID_MCP_TAILSCALE_SERVE' => 'false',
    'UNRAID_RMCP_DISABLE_HTTP_AUTH' => 'false',
    'UNRAID_NOAUTH' => 'false',
    'RUST_LOG' => 'info',
    'UNRAID_RMCP_ENABLED_TOOLS' => 'array,docker',
];
validate_env($valid);
expect_same(true, is_valid_bind_host('tower.local'), 'valid hostname was rejected');
expect_same(false, is_valid_bind_host('127.999.1.1'), 'invalid dotted numeric address was accepted');
expect_same(true, is_loopback_host('127.42.1.9'), '127/8 loopback was not recognized');
expect_same(true, is_loopback_host('[::1]'), 'IPv6 loopback was not recognized');
expect_same(false, process_is_runraid_server(getmypid()), 'PHP test process was mistaken for runraid serve');
expect_same(false, in_array('UNRAID_MCP_GOOGLE_JWT_SIGNING_KEY', REVEALABLE_SECRET_KEYS, true), 'legacy JWT key became browser-revealable');
expect_same(true, in_array('UNRAID_RMCP_TOKEN', REVEALABLE_SECRET_KEYS, true), 'bearer token must remain copyable');

echo "Unraid MCP config endpoint tests passed\n";
