Multi-factor Authentication | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Multi-factor authentication (MFA) adds a rotating authenticator app code to your Unraid account sign-in.
The Account app currently supports authenticator app codes, also called TOTP or software-token MFA.
## Before you start[​](#before-you-start)
* Go to [account.unraid.net](https://account.unraid.net) and sign in to your Unraid account.
* Install an authenticator app that can scan a QR code or accept a setup URL.
* Keep your authenticator app available while changing MFA settings.
## Enable MFA[​](#enable-mfa)
1. Open the Unraid Account app.
2. Open **Account Settings**, then select the **MFA** tab.
3. Click **Enable MFA**.
4. Scan the QR code with your authenticator app. If you cannot scan the QR code, copy the setup URL into your authenticator app.
5. Enter the 6-digit code from your authenticator app.
6. Wait for the Account app to verify the code and show MFA as enabled.
After MFA is enabled, use your authenticator app code the next time you sign in.
## Disable MFA[​](#disable-mfa)
1. Open the Unraid Account app.
2. Open **Account Settings**, then select the **MFA** tab.
3. Click **Disable MFA**.
4. Enter the current 6-digit code from your authenticator app.
5. Confirm the change.
6. Wait for the Account app to show MFA as disabled.
After MFA is disabled, the Account app no longer asks for an authenticator app code during sign-in.
## Troubleshooting[​](#troubleshooting)
* If setup fails, start again from the **MFA** tab in **Account Settings** and scan the new QR code.
* If a code is rejected, wait for the next code in your authenticator app and try again.
* If you no longer have access to your authenticator app, contact support for help recovering access to your account.
* [Before you start](#before-you-start)
* [Enable MFA](#enable-mfa)
* [Disable MFA](#disable-mfa)
* [Troubleshooting](#troubleshooting)