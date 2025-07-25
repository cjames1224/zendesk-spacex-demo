require('dotenv').config();
const axios = require('axios');

const ZD_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const ZD_EMAIL = process.env.ZENDESK_EMAIL;
const ZD_API_TOKEN = process.env.ZENDESK_API_TOKEN;

if (!ZD_SUBDOMAIN || !ZD_EMAIL || !ZD_API_TOKEN) {
  console.error(
    'Please set ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ZENDESK_API_TOKEN in your .env file.'
  );
  process.exit(1);
}

const TICKETS = [
  'When is the next Falcon 9 launch scheduled?',
  'Can I get notified when the next Starlink mission goes live?',
  'Where can I watch the launch livestream?',
  'Why was the launch delayed? I saw the date changed again.',
  'Is the launch still happening today with the weather issues in Florida?',
  'Can you explain what a static fire test is?',
  'What is the difference between Falcon 9 and Falcon Heavy?',
  "My order hasn't arrived – where is my 'Occupy Mars' hoodie?",
  'I ordered the wrong size for my X Æ A-12 toddler tee. Can I exchange it?',
  "Do you ship internationally? I'm in the UK.",
];

const API_URL = `https://${ZD_SUBDOMAIN}.zendesk.com/api/v2/tickets.json`;
const AUTH = {
  username: `${ZD_EMAIL}/token`,
  password: ZD_API_TOKEN,
};

async function createTicket(subject) {
  try {
    const res = await axios.post(
      API_URL,
      {
        ticket: {
          subject,
          comment: { body: subject },
          priority: 'normal',
        },
      },
      {
        auth: AUTH,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return { success: true, id: res.data.ticket.id, subject };
  } catch (err) {
    return {
      success: false,
      error: err.response?.data || err.message,
      subject,
    };
  }
}

(async () => {
  console.log('Creating demo tickets in Zendesk...');
  const results = [];
  for (const subject of TICKETS) {
    process.stdout.write(`Creating: "${subject}" ... `);
    const result = await createTicket(subject);
    if (result.success) {
      console.log(`Success (ID: ${result.id})`);
    } else {
      console.log('Failed');
      console.error(result.error);
    }
    results.push(result);
  }
  // Summary
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;
  console.log(`\nDone. ${successCount} tickets created, ${failCount} failed.`);
})();
