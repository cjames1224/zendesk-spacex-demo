// Load environment variables
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL;
const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN;

if (!ZENDESK_SUBDOMAIN || !ZENDESK_EMAIL || !ZENDESK_API_TOKEN) {
  console.error('Missing Zendesk credentials in .env');
  process.exit(1);
}

const zendeskBaseUrl = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2`;
const auth = {
  username: `${ZENDESK_EMAIL}/token`,
  password: ZENDESK_API_TOKEN,
};

const configPath = path.join(__dirname, 'spacex-zendesk-config.json');
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.error('Failed to read zendesk-config.json:', err);
  process.exit(1);
}

// Utility to write config back to disk
function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function getMacroIdByTitle(title) {
  try {
    const res = await axios.get(`${zendeskBaseUrl}/macros.json`, { auth });
    const macro = res.data.macros.find((m) => m.title === title);
    return macro ? macro.id : null;
  } catch (err) {
    console.error('Error fetching macros:', err.response?.data || err.message);
    return null;
  }
}

async function getViewIdByTitle(title) {
  try {
    const res = await axios.get(`${zendeskBaseUrl}/views.json`, { auth });
    const view = res.data.views.find((v) => v.title === title);
    return view ? view.id : null;
  } catch (err) {
    console.error('Error fetching views:', err.response?.data || err.message);
    return null;
  }
}

async function getCustomObjectIdByKey(key) {
  try {
    const res = await axios.get(`${zendeskBaseUrl}/custom_objects`, {
      auth,
    });
    if (!res.data || !Array.isArray(res.data.custom_objects)) {
      console.error(
        'Unexpected response structure when fetching custom object types:',
        JSON.stringify(res.data, null, 2)
      );
      return null;
    }
    const obj = res.data.custom_objects.find((o) => o.key === key);
    return obj ? obj.key : null;
  } catch (err) {
    if (err.response && err.response.data) {
      console.error(
        'Error fetching custom object types:',
        JSON.stringify(err.response.data, null, 2)
      );
    } else {
      console.error('Error fetching custom object types:', err.message);
    }
    return null;
  }
}

async function createMacro(macro, idx) {
  if (macro.id) {
    console.log(`Macro '${macro.title}' already has id ${macro.id}, skipping.`);
    return;
  }
  let macroId = await getMacroIdByTitle(macro.title);
  if (macroId) {
    config.macros[idx].id = macroId;
    saveConfig();
    console.log(
      `Macro '${macro.title}' already exists with id ${macroId}, skipping creation.`
    );
    return;
  }
  try {
    const res = await axios.post(
      `${zendeskBaseUrl}/macros.json`,
      { macro },
      { auth }
    );
    config.macros[idx].id = res.data.macro.id;
    saveConfig();
    console.log('Macro created:', res.data.macro.id, macro.title);
  } catch (err) {
    console.error(
      'Error creating macro:',
      macro.title,
      err.response?.data || err.message
    );
  }
}

async function createView(view, idx) {
  if (view.id) {
    console.log(`View '${view.title}' already has id ${view.id}, skipping.`);
    return;
  }
  let viewId = await getViewIdByTitle(view.title);
  if (viewId) {
    config.views[idx].id = viewId;
    saveConfig();
    console.log(
      `View '${view.title}' already exists with id ${viewId}, skipping creation.`
    );
    return;
  }
  try {
    const res = await axios.post(
      `${zendeskBaseUrl}/views.json`,
      { view },
      { auth }
    );
    config.views[idx].id = res.data.view.id;
    saveConfig();
    console.log('View created:', res.data.view.id, view.title);
  } catch (err) {
    const errorData = err.response?.data;
    console.error(
      'Error creating view:',
      view.title,
      errorData ? JSON.stringify(errorData, null, 2) : err.message
    );
  }
}

async function createCustomObject(obj, idx) {
  if (obj.id) {
    console.log(
      `Custom object '${obj.key}' already has id ${obj.id}, skipping.`
    );
    return;
  }
  let objId = await getCustomObjectIdByKey(obj.key);
  if (objId) {
    config.custom_objects[idx].id = objId;
    saveConfig();
    console.log(
      `Custom object '${obj.key}' already exists with id ${objId}, skipping creation.`
    );
    return;
  }
  try {
    const payload = {
      custom_object: {
        key: obj.key,
        name: obj.name,
        title: obj.title,
        title_pluralized: obj.title_pluralized,
        description: obj.description,
        schema: obj.schema,
      },
    };
    // Debug log for payload
    console.log(
      'Creating custom object with payload:',
      JSON.stringify(payload, null, 2)
    );
    const res = await axios.post(`${zendeskBaseUrl}/custom_objects`, payload, {
      auth,
    });
    config.custom_objects[idx].id = res.data.custom_object.key;
    saveConfig();
    console.log('Custom object created:', res.data.custom_object.key, obj.name);
  } catch (err) {
    if (err.response && err.response.data) {
      console.error(
        'Error creating custom object:',
        obj.key,
        JSON.stringify(err.response.data, null, 2)
      );
      if (err.response.data.details) {
        console.error(
          'Details:',
          JSON.stringify(err.response.data.details, null, 2)
        );
      }
    } else {
      console.error('Error creating custom object:', obj.key, err.message);
    }
  }
}

(async () => {
  for (const [i, macro] of (config.macros || []).entries()) {
    await createMacro(macro, i);
  }
  for (const [i, view] of (config.views || []).entries()) {
    await createView(view, i);
  }
  for (const [i, obj] of (config.custom_objects || []).entries()) {
    await createCustomObject(obj, i);
  }
  console.log('Zendesk demo automation complete.');
})();
