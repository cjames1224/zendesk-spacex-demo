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
