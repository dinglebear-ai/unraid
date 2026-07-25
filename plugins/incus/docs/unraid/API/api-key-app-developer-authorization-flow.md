API key authorization flow | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
This document describes the self-service API key creation flow for third-party applications.
## Overview[​](#overview)
Applications can request API access to an Unraid server by redirecting users to a special authorization page where users can review requested permissions and create an API key with one click.
## Flow[​](#flow)
1. **Application initiates request**: The app redirects the user to:
```
`
https://[unraid-server]/ApiKeyAuthorize?name=MyApp&scopes=docker:read,vm:\*&redirect\_uri=https://myapp.com/callback&state=abc123
`
```
2. **User authentication**: If not already logged in, the user is redirected to login first (standard Unraid auth).
3. **Consent screen**: User sees:
* Application name and description
* Requested permissions (with checkboxes to approve/deny specific scopes)
* API key name field (pre-filled)
* Authorize & Cancel buttons
* **API key creation**: Upon authorization:
* API key is created with approved scopes.
* Key is displayed to the user.
* If `redirect\_uri` is provided, user is redirected back with the key.
* **Callback**: App receives the API key:
```
`
https://myapp.com/callback?api\_key=xxx&state=abc123
`
```
## Query parameters[​](#query-parameters)
* `name` (required): Name of the requesting application
* `description` (optional): Description of the application
* `scopes` (required): Comma-separated list of requested scopes
* `redirect\_uri` (optional): URL to redirect after authorization
* `state` (optional): Opaque value for maintaining state
## Scope format[​](#scope-format)
Scopes follow the pattern: `resource:action`. Examples include `docker:read` (read access to Docker), `vm:\*` (full access to VMs), `system:update` (update access to system), `role:viewer` (viewer role access), and `role:admin` (admin role access).
Available resources include `docker`, `vm`, `system`, `share`, `user`, `network`, `disk`, and others. Available actions are `create`, `read`, `update`, `delete`, or `\*` for all.
Redirect URIs must use HTTPS (except localhost for development). Users explicitly approve each permission, and the flow uses existing Unraid authentication sessions. API keys are shown once and must be saved securely.
## Example integration[​](#example-integration)
```
`
// JavaScript example
const unraidServer = 'tower.local';
const appName = 'My Docker Manager';
const scopes = 'docker:\*,system:read';
const redirectUri = 'https://myapp.com/unraid/callback';
const state = generateRandomState();
// Store state for verification
sessionStorage.setItem('oauth\_state', state);
// Redirect user to authorization page
window.location.href =
`https://${unraidServer}/ApiKeyAuthorize?` +
`name=${encodeURIComponent(appName)}&` +
`scopes=${encodeURIComponent(scopes)}&` +
`redirect\_uri=${encodeURIComponent(redirectUri)}&` +
`state=${encodeURIComponent(state)}`;
// Handle callback
const urlParams = new URLSearchParams(window.location.search);
const apiKey = urlParams.get('api\_key');
const returnedState = urlParams.get('state');
if (returnedState === sessionStorage.getItem('oauth\_state')) {
// Save API key securely
saveApiKey(apiKey);
}
`
```
* [Overview](#overview)
* [Flow](#flow)
* [Query parameters](#query-parameters)
* [Scope format](#scope-format)
* [Example integration](#example-integration)