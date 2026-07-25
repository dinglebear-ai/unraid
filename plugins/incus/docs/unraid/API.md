Welcome to Unraid API | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Starting with Unraid 7.2, the API comes built into the operating system - no plugin installation required.
The Unraid API provides a GraphQL interface for programmatic interaction with your Unraid server. It enables automation, monitoring, and integration capabilities through a modern, strongly-typed API with multiple authentication methods (API keys, session cookies, and SSO/OIDC), comprehensive system coverage, and built-in developer tools.
## Availability[​](#availability)
### Native integration (Unraid 7.2+)[​](#native-integration-unraid-72)
Starting with Unraid 7.2, the API is integrated directly into the operating system:
* No plugin installation required
* Automatically available on system startup
* Deep system integration
* Access through ***Settings → Management Access → API***
### Plugin installation (Pre-7.2 and Advanced Users)[​](#plugin-installation-pre-72-and-advanced-users)
For Unraid versions prior to 7.2, or to access newer API features:
1. Install the [Unraid Connect](/unraid-connect/overview-and-setup/) plugin from [Community Applications](/community-applications/).
2. [Configure the plugin](/API/how-to-use-the-api/#enabling-the-graphql-sandbox).
3. Access API functionality through the GraphQL Sandbox.
The [Unraid Connect](/unraid-connect/overview-and-setup/) plugin provides the API for pre-7.2 versions. You do **not** need to sign in to Unraid Connect to use the API locally. Installing the plugin on Unraid 7.2+ gives you access to newer API features before they're included in OS releases.
## Get started[​](#get-started)
* Unraid 7.2+
* Pre-7.2 Versions
1. The API is already installed and running.
2. Access settings at ***Settings → Management Access → API***.
3. Enable the GraphQL Sandbox for development.
4. Create your first API key.
5. Start making GraphQL queries!
For detailed usage instructions, see the [CLI Commands](/API/cli/) reference.
* [Availability](#availability)
* [Native integration (Unraid 7.2+)](#native-integration-unraid-72)
* [Plugin installation (Pre-7.2 and Advanced Users)](#plugin-installation-pre-72-and-advanced-users)
* [Get started](#get-started)