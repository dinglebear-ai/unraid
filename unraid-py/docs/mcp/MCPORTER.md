# Live Smoke Testing

End-to-end verification for `unraid-mcp` is split between the canonical live
runner and the destructive-action mcporter harness.

## Canonical Runner

Use [`tests/test_live.sh`](../../tests/test_live.sh) for non-destructive live
coverage. It drives the MCP server directly with JSON-RPC over HTTP, Docker, or
stdio; it does not require mcporter.

```bash
./tests/test_live.sh
./tests/test_live.sh --mode http
./tests/test_live.sh --mode docker
./tests/test_live.sh --mode stdio
./tests/test_live.sh --mode http --skip-auth
./tests/test_live.sh --mode http --url https://unraid.tootie.tv/mcp --skip-auth
```

The live tool phase covers read-only subactions across all domains. Schema-drift
coverage includes:

- `system/network_interfaces`
- `onboarding/internal_boot_context`
- `live/network_metrics`
- `subscriptions/test_query` for `systemMetricsNetwork`

Live API/config-dependent probes may report `SKIP` when the upstream appliance
does not expose the newer field yet or an optional subsystem has no data. Skips
are explicit in the summary so coverage gaps are visible without failing an
otherwise healthy transport smoke-test.

See [`tests/TEST_COVERAGE.md`](../../tests/TEST_COVERAGE.md) for the full phase
breakdown and assertion model.

## mcporter Harness

mcporter is still used for destructive-action testing in
[`tests/mcporter/test-destructive.sh`](../../tests/mcporter/test-destructive.sh).
The script is dry-run by default and requires `--confirm` before it executes any
destructive test case.

```bash
./tests/mcporter/test-destructive.sh
./tests/mcporter/test-destructive.sh --confirm
```

The destructive harness uses create-to-delete patterns where safe, skips global
blast-radius actions, and runs over stdio by spawning `uv run unraid-mcp-server`
per call.

## Operation Inventory

Before adding or changing live smoke coverage, compare the script against the
generated operation inventory and parity report:

```bash
scripts/list_graphql_operations.py
scripts/list_graphql_operations.py --json
scripts/report_api_parity.py
scripts/report_api_parity.py --json
```

The inventory is derived from the same action/subaction query and mutation
dictionaries used by the schema dispatch tests.

## CI Integration

The CI MCP integration workflow runs `tests/test_live.sh` for same-repo pushes
and PRs where the required Unraid secrets are available.

## See Also

- [TESTS.md](TESTS.md) -- Unit and specialized test suites
- [CICD.md](CICD.md) -- CI workflow configuration
- [../../tests/mcporter/README.md](../../tests/mcporter/README.md) -- mcporter-specific destructive test details
