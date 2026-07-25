Using the Unraid API | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
The Unraid API provides a GraphQL interface that allows you to interact with your Unraid server. This guide covers authentication, common queries, and usage patterns.
## Enabling the GraphQL sandbox[​](#enabling-the-graphql-sandbox)
### WebGUI method (recommended)[​](#webgui-method-recommended)
📖 Live Documentation
**View the complete API schema and documentation:**
**[View Live Documentation in Apollo GraphQL Studio →](https://studio.apollographql.com/graph/Unraid-API/variant/current/home)**
The Apollo GraphQL Studio provides a comprehensive view of all available queries, mutations, types, and fields with full documentation. Use it to explore the schema structure and understand available operations.
### WebGUI method (recommended)[​](#webgui-method-recommended-1)
Using the WebGUI is the easiest way to enable the GraphQL sandbox:
1. Navigate to ***Settings → Management Access → Developer Options***
2. Enable the **GraphQL Sandbox** toggle
3. Access the GraphQL playground by navigating to:
```
`
http://YOUR\_SERVER\_IP/graphql
`
```
### CLI method[​](#cli-method)
Alternatively, you can enable developer mode using the CLI:
```
`
unraid-api developer --sandbox true
`
```
Or use the interactive mode:
```
`
unraid-api developer
`
```
## Authentication[​](#authentication)
Most queries and mutations require authentication. Always include appropriate credentials in your requests. You can authenticate using:
1. **API Keys** - For programmatic access
2. **Cookies** - Automatic when signed in to the WebGUI
3. **SSO/OIDC** - When configured with external providers
### Managing API keys[​](#managing-api-keys)
* Web GUI (Recommended)
* CLI Method
Navigate to ***Settings → Management Access → API Keys*** in your Unraid WebGUI to:
* View existing API keys.
* Create new API keys.
* Manage permissions and roles.
* Revoke or regenerate keys.
### Using API keys[​](#using-api-keys)
The generated API key should be included in your GraphQL requests as a header.
```
`
{
"x-api-key": "YOUR\_API\_KEY"
}
`
```
## Available schemas[​](#available-schemas)
The API provides access to various aspects of your Unraid server:
* **System information**: Query system details including CPU, memory, and OS information; monitor system status and health; access baseboard and hardware information.
* **Array management**: Query array status and configuration; manage array operations (start/stop); monitor disk status and health; perform parity checks. For more information about array operations, see [Array overview](/unraid-os/using-unraid-to/manage-storage/array/overview/).
* **Docker management**: List and manage Docker containers; monitor container status; manage Docker networks.
* **Remote access**: Configure and manage remote access settings; handle SSO configuration; manage allowed origins.
## Example queries[​](#example-queries)
### Check system status[​](#check-system-status)
```
`
query {
info {
os {
platform
distro
release
uptime
}
cpu {
manufacturer
brand
cores
threads
}
}
}
`
```
### Monitor array status[​](#monitor-array-status)
```
`
query {
array {
state
capacity {
disks {
free
used
total
}
}
disks {
name
size
status
temp
}
}
}
`
```
### List Docker containers[​](#list-docker-containers)
```
`
query {
dockerContainers {
id
names
state
status
autoStart
}
}
`
```
## Schema types[​](#schema-types)
The API includes several core types. Base types include `Node` (interface for objects with unique IDs; see [Object Identification](https://graphql.org/learn/global-object-identification/)), `JSON` (for complex JSON data), `DateTime` (for timestamp values), and `Long` (for 64-bit integers). Resource types include `Array` (array and disk management), `Docker` (container and network management), `Info` (system information), `Config` (server configuration), and `Connect` (remote access settings). Available roles are `admin` (full access), `connect` (remote access features), and `guest` (limited read access).
## Best practices[​](#best-practices)
Pro Tips
1. Use [Apollo GraphQL Studio](https://studio.apollographql.com/graph/Unraid-API/variant/current/home) to view and explore the complete API schema and documentation
2. Start with small queries and gradually add fields as needed
3. Monitor your query complexity to maintain performance
4. Use appropriate roles and permissions for your API keys
5. Keep your API keys secure and rotate them periodically
## Error handling and rate limiting[​](#error-handling-and-rate-limiting)
Rate Limits
The API implements rate limiting to prevent abuse. Ensure your applications handle rate limit responses appropriately.
The API returns standard GraphQL errors in the following format:
```
`
{
"errors": [
{
"message": "Error description",
"locations": [...],
"path": [...]
}
]
}
`
```
## Additional resources[​](#additional-resources)
Learn More
* View the complete API schema and documentation using [Apollo GraphQL Studio](https://studio.apollographql.com/graph/Unraid-API/variant/current/home)
* Use the Apollo Sandbox's schema explorer to browse all available types and fields
* Check the documentation tab in Apollo Sandbox for detailed field descriptions
* Monitor the API's health using `unraid-api status`
* Generate reports using `unraid-api report` for troubleshooting
For more information about specific commands and configuration options, refer to the [CLI documentation](/API/cli/) or run `unraid-api --help`. If you encounter issues, visit the [Unraid forums](https://forums.unraid.net/) for community support.
* [Enabling the GraphQL sandbox](#enabling-the-graphql-sandbox)
* [WebGUI method (recommended)](#webgui-method-recommended)
* [WebGUI method (recommended)](#webgui-method-recommended-1)
* [CLI method](#cli-method)
* [Authentication](#authentication)
* [Managing API keys](#managing-api-keys)
* [Using API keys](#using-api-keys)
* [Available schemas](#available-schemas)
* [Example queries](#example-queries)
* [Check system status](#check-system-status)
* [Monitor array status](#monitor-array-status)
* [List Docker containers](#list-docker-containers)
* [Schema types](#schema-types)
* [Best practices](#best-practices)
* [Error handling and rate limiting](#error-handling-and-rate-limiting)
* [Additional resources](#additional-resources)