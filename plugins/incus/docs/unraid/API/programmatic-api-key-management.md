Programmatic API key management | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This guide explains how to create, use, and delete API keys programmatically using the Unraid API CLI, enabling automated workflows and scripts.
## Overview[​](#overview)
The `unraid-api apikey` command supports both interactive and non-interactive modes, making it suitable for automated deployment scripts, CI/CD pipelines, temporary access provisioning, and infrastructure as code workflows.
## Creating API keys[​](#creating-api-keys)
**Basic creation with JSON output:**
Use the `--json` flag to get machine-readable output:
```
`
unraid-api apikey --create --name "workflow key" --roles ADMIN --json
`
```
**Output:**
```
`
{
"key": "your-generated-api-key-here",
"name": "workflow key",
"id": "generated-uuid"
}
`
```
**Advanced creation with permissions:**
```
`
unraid-api apikey --create \\
--name "limited access key" \\
--permissions "DOCKER:READ\_ANY,ARRAY:READ\_ANY" \\
--description "Read-only access for monitoring" \\
--json
`
```
**Handling existing keys:**
If a key with the same name exists, use `--overwrite`:
```
`
unraid-api apikey --create --name "existing key" --roles ADMIN --overwrite --json
`
```
warning
The `--overwrite` flag will permanently replace the existing key. The old key will be immediately invalidated.
## Deleting API keys[​](#deleting-api-keys)
**Non-interactive deletion:**
Delete a key by name without prompts:
```
`
unraid-api apikey --delete --name "workflow key"
`
```
**Output:**
```
`
Successfully deleted 1 API key
`
```
**JSON output for deletion:**
Use `--json` flag for machine-readable delete confirmation:
```
`
unraid-api apikey --delete --name "workflow key" --json
`
```
**Success Output:**
```
`
{
"deleted": 1,
"keys": [
{
"id": "generated-uuid",
"name": "workflow key"
}
]
}
`
```
**Error Output:**
```
`
{
"deleted": 0,
"error": "No API key found with name: nonexistent key"
}
`
```
**Error handling:**
When the specified key doesn't exist:
```
`
unraid-api apikey --delete --name "nonexistent key"
# Output: No API keys found to delete
`
```
**JSON Error Output:**
```
`
{
"deleted": 0,
"message": "No API keys found to delete"
}
`
```
## Complete workflow example[​](#complete-workflow-example)
This example demonstrates temporary access provisioning:
```
`
#!/bin/bash
set -e
# 1. Create temporary API key
echo "Creating temporary API key..."
KEY\_DATA=$(unraid-api apikey --create \\
--name "temp deployment key" \\
--roles ADMIN \\
--description "Temporary key for deployment $(date)" \\
--json)
# 2. Extract the API key
API\_KEY=$(echo "$KEY\_DATA" | jq -r '.key')
echo "API key created successfully"
# 3. Use the key for operations
echo "Configuring services..."
curl -H "Authorization: Bearer $API\_KEY" \\
-H "Content-Type: application/json" \\
-d '{"provider": "azure", "clientId": "your-client-id"}' \\
http://localhost:3001/graphql
# 4. Clean up (always runs, even on error)
trap 'echo "Cleaning up..."; unraid-api apikey --delete --name "temp deployment key"' EXIT
echo "Deployment completed successfully"
`
```
## Command reference[​](#command-reference)
**Create command options:**
|FlagDescriptionExample|`--name \<name\>`Key name (required)`--name "my key"`|`--roles \<roles\>`Comma-separated roles`--roles ADMIN,VIEWER`|`--permissions \<perms\>`Resource:action pairs`--permissions "DOCKER:READ\_ANY"`|`--description \<desc\>`Key description`--description "CI/CD key"`|`--overwrite`Replace existing key`--overwrite`|`--json`Machine-readable output`--json`
**Available roles:** `ADMIN` (full system access), `CONNECT` (Unraid Connect features), `VIEWER` (read-only access), `GUEST` (limited access).
**Available resources:** `ACTIVATION\_CODE`, `API\_KEY`, `ARRAY`, `CLOUD`, `CONFIG`, `CONNECT`, `CONNECT\_\_REMOTE\_ACCESS`, `CUSTOMIZATIONS`, `DASHBOARD`, `DISK`, `DISPLAY`, `DOCKER`, `FLASH`, `INFO`, `LOGS`, `ME`, `NETWORK`, `NOTIFICATIONS`, `ONLINE`, `OS`, `OWNER`, `PERMISSION`, `REGISTRATION`, `SERVERS`, `SERVICES`, `SHARE`, `VARS`, `VMS`, `WELCOME`.
**Available actions:** `CREATE\_ANY`, `CREATE\_OWN`, `READ\_ANY`, `READ\_OWN`, `UPDATE\_ANY`, `UPDATE\_OWN`, `DELETE\_ANY`, `DELETE\_OWN`.
**Delete command options:**
|FlagDescriptionExample|`--delete`Enable delete mode`--delete`|`--name \<name\>`Key to delete (optional)`--name "my key"`
If `--name` is omitted, the command runs interactively.
Use specific permissions instead of ADMIN role when possible (for example, `--permissions "DOCKER:READ\_ANY"` instead of `--roles ADMIN`). Always clean up temporary keys after use and store API keys securely (environment variables, secrets management). Use descriptive names that include purpose and date for audit trails. Note that names must contain only letters, numbers, and spaces (Unicode letters are supported).
Check exit codes (`$?`) after each command. Use `set -e` in bash scripts to fail fast and implement proper cleanup with `trap`.
## Troubleshooting[​](#troubleshooting)
**Common error messages:**
* **"API key name must contain only letters, numbers, and spaces"**: Remove special characters like hyphens, underscores, or symbols.
* **"API key with name 'x' already exists"**: Use `--overwrite` flag or choose a different name.
* **"Please add at least one role or permission to the key"**: Specify either `--roles` or `--permissions` (or both).
For troubleshooting, run with debug logging:
```
`
LOG\_LEVEL=debug unraid-api apikey --create --name "debug key" --roles ADMIN
`
```
* [Overview](#overview)
* [Creating API keys](#creating-api-keys)
* [Deleting API keys](#deleting-api-keys)
* [Complete workflow example](#complete-workflow-example)
* [Command reference](#command-reference)
* [Troubleshooting](#troubleshooting)