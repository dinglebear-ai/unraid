CLI reference | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
All commands follow the pattern: `unraid-api \<command\> [options]`.
## Service management[​](#service-management)
### Start[​](#start)
```
`
unraid-api start [--log-level \<level\>]
`
```
Starts the Unraid API service.
Options:
* `--log-level`: Set logging level (trace|debug|info|warn|error|fatal)
Alternative: You can also set the log level using the `LOG\_LEVEL` environment variable:
```
`
LOG\_LEVEL=trace unraid-api start
`
```
### Stop[​](#stop)
```
`
unraid-api stop [--delete]
`
```
Stops the Unraid API service.
* `--delete`: Optional. Delete the PM2 home directory.
### Restart[​](#restart)
```
`
unraid-api restart [--log-level \<level\>]
`
```
Restarts the Unraid API service.
Options:
* `--log-level`: Set logging level (trace|debug|info|warn|error|fatal)
Alternative: You can also set the log level using the `LOG\_LEVEL` environment variable:
```
`
LOG\_LEVEL=trace unraid-api restart
`
```
### Logs[​](#logs)
```
`
unraid-api logs [-l \<lines\>]
`
```
View the API logs.
* `-l, --lines`: Optional. Number of lines to tail (default: 100)
## Configuration commands[​](#configuration-commands)
### Config[​](#config)
```
`
unraid-api config
`
```
Displays current configuration values.
### Switch environment[​](#switch-environment)
```
`
unraid-api switch-env [-e \<environment\>]
`
```
Switch between production and staging environments.
* `-e, --environment`: Optional. Target environment (production|staging).
### Developer mode[​](#developer-mode)
You can also manage developer options through the web interface at ***Settings → Management Access → Developer Options*** in the WebGUI.
```
`
unraid-api developer # Interactive prompt for tools
unraid-api developer --sandbox true # Enable %%GraphQL|graphql%% sandbox
unraid-api developer --sandbox false # Disable %%GraphQL|graphql%% sandbox
unraid-api developer --enable-modal # Enable modal testing tool
unraid-api developer --disable-modal # Disable modal testing tool
`
```
Configure developer features for the API:
* **GraphQL Sandbox**: Enable/disable Apollo GraphQL sandbox at `/graphql`
* **Modal Testing Tool**: Enable/disable UI modal testing in the Unraid menu
## API key management[​](#api-key-management)
You can also manage API keys through the web interface at ***Settings → Management Access → API Keys*** in the WebGUI.
### API key commands[​](#api-key-commands)
```
`
unraid-api apikey [options]
`
```
Create and manage API keys via CLI.
Options:
* `--name \<name\>`: Name of the key
* `--create`: Create a new key
* `-r, --roles \<roles\>`: Comma-separated list of roles
* `-p, --permissions \<permissions\>`: Comma-separated list of permissions
* `-d, --description \<description\>`: Description for the key
## SSO (Single Sign-On) management[​](#ssosso-single-sign-on-management)
For OIDC/SSO provider configuration, see the web interface at ***Settings → Management Access → API → OIDC*** in the WebGUI or refer to the [OIDC Provider Setup](/API/oidc-provider-setup/) guide.
### SSO base command[​](#sso-base-command)
```
`
unraid-api sso
`
```
**Add SSO user:**
```
`
unraid-api sso add-user
# or
unraid-api sso add
# or
unraid-api sso a
`
```
**Remove SSO user:**
```
`
unraid-api sso remove-user
# or
unraid-api sso remove
# or
unraid-api sso r
`
```
**List SSO users:**
```
`
unraid-api sso list-users
# or
unraid-api sso list
# or
unraid-api sso l
`
```
**Validate SSO token:**
Validates an SSO token and returns its status.
```
`
unraid-api sso validate-token \<token\>
# or
unraid-api sso validate
# or
unraid-api sso v
`
```
## Report generation[​](#report-generation)
### Generate report[​](#generate-report)
```
`
unraid-api report [-r] [-j]
`
```
Generate a system report.
* `-r, --raw`: Display raw command output
* `-j, --json`: Display output in JSON format
Most commands require appropriate permissions to modify system state. Some commands require the API to be running or stopped. Store API keys securely as they provide system access. SSO configuration changes may require a service restart.
* [Service management](#service-management)
* [Start](#start)
* [Stop](#stop)
* [Restart](#restart)
* [Logs](#logs)
* [Configuration commands](#configuration-commands)
* [Config](#config)
* [Switch environment](#switch-environment)
* [Developer mode](#developer-mode)
* [API key management](#api-key-management)
* [API key commands](#api-key-commands)
* [%%SSO|sso%% (Single Sign-On) management](#ssosso-single-sign-on-management)
* [SSO base command](#sso-base-command)
* [Report generation](#report-generation)
* [Generate report](#generate-report)