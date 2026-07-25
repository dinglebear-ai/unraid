Unraid.net | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
An Unraid.net account is your access point to Unraid's online services, including [forums](https://forums.unraid.net/), [Unraid Connect](/unraid-connect/overview-and-setup/), and license management. While it's not required for basic server functions, having an account provides several benefits such as streamlined license management, access to prerelease builds, and enhanced support.
#### Benefits of an Unraid.net account include:[​](#benefits-of-an-unraidnet-account-include)
* **Single Sign-On (SSO):** Access Unraid's systems with one set of credentials.
* **License Management:** Easily manage your license keys and server registrations.
* **Access to Prereleases:** Download and test prerelease versions of Unraid.
* **Enhanced Support:** Engage in forums and receive updates on your account.
* **Secure Authentication:** Enjoy secure login with options for multi-factor authentication (MFA).
### Your Account and the Data that's Stored[​](#your-account-and-the-data-thats-stored)
Unraid.net uses a SSO system at account.unraid.net for secure authentication via AWS Cognito. Your data is stored securely and encrypted. The AWS Cognito user pool database retains the following information for registered users:
|Data TypeDescription|User IDUnique identifier for your account|UsernameYour chosen Unraid.net username|Email addressUsed for communication and account recovery|Unraid Forum IDLinks your account to forum activity|Prerelease authorizationIndicates if you can download Unraid prereleases|Password hashSecure, salted, one-way (hashed) version of your password|MFA detailsInformation for multi-factor authentication|Google/Apple SSO infoThird-party sign-in attributes (if used)
* [Your Account and the Data that's Stored](#your-account-and-the-data-thats-stored)