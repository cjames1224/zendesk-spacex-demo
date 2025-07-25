# Zendesk Demo Utils

A toolkit for automating, testing, and managing Zendesk demo environments, macros, tickets, and themes.

## Table of Contents

- [Overview](#overview)
- [Environment Setup](#environment-setup)
- [Tool Usage](#tool-usage)
  - [openai-zendesk-cli.js](#openai-zendesk-clijs)
  - [load-demo-tickets.js](#load-demo-ticketsjs)
  - [zendesk-demo-automation.js](#zendesk-demo-automationjs)
  - [zip-and-import-zendesk-theme.js](#zip-and-import-zendesk-themejs)
- [Best Practices](#best-practices)
- [Config & Manifest Examples](#config--manifest-examples)

---

## Overview

This project provides scripts to automate Zendesk configuration, load demo tickets, manage macros/views, and handle theme packaging/importing. It is ideal for demo, testing, and rapid prototyping environments.

## Environment Setup

Create a `.env` file in the project root with the following variables (see `environment.sample.txt` for reference):

```env
ZENDESK_SUBDOMAIN=
ZENDESK_EMAIL=
ZENDESK_API_TOKEN=
ZENDESK_BRAND_ID=
CLERK_PUBLISHABLE_KEY=
ZENDESK_MESSAGING_AUTH_KEY=
REACT_APP_ZENDESK_KEY=
OPENAI_API_KEY=
```

- **Required for all scripts:** `ZENDESK_SUBDOMAIN`, `ZENDESK_EMAIL`, `ZENDESK_API_TOKEN`
- **Theme import/update:** `ZENDESK_BRAND_ID` (optional, for multi-brand)
- **OpenAI integration:** `OPENAI_API_KEY` (for openai-zendesk-cli.js)
- **Other fields** (`CLERK_PUBLISHABLE_KEY`, `ZENDESK_MESSAGING_AUTH_KEY`, `REACT_APP_ZENDESK_KEY`) are used for integrations or frontend apps and may not be required for CLI/demo scripts.

---

## Tool Usage

### openai-zendesk-cli.js

Automate Zendesk macros, views, and custom objects using natural language and OpenAI.

**Run:**

```sh
node openai-zendesk-cli.js
```

When you start the script, you will be prompted to choose between managing macros/views/objects or generating Help Center articles.

#### Help Center Article Generation Flow

This flow allows you to generate and publish multiple Help Center articles using OpenAI, based on your business context and a list of article ideas.

**Step-by-step:**

1. **Choose "Create Help Center Articles"** when prompted at startup.
2. **Enter business context** (e.g., your company name, product, or support needs). This helps OpenAI tailor the articles.
3. **Enter article prompts** as a bulleted list (one per line, starting with `-` or `*`). Example:
   ```
   - How to reset your password
   - Troubleshooting login issues
   - Understanding your billing statement
   ```
4. The script will fetch your existing Help Center categories. **At least one category must exist** in your Zendesk Help Center.
5. OpenAI will generate draft articles, each with a suggested section and category.
6. For each article:
   - If the suggested section does not exist, you will be prompted to select a category for the new section, and the section will be created.
   - You will review the article's title, section, category, and content.
   - Approve or reject each article interactively.
7. Approved articles are published to your Help Center in the appropriate section/category.
8. A summary is shown of how many articles were created.

**Requirements:**

- `.env` with Zendesk and OpenAI credentials
- At least one category in your Zendesk Help Center

**Best practice:**

- Use clear, specific prompts for best results.
- Review all generated content before approving.
- Run in a sandbox or test environment before using in production.

**Prompts you for:**

- A description of the macros/views/objects to add or update.

**Requires:**

- `.env` with Zendesk and OpenAI credentials
- `spacex-zendesk-config.json` (auto-created/updated)

**What it does:**

- Reads your config, sends your request to OpenAI, and updates the config JSON.
- Can apply changes to Zendesk via API.

**Best practice:**

- Review the generated config before applying.
- Keep a backup of your config file.

---

### load-demo-tickets.js

Bulk-create demo tickets in your Zendesk instance for testing/demo purposes.

**Run:**

```sh
node load-demo-tickets.js
```

**Requires:**

- `.env` with Zendesk credentials

**What it does:**

- Creates a set of predefined tickets (edit the `TICKETS` array in the script to customize).

**Best practice:**

- Use in a sandbox/demo Zendesk, not production.

---

### zendesk-demo-automation.js

Automate the creation of macros, views, and custom objects in Zendesk from a config file.

**Run:**

```sh
node zendesk-demo-automation.js
```

**Requires:**

- `.env` with Zendesk credentials
- `spacex-zendesk-config.json` (see below for structure)

**What it does:**

- Reads macros, views, and objects from the config and creates/updates them in Zendesk.

**Best practice:**

- Double-check your config file for accuracy before running.
- Use version control for your config.

---

### zip-and-import-zendesk-theme.js

Zip, import, and update Zendesk Guide themes.

**Run:**

- Zip only:
  ```sh
  node zip-and-import-zendesk-theme.js
  ```
- Zip and import as new theme:
  ```sh
  node zip-and-import-zendesk-theme.js --import
  ```
- Zip and update existing theme (increments version):
  ```sh
  node zip-and-import-zendesk-theme.js --update THEME_ID
  ```
- Set theme live after import/update:
  ```sh
  node zip-and-import-zendesk-theme.js --import --set-live
  node zip-and-import-zendesk-theme.js --update THEME_ID --set-live
  ```

**Requires:**

- `.env` with Zendesk credentials
- `zendesk-help-center-theme/manifest.json` (see below)

**What it does:**

- Zips the theme directory, imports or updates the theme in Zendesk, and can set it live.

**Best practice:**

- Always increment the `version` in your manifest before updating.
- Validate your manifest for required fields.
- Test in a sandbox before deploying live.

---

## Best Practices

- **Check your `.env` file** before running any script. All required fields must be present.
- **Review your config files** (`spacex-zendesk-config.json`, `manifest.json`) for accuracy and completeness.
- **Use version control** for all config and theme files.
- **Test in a sandbox** Zendesk environment before applying changes to production.
- **Backup your data** and configs regularly.

---

## Config & Manifest Examples

### .env Example

```env
ZENDESK_SUBDOMAIN=
ZENDESK_EMAIL=
ZENDESK_API_TOKEN=
ZENDESK_BRAND_ID=
CLERK_PUBLISHABLE_KEY=
ZENDESK_MESSAGING_AUTH_KEY=
REACT_APP_ZENDESK_KEY=
OPENAI_API_KEY=
```

| Variable                   | Description                                                           | Required For                     |
| -------------------------- | --------------------------------------------------------------------- | -------------------------------- |
| ZENDESK_SUBDOMAIN          | Your Zendesk subdomain (e.g. `mycompany` for `mycompany.zendesk.com`) | All scripts                      |
| ZENDESK_EMAIL              | Zendesk account email (must have API access)                          | All scripts                      |
| ZENDESK_API_TOKEN          | Zendesk API token (generate in Zendesk admin)                         | All scripts                      |
| ZENDESK_BRAND_ID           | Zendesk brand ID (for multi-brand theme import/update)                | Theme import/update (optional)   |
| CLERK_PUBLISHABLE_KEY      | Clerk publishable key (for Clerk authentication integration)          | Frontend/integrations (optional) |
| ZENDESK_MESSAGING_AUTH_KEY | Zendesk Messaging authentication key (for messaging integrations)     | Frontend/integrations (optional) |
| REACT_APP_ZENDESK_KEY      | Zendesk key for React frontend apps (used in some UI integrations)    | Frontend/integrations (optional) |
| OPENAI_API_KEY             | OpenAI API key (for openai-zendesk-cli.js, config automation)         | openai-zendesk-cli.js (optional) |

- Only the first three are required for all scripts. Others are optional or for specific integrations.

### spacex-zendesk-config.json Example

```json
{
  "macros": [
    {
      "title": "When is the next launch?",
      "actions": [
        {
          "field": "comment_value",
          "value": "The next SpaceX launch is scheduled for {{launch_date}}."
        }
      ],
      "active": true
    }
  ],
  "views": [
    {
      "title": "Launch-Related Tickets",
      "all": [{ "field": "status", "operator": "is", "value": "open" }],
      "output": { "columns": ["subject", "status", "tags"] }
    }
  ]
}
```

### manifest.json Example (header)

```json
{
  "name": "SpaceX Demo Template",
  "author": "Christian James <SpaceX Demo>",
  "version": "4.8.19",
  "api_version": 4,
  "default_locale": "en-us"
}
```

---

## Support

For questions or issues, please open an issue or contact the maintainer.

---

## Running the React App Locally & Zendesk Messaging SDK

The React app in `public/` can be run locally to demo and test Zendesk Messaging SDK integration.

### Steps to Run Locally

1. **Install dependencies** (if not already):
   ```sh
   npm install
   ```
2. **Start the development server:**

   ```sh
   npm start
   ```

   By default, the app will be available at [http://localhost:3000](http://localhost:3000).

3. **Environment Variables:**
   Ensure your `.env` (or `environment.sample.txt` copied to `.env`) includes:

   - `REACT_APP_ZENDESK_KEY` (your Zendesk Web Widget key)
   - `ZENDESK_MESSAGING_AUTH_KEY` (if using authenticated messaging)
   - Other required fields as described above

4. **Accessing Zendesk Messaging SDK:**
   - When the app is running, you should see the Zendesk Messaging window/widget appear (usually in the lower right corner).
   - This allows you to interact with Zendesk Messaging as an end user would, using your configured Zendesk instance.

### Notes

- Make sure your Zendesk account is configured to allow the Messaging SDK and that your keys are correct.
- If you do not see the widget, check the browser console for errors and verify your environment variables.
- The React app is intended for demo and integration testing. For production, ensure you follow Zendesk's best practices for SDK usage and authentication.

## Playwright Automation Scripts

This project includes two Playwright automation scripts for Zendesk in the `playwright-automation/` folder:

- `create-fake-team-members.js`: Automates the creation of 5 fake Light Agent users in Zendesk.
- `apply-launch-info-macro.js`: Processes unassigned tickets containing "Falcon 9" by assigning them, applying the "Falcon 9 launch info" macro, and submitting them as "In Progress".

### Prerequisites

- Node.js (v16+ recommended)
- Playwright installed: `npm install playwright`
- A valid `.env` file in the project root with required Zendesk credentials (see earlier sections)

### How to Run

These scripts are **standalone Node.js scripts** (not Playwright Test runner specs). Run them directly with Node.js:

```sh
node playwright-automation/create-fake-team-members.js
node playwright-automation/apply-launch-info-macro.js
```

- The browser will open in headed mode so you can observe the automation.
- You may need to complete 2FA during login (the script will wait for you).
- Progress is logged step-by-step in the terminal with colored output.

### Deprecated: .spec.ts Files

The previous `.spec.ts` Playwright Test files are no longer used. Please use the `.js` scripts above for automation.

## Video Tutorials

Watch these step-by-step video guides to see the tools in action:

### 1. Macro, View, and Custom Object Generator

**Video**: [https://www.loom.com/share/1f063b48ad4b48df98bebcf949136d7b?sid=8cb5c06d-da95-47a1-b85e-6850baa2c2f8](https://www.loom.com/share/1f063b48ad4b48df98bebcf949136d7b?sid=8cb5c06d-da95-47a1-b85e-6850baa2c2f8)

Learn how to use the `openai-zendesk-cli.js` tool to automatically generate Zendesk macros, views, and custom objects using OpenAI's language model. This video demonstrates the complete workflow from business context input to deployed Zendesk configurations.

### 2. Help Desk Theme Uploader and Article Generation

**Video**: [https://www.loom.com/share/768c9ebdb1d546d58da28a5cf51ab49b?sid=cd6bde18-05f3-4a3a-aa51-19eef14e3cf0](https://www.loom.com/share/768c9ebdb1d546d58da28a5cf51ab49b?sid=cd6bde18-05f3-4a3a-aa51-19eef14e3cf0)

See how to deploy custom Zendesk Help Center themes and generate articles using the theme uploader and article generation features. This tutorial covers theme customization, ZIP creation, and automated content generation.

### 3. Automating Ticket Management with Playwright

**Video**: [https://www.loom.com/share/00097b8d4ca94a9f899ede97ecd296a2?sid=357a7cd3-d295-4a70-a314-6d1335f15229](https://www.loom.com/share/00097b8d4ca94a9f899ede97ecd296a2?sid=357a7cd3-d295-4a70-a314-6d1335f15229)

Watch the `apply-launch-info-macro.js` script in action as it automatically processes unassigned tickets containing "Falcon 9", applies macros, and updates ticket status. This demonstrates bulk ticket automation with visual browser interaction.

### 4. Create Light Users via Playwright

**Video**: [https://www.loom.com/share/1dddd315e3b0480eb58798b6a85ad625?sid=885fa5eb-22dd-4152-93e5-48cde9db39e4](https://www.loom.com/share/1dddd315e3b0480eb58798b6a85ad625?sid=885fa5eb-22dd-4152-93e5-48cde9db39e4)

See how the `create-fake-team-members.js` script automatically creates multiple Light Agent users in Zendesk. This video shows the complete process from login through user creation, including handling overlays and form interactions.

---

_These videos provide visual demonstrations of each tool's capabilities and can help you understand the complete workflow before running the scripts yourself._
