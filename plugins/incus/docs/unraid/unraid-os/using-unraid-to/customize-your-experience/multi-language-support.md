Multi-language support | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Unraid supports multiple languages in the WebGUI, making it more accessible for users worldwide. You can easily download and switch between language packs to use Unraid OS in your preferred language.
You can install and use Unraid in any of the following languages:
|**[Arabic](https://github.com/unraid/lang-ar_AR)****[Catalan](https://github.com/unraid/lang-ca_CA)****[Chinese (Simplified)](https://github.com/unraid/lang-zh_CN)****[Chinese (Traditional)](https://github.com/unraid/lang-zh_TW)****[Croatian](https://github.com/unraid/lang-hr_HR)**|**[Danish](https://github.com/unraid/lang-da_DA)****[Dutch](https://github.com/unraid/lang-nl_NL)****[English](https://github.com/unraid/lang-en_US)****[French](https://github.com/unraid/lang-fr_FR)****[German](https://github.com/unraid/lang-de_DE)**|**[Hungarian](https://github.com/unraid/lang-hu_HU)****[Italian](https://github.com/unraid/lang-it_IT)****[Japanese](https://github.com/unraid/lang-ja_JA)****[Korean](https://github.com/unraid/lang-ko_KO)****[Latvian](https://github.com/unraid/lang-lv_LV)**|**[Norwegian](https://github.com/unraid/lang-no_NO)****[Polish](https://github.com/unraid/lang-pl_PL)****[Portuguese](https://github.com/unraid/lang-pt_PT)****[Portuguese (Brazilian)](https://github.com/unraid/lang-pt_BR)****[Romanian](https://github.com/unraid/lang-ro_RO)**|**[Russian](https://github.com/unraid/lang-ru_RU)****[Spanish](https://github.com/unraid/lang-es_ES)****[Swedish](https://github.com/unraid/lang-sv_SE)****[Ukrainian](https://github.com/unraid/lang-uk_UA)**
To check for additional languages or see if your language is in progress, [visit the Unraid language repositories.](https://github.com/unraid/language-templates)
How Language Selection Affects Unraid
* **WebGUI:** All menus, buttons, and help text are displayed in your selected language.
* **Notifications:** System notifications and alerts appear in the chosen language.
* **Logs and System Output:** Most system logs remain in English for consistency and easier troubleshooting, but some interface-generated messages may be translated.
* **Plugin Compatibility:** Some plugins may display content in English if translations are not available.
note
While every effort is made to keep translations accurate, the [English text](https://github.com/unraid/lang-en_US) is the official reference. If you spot errors or want to contribute improvements, join the discussion in the [Multi-language section of the Unraid forums](https://forums.unraid.net/forum/75-multi-language-section/) or submit a pull request to the appropriate [language repository](https://github.com/unraid/language-templates).
## How to Download a Language Pack[​](#how-to-download-a-language-pack)
1. Open the [Community Applications plugin](https://unraid.net/community/apps) in Unraid.
2. Click the **Language** category on the left.
1. Find your preferred language pack and click the **Download** button.
2. The language pack will be installed and available for selection.
You can also use the Search bar in Community Applications to find language packs.
How to Switch Back to English
To return to English, click the **Switch back** toggle in the top-right corner of the WebGUI. This button alternates between English and your last selected language.
## Developer requirements for multi-language support[​](#developer-requirements-for-multi-language-support)
To enable multi-language support in your Unraid plugin, please ensure that your plugin meets the following requirements:
* Use Unraid’s built-in language features for all user-facing text.
* Provide an English translation master file as a reference for community translators.
* Allow community members to contribute translations for other supported languages.
While there is no strict requirement for plugins to support multiple languages, doing so enhances accessibility and usability for the global Unraid community. Plugins without multi-language support will still function, but all interface text will appear in English (or the language hard-coded by the developer).
note
If you need help or want to contribute to translations, visit the [Multi-Language Section of the Unraid forums](https://forums.unraid.net/forum/75-multi-language-section/) to connect with other users who speak your language.
* [How to Download a Language Pack](#how-to-download-a-language-pack)
* [Developer requirements for multi-language support](#developer-requirements-for-multi-language-support)