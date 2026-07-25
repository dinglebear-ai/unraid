Unraid Docs style guide | Unraid Docs
[Skip to main content](#__docusaurus_skipToContent_fallback)
On this page
Unraid OS is shaped by the LimeTech team and the Unraid community. Our documentation aims to be comprehensive, accurate, and current. Since our users come from diverse backgrounds worldwide, this guide sets the foundation for consistent, clear writing throughout Unraid docs.
## Writing conventions[​](#writing-conventions)
### Style and tone[​](#style-and-tone)
Our tone strikes a balance between friendly and formal, aiming for detailed and accurate content that users can relate to.
* Use formal, direct instructions when the action is fixed and leaves no room for deviation.
* Use a conversational, explanatory tone when providing context or scenarios to make the content more approachable.
As a contributor, consider the context and audience when choosing your tone.
important
Because Unraid OS has a global audience, we avoid jargon, slang, or idioms. These can confuse non-native English speakers and complicate the translation process.
### Audience: Write for all levels[​](#audience-write-for-all-levels)
Our readers range from Linux experts who understand system internals to beginners navigating Unraid for the first time.
Write clearly and inclusively so that both experts and newcomers can follow along smoothly.
### The ABC method: accuracy, brevity, clarity[​](#the-abc-method-accuracy-brevity-clarity)
We prioritize:
* **Accuracy**: Ensure content is correct and thoroughly tested.
* **Brevity**: Be concise without sacrificing necessary detail.
* **Clarity**: Use plain language and structure content for easy understanding.
## Syntax[​](#syntax)
Unraid Docs uses Markdown formatting combined with specific text styles to help users quickly identify interface elements and navigate the WebGUI.
|Element TypeStyle ConventionMarkdown SyntaxExample / Description|Option or button nameBold`\*\*text\*\*`Select **Done**|User input valueItalics`\*text\*`Enter a value of *50gb*|Navigation pathBold + italics; use →`\*\*\*nav1 → nav2\*\*\*`***Settings → Disk Settings***|Tab labelBold**tab\_name**Name of a tab to select|Checkbox labelBold**checkbox\_label**Label of a checkbox option|Dropdown menu optionItalics*dropdown\_option*Selectable option within a dropdown|Dialog titleHeading 3`### Dialog Title`Title for pop-up dialogs or modal windows|Tooltip textInline italics*tooltip text*Short explanation shown on hover|Menu itemBold + italics***Menu → Submenu → Item***Navigation through nested menus|CLI and system outputMonospace (inline code)``text``Navigate to `http://tower.local`|Error messageMonospace (inline code)``Error: message``Exact error strings or logs|Document titleHeading 1`# Heading`(renders as) `\<h1\>Heading\</h1\>`|Document sectionHeading 2`## Heading`(renders as) `\<h2\>Heading\</h2\>`|Document sub-sectionHeading 3`### Heading`(renders as) `\<h3\>Heading\</h3\>`
note
Every heading level 2 (`##`) and smaller appears in the page Table of Contents (TOC) sidebar for easy navigation.
## Formatting for lists and tables[​](#formatting-for-lists-and-tables)
Using structured elements, such as lists and tables, effectively improves information clarity, aids comprehension, and supports quick reference.
### Lists[​](#lists)
Lists help users absorb, recall, and follow key points or steps. There are two main types, each with clear use cases:
* **Unordered lists** (bullets): Use to group related items without implying order.
*Example:* "List of common Unraid OS tools."
* **Ordered lists** (numbered): Use to show a required sequence or procedure.
*Example:* "To start the array..."
Best practices
* Try to introduce the list with a clear stem sentence ending in a colon.
* Use 4–6 items max in an unordered list for ease of scanning and memorability. Longer lists may be better as a table.
### Tables[​](#tables)
Tables are a great way to organize related data by grouping information into rows and columns, which makes comparisons quicker and more precise.
Best practices
* Use tables for multiple related data points that benefit from side-by-side comparison.
* Avoid tables with only 1 or 2 cells; instead, use bulleted lists or sentences.
* Introduce the table with a sentence that explains its purpose and content.
## Abbreviations, acronyms, and initialisms[​](#abbreviations-acronyms-and-initialisms)
To reduce confusion for readers, follow these principles regarding abbreviations:
* **Abbreviations** are shortened forms of words that are usually unnecessary in Unraid Docs unless they are universally recognized.
* **Acronyms** create new words from the initial letters of other words (e.g., RAID).
* **Initialisms** use initials that are pronounced individually (e.g., OS, ZFS).
**Recommendations:**
* Prefer existing, well-known acronyms or initialisms that are familiar to your audience.
* Avoid creating new abbreviations just for the sake of being brief.
* Always spell out uncommon acronyms or initialisms the first time they are used, followed by the abbreviation in parentheses.
*Example:* Virtual Machine Disk (VMDK)
## Hyperlinking to other documents or sites[​](#hyperlinking-to-other-documents-or-sites)
Strategic linking allows readers to explore related topics and enhances their understanding. Use these guidelines for practical and accessible hyperlinking.
### Link text guidelines[​](#link-text-guidelines)
* Link text should clearly describe the destination, helping all readers grasp the link’s purpose.
* Steer clear of vague link texts like "Click here" or "Read more," as these lack context.
* Avoid using raw URLs as inline link text.
### Formatting links[​](#formatting-links)
* Use inline Markdown links:
```
`
You can also check our [getting started guide](../unraid-os/getting-started/quick-start-guide.mdx).
`
```
* Always link to the most relevant and authoritative resource available.
### Adding glossary terminology[​](#adding-glossary-terminology)
Unraid Docs utilizes a centralized glossary system to ensure consistency and accessibility of technical terms. Glossary entries are kept in the `glossary.yaml` file located in the root directory.
To add or update a term:
1. Edit `glossary.yaml` using the following template:
```
`
GlossaryTerm:
term: Display Name
def: Full definition text.
link: \<a href="https://example.com"\>Optional detailed link\</a\>
`
```
1. To add tooltip functionality, reference the term in documentation using the syntax:
```
`
%%Term|GlossaryTerm%%
`
```
...where the left side of the pipe is the text you would like it displayed, while the right side is the corresponding term entry from the YAML file.
2.
1. The [glossary page](/glossary/) will automatically update to include new terms.
* [Writing conventions](#writing-conventions)
* [Style and tone](#style-and-tone)
* [Audience: Write for all levels](#audience-write-for-all-levels)
* [The ABC method: accuracy, brevity, clarity](#the-abc-method-accuracy-brevity-clarity)
* [Syntax](#syntax)
* [Formatting for lists and tables](#formatting-for-lists-and-tables)
* [Lists](#lists)
* [Tables](#tables)
* [Abbreviations, acronyms, and initialisms](#abbreviations-acronyms-and-initialisms)
* [Hyperlinking to other documents or sites](#hyperlinking-to-other-documents-or-sites)
* [Link text guidelines](#link-text-guidelines)
* [Formatting links](#formatting-links)
* [Adding glossary terminology](#adding-glossary-terminology)