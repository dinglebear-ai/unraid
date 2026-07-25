OIDC provider setup | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
info
OpenID Connect (OIDC) is an authentication protocol that allows users to sign in using their existing accounts from providers like Google, Microsoft, or your corporate identity provider. It enables Single Sign-On (SSO) for seamless and secure authentication.
This guide walks you through configuring OIDC (OpenID Connect) providers for SSO authentication in the Unraid API using the WebGUI.
## Quick start[​](#quick-start)
**Getting to OIDC Settings**
1. Navigate to your Unraid server's WebGUI.
2. Go to ***Settings → Management Access → API → OIDC***.
3. You'll see tabs for different providers - click the **+** button to add a new provider.
### OIDC providers interface overview[​](#oidc-providers-interface-overview)
*Login page showing traditional login form with SSO options - "Login With Unraid.net" and "Sign in with Google" buttons*
The interface includes:
* **Provider tabs**: Each configured provider (Unraid.net, Google, etc.) appears as a tab.
* **Add Provider button**: Click the **+** button to add new providers.
* **Authorization Mode dropdown**: Toggle between "simple" and "advanced" modes.
* **Simple Authorization section**: Configure allowed email domains and specific addresses.
* **Add Item buttons**: Click to add multiple authorization rules.
## Understanding authorization modes[​](#understanding-authorization-modes)
The interface provides two authorization modes:
### Simple mode (recommended)[​](#simple-mode-recommended)
Simple mode is the easiest way to configure authorization. You can:
* Allow specific email domains (e.g., @company.com).
* Allow specific email addresses.
* Configure who can access your Unraid server with minimal setup.
**When to use Simple Mode:**
* You want to allow all users from your company domain.
* You have a small list of specific users.
* You're new to OIDC configuration.
**Advanced Mode**
Advanced mode provides granular control using claim-based rules. You can:
* Create complex authorization rules based on JWT claims.
* Use operators like equals, contains, endsWith, startsWith.
* Combine multiple conditions with OR/AND logic.
* Choose whether ANY rule must pass (OR mode) or ALL rules must pass (AND mode).
**When to use Advanced Mode:**
* You need to check group memberships.
* You want to verify multiple claims (e.g., email domain AND verified status).
* You have complex authorization requirements.
* You need fine-grained control over how rules are evaluated.
## Authorization rules[​](#authorization-rules)
*Advanced authorization rules showing JWT claim configuration with email endsWith operator for domain-based access control*
### Simple mode examples[​](#simple-mode-examples)
#### Allow company domain[​](#allow-company-domain)
In simple authorization:
* **Allowed Email Domains**: Enter `company.com`.
* This allows anyone with @company.com email.
#### Allow specific users[​](#allow-specific-users)
* **Specific Email Addresses**: Add individual emails.
* Click **Add Item** to add multiple addresses.
**Advanced Mode Examples**
#### Authorization Rule Mode[​](#authorization-rule-mode)
When using multiple rules, you can choose how they're evaluated:
* **OR Mode** (default): User is authorized if ANY rule passes.
* **AND Mode**: User is authorized only if ALL rules pass.
#### Email Domain with Verification (AND Mode)[​](#email-domain-with-verification-and-mode)
To require both email domain AND verification:
1. Set **Authorization Rule Mode** to `AND`.
2. Add two rules:
* Rule 1:
* **Claim**: `email`
* **Operator**: `endsWith`
* **Value**: `@company.com`
* Rule 2:
* **Claim**: `email\_verified`
* **Operator**: `equals`
* **Value**: `true`
This ensures users must have both a company email AND a verified email address.#### Group-Based Access (OR Mode)[​](#group-based-access-or-mode)
To allow access to multiple groups:
1. Set **Authorization Rule Mode** to `OR` (default).
2. Add rules for each group:
* **Claim**: `groups`
* **Operator**: `contains`
* **Value**: `admins`
Or add another rule:
* **Claim**: `groups`
* **Operator**: `contains`
* **Value**: `developers`
Users in either `admins` OR `developers` group will be authorized.#### Multiple Domains[​](#multiple-domains)
* **Claim**: `email`
* **Operator**: `endsWith`
* **Values**: Add multiple domains (e.g., `company.com`, `subsidiary.com`)
#### Complex Authorization (AND Mode)[​](#complex-authorization-and-mode)
For strict security requiring multiple conditions:
1. Set **Authorization Rule Mode** to `AND`.
2. Add multiple rules that ALL must pass:
* Email must be from company domain
* Email must be verified
* User must be in specific group
* Account must have 2FA enabled (if claim available)
**Configuration Interface Details**
### Provider Tabs[​](#provider-tabs)
* Each configured provider appears as a tab at the top.
* Click a tab to switch between provider configurations.
* The **+** button on the right adds a new provider.
### Authorization Mode Dropdown[​](#authorization-mode-dropdown)
* **Simple**: Best for email-based authorization (recommended for most users).
* **Advanced**: For complex claim-based rules using JWT claims.
### Simple Authorization Fields[​](#simple-authorization-fields)
When "simple" mode is selected, you'll see:
* **Allowed Email Domains**: Enter domains without @ (e.g., `company.com`).
* Helper text: "Users with emails ending in these domains can login"
* **Specific Email Addresses**: Add individual email addresses.
* Helper text: "Only these exact email addresses can login"
* **Add Item** buttons to add multiple entries.
### Advanced Authorization Fields[​](#advanced-authorization-fields)
When "advanced" mode is selected, you'll see:
* **Authorization Rule Mode**: Choose `OR` (any rule passes) or `AND` (all rules must pass).
* **Authorization Rules**: Add multiple claim-based rules.
* **For each rule**:
* **Claim**: The JWT claim to check.
* **Operator**: How to compare (equals, contains, endsWith, startsWith).
* **Value**: What to match against.
### Additional Interface Elements[​](#additional-interface-elements)
* **Enable Developer Sandbox**: Toggle to enable GraphQL sandbox at `/graphql`.
* The interface uses a dark theme for better visibility.
* Field validation indicators help ensure correct configuration.
### Required redirect URI[​](#required-redirect-uri)
caution
All providers must be configured with this exact redirect URI format.
```
`
http://YOUR\_UNRAID\_IP/graphql/api/auth/oidc/callback
`
```
tip
Replace `YOUR\_UNRAID\_IP` with your actual server IP address (e.g., `192.168.1.100` or `tower.local`).
### Issuer URL format[​](#issuer-url-format)
The **Issuer URL** field accepts both formats, but **base URL is strongly recommended** for security:
* **Base URL** (recommended): `https://accounts.google.com`
* **Full discovery URL**: `https://accounts.google.com/.well-known/openid-configuration`
**Security Note**: Always use the base URL format when possible. The system automatically appends `/.well-known/openid-configuration` for OIDC discovery. Using the full discovery URL directly disables important issuer validation checks and is not recommended by the OpenID Connect specification.
**Examples of correct base URLs:**
* Google: `https://accounts.google.com`
* Microsoft/Azure: `https://login.microsoftonline.com/YOUR\_TENANT\_ID/v2.0`
* Keycloak: `https://keycloak.example.com/realms/YOUR\_REALM`
* Authelia: `https://auth.yourdomain.com`
## Testing your configuration[​](#testing-your-configuration)
*Unraid login page displaying both traditional username/password authentication and SSO options with customized provider buttons*
1. Save your provider configuration.
2. Log out (if logged in).
3. Navigate to the login page.
4. Your configured provider button should appear.
5. Click to test the login flow.
## Troubleshooting[​](#troubleshooting)
### Common issues[​](#common-issues)
**"Provider not found" error:** Ensure the issuer URL is correct and that the provider supports OIDC discovery (/.well-known/openid-configuration).
**"Authorization failed":** In simple mode, check email domains are entered correctly (without @). In advanced mode, verify claim names match exactly what your provider sends, check if Authorization Rule Mode is set correctly (OR vs AND), and ensure all required claims are present in the token. Enable debug logging to see actual claims and rule evaluation.
**"Invalid redirect URI":** Ensure the redirect URI in your provider matches exactly, include the correct port if using a non-standard configuration, and verify the redirect URI protocol matches your server's configuration (HTTP or HTTPS).
**Cannot see login button:** Check that at least one authorization rule is configured and verify the provider is enabled/saved.
### Debug mode[​](#debug-mode)
To troubleshoot issues:
1. Enable debug logging:
```
`
LOG\_LEVEL=debug unraid-api start --debug
`
```
1. Check logs for:
* Received claims from provider.
* Authorization rule evaluation.
* Token validation errors.
Use Simple Mode for authorization to prevent overly accepting configurations and reduce misconfiguration risks. Be specific with authorization rules and avoid overly broad rules. Rotate secrets regularly by updating client secrets periodically. Test thoroughly to verify only intended users can access.
If you encounter issues, check your provider's OIDC documentation, review Unraid API logs for detailed error messages, ensure your provider supports standard OIDC discovery, and verify network connectivity between Unraid and provider. For additional help, visit the [Unraid forums](https://forums.unraid.net/).
## Provider-specific setup[​](#provider-specific-setup)
### Unraid.net provider[​](#unraidnet-provider)
The Unraid.net provider is built-in and pre-configured. You only need to configure authorization rules in the interface.
**Configuration:**
* **Issuer URL**: Pre-configured (built-in provider)
* **Client ID/Secret**: Pre-configured (built-in provider)
* **Redirect URI**: `http://YOUR\_UNRAID\_IP/graphql/api/auth/oidc/callback`
tip
Match the protocol to your server setup. Use `http://` if accessing your Unraid server without SSL/TLS (typical for local network access). Use `https://` if you've configured SSL/TLS on your server. Some OIDC providers (like Google) require HTTPS and won't accept HTTP redirect URIs.
Configure authorization rules using simple mode (allowed email domains/addresses) or advanced mode for complex requirements.
### Google[​](#google)
**Setup Steps**
Set up OAuth 2.0 credentials in [Google Cloud Console](https://console.cloud.google.com/):
1. Go to **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth client ID**.
3. Choose **Web application** as the application type.
4. Add your redirect URI to **Authorized redirect URIs**.
5. Configure the OAuth consent screen if prompted.
**Configuration:**
* **Issuer URL**: `https://accounts.google.com`
* **Client ID/Secret**: From your OAuth 2.0 client credentials
* **Required Scopes**: `openid`, `profile`, `email`
* **Redirect URI**: `http://YOUR\_UNRAID\_IP/graphql/api/auth/oidc/callback`
warning
Google requires valid domain names for OAuth redirect URIs. Local IP addresses and `.local` domains are not accepted. To use Google OAuth with your Unraid server, you'll need:
* **Option 1: Reverse Proxy** - Set up a reverse proxy (like NGINX Proxy Manager or Traefik) with a valid domain name pointing to your Unraid API.
* **Option 2: Tailscale** - Use Tailscale to get a valid `\*.ts.net` domain that Google will accept. For more information about Tailscale, see [Remote access](/unraid-connect/remote-access/).
* **Option 3: Dynamic DNS** - Use a DDNS service to get a public domain name for your server.
Remember to update your redirect URI in both Google Cloud Console and your Unraid OIDC configuration to use the valid domain.
For Google Workspace domains, use advanced mode with the `hd` claim to restrict access to your organization's domain.
### Authelia[​](#authelia)
Configure OIDC client in your Authelia `configuration.yml` with client ID `unraid-api` and generate a hashed secret using the Authelia hash-password command.
**Configuration:**
* **Issuer URL**: `https://auth.yourdomain.com`
* **Client ID**: `unraid-api` (or as configured in Authelia)
* **Client Secret**: Your unhashed secret
* **Required Scopes**: `openid`, `profile`, `email`, `groups`
* **Redirect URI**: `http://YOUR\_UNRAID\_IP/graphql/api/auth/oidc/callback`
Use advanced mode with `groups` claim for group-based authorization.
### Microsoft/Azure AD[​](#microsoftazure-ad)
Register a new app in [Azure Portal](https://portal.azure.com/) under Azure Active Directory → App registrations. Note the Application ID, create a client secret, and note your tenant ID.
**Configuration:**
* **Issuer URL**: `https://login.microsoftonline.com/YOUR\_TENANT\_ID/v2.0`
* **Client ID**: Your Application (client) ID
* **Client Secret**: Generated client secret
* **Required Scopes**: `openid`, `profile`, `email`
* **Redirect URI**: `http://YOUR\_UNRAID\_IP/graphql/api/auth/oidc/callback`
Authorization rules can be configured in the interface using email domains or advanced claims.
### Keycloak[​](#keycloak)
Create a new confidential client in Keycloak Admin Console with `openid-connect` protocol and copy the client secret from the Credentials tab.
**Configuration:**
* **Issuer URL**: `https://keycloak.example.com/realms/YOUR\_REALM`
* **Client ID**: `unraid-api` (or as configured in Keycloak)
* **Client Secret**: From Keycloak Credentials tab
* **Required Scopes**: `openid`, `profile`, `email`
* **Redirect URI**: `http://YOUR\_UNRAID\_IP/graphql/api/auth/oidc/callback`
For role-based authorization, use Advanced Mode with `realm\_access.roles` or `resource\_access` claims.
### Authentik[​](#authentik)
Create a new OAuth2/OpenID Provider in Authentik, then create an Application and link it to the provider.
**Configuration:**
* **Issuer URL**: `https://authentik.example.com/application/o/\<application\_slug\>/`
* **Client ID**: From Authentik provider configuration
* **Client Secret**: From Authentik provider configuration
* **Required Scopes**: `openid`, `profile`, `email`
* **Redirect URI**: `http://YOUR\_UNRAID\_IP/graphql/api/auth/oidc/callback`
Authorization rules can be configured in the interface.
### Okta[​](#okta)
Create a new OIDC Web Application in Okta Admin Console and assign appropriate users or groups.
**Configuration:**
* **Issuer URL**: `https://YOUR\_DOMAIN.okta.com`
* **Client ID**: From Okta application configuration
* **Client Secret**: From Okta application configuration
* **Required Scopes**: `openid`, `profile`, `email`
* **Redirect URI**: `http://YOUR\_UNRAID\_IP/graphql/api/auth/oidc/callback`
Authorization rules can be configured in the interface using email domains or advanced claims.
* [Quick start](#quick-start)
* [OIDC providers interface overview](#oidc-providers-interface-overview)
* [Understanding authorization modes](#understanding-authorization-modes)
* [Simple mode (recommended)](#simple-mode-recommended)
* [Authorization rules](#authorization-rules)
* [Simple mode examples](#simple-mode-examples)
* [Provider Tabs](#provider-tabs)
* [Authorization Mode Dropdown](#authorization-mode-dropdown)
* [Simple Authorization Fields](#simple-authorization-fields)
* [Advanced Authorization Fields](#advanced-authorization-fields)
* [Additional Interface Elements](#additional-interface-elements)
* [Required redirect URI](#required-redirect-uri)
* [Issuer URL format](#issuer-url-format)
* [Testing your configuration](#testing-your-configuration)
* [Troubleshooting](#troubleshooting)
* [Common issues](#common-issues)
* [Debug mode](#debug-mode)
* [Provider-specific setup](#provider-specific-setup)
* [Unraid.net provider](#unraidnet-provider)
* [Google](#google)
* [Authelia](#authelia)
* [Microsoft/Azure AD](#microsoftazure-ad)
* [Keycloak](#keycloak)
* [Authentik](#authentik)
* [Okta](#okta)