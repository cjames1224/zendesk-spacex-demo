require('dotenv').config();
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const axios = require('axios');
const FormData = require('form-data');

// --- CONFIG ---
// Support --folder FOLDER_RELATIVE_PATH to override theme folder
let folderArg = null;
const folderIndex = process.argv.indexOf('--folder');
if (
  folderIndex !== -1 &&
  process.argv[folderIndex + 1] &&
  !process.argv[folderIndex + 1].startsWith('--')
) {
  folderArg = process.argv[folderIndex + 1];
}
const THEME_DIR = path.join(
  __dirname,
  folderArg || './zendesk-help-center-theme'
);
const ZIP_PATH = path.join(
  __dirname,
  (folderArg ? folderArg.replace(/\/+$/, '') : 'zendesk-help-center-theme') +
    '.zip'
);
const MANIFEST_PATH = path.join(THEME_DIR, 'manifest.json');

const ZD_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN; // e.g. 'yoursubdomain'
const ZD_EMAIL = process.env.ZENDESK_EMAIL; // e.g. 'user@example.com/token'
const ZD_PASSWORD = process.env.ZENDESK_API_TOKEN; // or API token
const ZD_BRAND_ID = process.env.ZENDESK_BRAND_ID; // optional, for multi-brand

const args = process.argv.slice(2);
const isImport = args.includes('--import');
const isUpdate = args.includes('--update');
const shouldSetLive = args.includes('--set-live');
let updateThemeId = null;
if (isUpdate) {
  const updateIndex = args.indexOf('--update');
  updateThemeId = args[updateIndex + 1];
  if (!updateThemeId || updateThemeId.startsWith('--')) {
    console.error('Error: You must provide THEME_ID after --update.');
    console.error(
      'Usage: node demo-utils/zip-and-import-zendesk-theme.js --update THEME_ID'
    );
    process.exit(1);
  }
}

if ((isImport || isUpdate) && (!ZD_SUBDOMAIN || !ZD_EMAIL || !ZD_PASSWORD)) {
  console.error(
    'Please set ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ZENDESK_API_TOKEN env vars.'
  );
  process.exit(1);
}

const auth = {
  username: `${ZD_EMAIL}/token`,
  password: ZD_PASSWORD,
};

// --- PATCH: Increment manifest version for update ---
function incrementManifestVersion() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('manifest.json not found in theme directory.');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  let version = manifest.version || manifest.meta?.version;
  if (!version) {
    console.error('No version field found in manifest.json.');
    process.exit(1);
  }
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    console.error(
      'Version is not in semantic versioning format (x.y.z):',
      version
    );
    process.exit(1);
  }
  parts[2] += 1; // increment patch
  const newVersion = parts.join('.');
  if (manifest.version) {
    manifest.version = newVersion;
  } else if (manifest.meta && manifest.meta.version) {
    manifest.meta.version = newVersion;
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Incremented manifest version to ${newVersion}`);
}

// --- 1. ZIP THEME FOLDER ---
function zipTheme() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(ZIP_PATH);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => {
      console.log(`Zipped theme: ${ZIP_PATH} (${archive.pointer()} bytes)`);
      resolve();
    });
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(THEME_DIR, false);
    archive.finalize();
  });
}

// --- 2. CREATE THEME IMPORT JOB ---
async function createImportJob() {
  const url = `https://${ZD_SUBDOMAIN}.zendesk.com/api/v2/guide/theming/jobs/themes/imports`;
  const data = {
    job: {
      attributes: {
        format: 'zip',
        ...(ZD_BRAND_ID ? { brand_id: ZD_BRAND_ID } : {}),
      },
    },
  };
  try {
    const res = await axios.post(url, data, {
      auth,
      headers: { 'Content-Type': 'application/json' },
    });
    const job = res.data.job;
    console.log('Created import job:', job.id);
    return job;
  } catch (err) {
    console.error(
      'Error creating import job:',
      err.response?.data || err.message
    );
    process.exit(1);
  }
}

// --- 2b. CREATE THEME UPDATE JOB ---
async function createUpdateJob(themeId) {
  const url = `https://${ZD_SUBDOMAIN}.zendesk.com/api/v2/guide/theming/jobs/themes/updates`;
  const data = {
    job: {
      attributes: {
        theme_id: themeId,
        replace_settings: true,
        format: 'zip',
      },
    },
  };
  try {
    const res = await axios.post(url, data, {
      auth,
      headers: { 'Content-Type': 'application/json' },
    });
    const job = res.data.job;
    console.log('Created update job:', job.id);
    return job;
  } catch (err) {
    console.error(
      'Error creating update job:',
      err.response?.data || err.message
    );
    process.exit(1);
  }
}

// --- 3. UPLOAD ZIP TO STORAGE LOCATION ---
async function uploadZip(upload) {
  const form = new FormData();
  for (const [key, value] of Object.entries(upload.parameters)) {
    form.append(key, value);
  }
  form.append('file', fs.createReadStream(ZIP_PATH));
  try {
    const res = await axios.post(upload.url, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      // No auth headers!
    });
    console.log('Uploaded zip to storage location.');
    return res.data;
  } catch (err) {
    console.error('Error uploading zip:', err.response?.data || err.message);
    process.exit(1);
  }
}

// --- SET THEME LIVE ---
async function setLiveTheme(themeId) {
  if (!themeId) {
    console.error('No themeId provided to set live.');
    process.exit(1);
  }
  const url = `https://${ZD_SUBDOMAIN}.zendesk.com/api/v2/guide/themes/${themeId}/activate`;
  try {
    const res = await axios.put(url, {}, { auth });
    console.log('Theme set live successfully:', res.data.theme.id);
    return res.data.theme;
  } catch (err) {
    console.error(
      'Error setting theme live:',
      err.response?.data || err.message
    );
    process.exit(1);
  }
}

// --- 4. POLL JOB STATUS ---
async function pollJob(jobId, setLiveAfter = false) {
  const url = `https://${ZD_SUBDOMAIN}.zendesk.com/api/v2/guide/theming/jobs/${jobId}`;
  let status = 'pending';
  let themeId = null;
  while (status === 'pending') {
    try {
      const res = await axios.get(url, { auth });
      status = res.data.job.status;
      if (status === 'completed') {
        console.log('Theme job completed!');
        console.log(JSON.stringify(res.data.job, null, 2));
        // Try to get the theme id from the job result
        if (res.data.job.result && res.data.job.result.theme) {
          themeId = res.data.job.result.theme.id;
        } else if (
          res.data.job.attributes &&
          res.data.job.attributes.theme_id
        ) {
          themeId = res.data.job.attributes.theme_id;
        }
        if (setLiveAfter && themeId) {
          await setLiveTheme(themeId);
        } else if (setLiveAfter && !themeId) {
          console.error('Could not determine themeId to set live.');
          process.exit(1);
        }
        process.exit(0);
      } else if (status === 'failed') {
        console.error('Theme job failed:', res.data.job.errors);
        process.exit(1);
      } else {
        console.log('Job pending...');
        await new Promise((r) => setTimeout(r, 5000));
      }
    } catch (err) {
      console.error('Error polling job:', err.response?.data || err.message);
      process.exit(1);
    }
  }
}

function printHelp() {
  console.log('Usage:');
  console.log(
    '  node demo-utils/zip-and-import-zendesk-theme.js [--folder FOLDER_RELATIVE_PATH]                # Only zip the theme'
  );
  console.log(
    '  node demo-utils/zip-and-import-zendesk-theme.js [--folder FOLDER_RELATIVE_PATH] --import       # Zip and import as new theme'
  );
  console.log(
    '  node demo-utils/zip-and-import-zendesk-theme.js [--folder FOLDER_RELATIVE_PATH] --update THEME_ID  # Zip and update existing theme (increments version)'
  );
  console.log('');
  console.log(
    '  --folder FOLDER_RELATIVE_PATH   (optional) Use a different theme folder (default: zendesk-help-center-theme)'
  );
}

// --- MAIN ---
(async () => {
  if (isUpdate) {
    incrementManifestVersion();
  }
  await zipTheme();
  if (isImport) {
    const job = await createImportJob();
    await uploadZip(job.data.upload);
    await pollJob(job.id, shouldSetLive);
  } else if (isUpdate) {
    const job = await createUpdateJob(updateThemeId);
    await uploadZip(job.data.upload);
    await pollJob(job.id, shouldSetLive);
  } else if (args.length > 0) {
    printHelp();
    process.exit(1);
  } else {
    // Only zip, nothing else
    process.exit(0);
  }
})();
