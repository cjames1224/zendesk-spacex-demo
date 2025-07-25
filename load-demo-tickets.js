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

// Function to generate random names for more organic demo tickets
function generateRandomName() {
  const firstNames = [
    'Alex',
    'Sam',
    'Jordan',
    'Taylor',
    'Casey',
    'Morgan',
    'Riley',
    'Quinn',
    'Avery',
    'Blake',
    'Cameron',
    'Drew',
    'Emery',
    'Finley',
    'Gray',
    'Harper',
    'Indigo',
    'Jamie',
    'Kendall',
    'Logan',
    'Mason',
    'Noah',
    'Oakley',
    'Parker',
    'Quincy',
    'River',
    'Sage',
    'Tatum',
    'Unity',
    'Vale',
    'Winter',
    'Xander',
    'Yuki',
    'Zion',
    'Adrian',
    'Blair',
    'Corey',
    'Dana',
    'Eden',
    'Frankie',
  ];

  const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Gonzalez',
    'Wilson',
    'Anderson',
    'Thomas',
    'Taylor',
    'Moore',
    'Jackson',
    'Martin',
    'Lee',
    'Perez',
    'Thompson',
    'White',
    'Harris',
    'Sanchez',
    'Clark',
    'Ramirez',
    'Lewis',
    'Robinson',
    'Walker',
    'Young',
    'Allen',
    'King',
    'Wright',
    'Scott',
    'Torres',
    'Nguyen',
    'Hill',
    'Flores',
    'Green',
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

function generateRandomEmail(name) {
  const domains = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'spacex.com',
  ];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  const randomNum = Math.floor(Math.random() * 1000);
  return `${cleanName}${randomNum}@${domain}`;
}

const TICKETS = [
  'When is the next Falcon 9 launch scheduled?',
  "I've been waint for Falcon 9 to launch, can you tell me when the stream will start?",
  'Can I get notified when the next Falcon 9 mission goes live?',
  "I need the Falcon 9 launch info as I'd like to monitor its progress.",
  'Give me Falcon 9 launch info. It is imperative for my business.',
];

const TICKET_COMMENTS = [
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
    const requesterName = generateRandomName();
    const requesterEmail = generateRandomEmail(requesterName);

    const res = await axios.post(
      API_URL,
      {
        ticket: {
          subject,
          comment: { body: subject },
          priority: 'normal',
          requester: {
            name: requesterName,
            email: requesterEmail,
          },
        },
      },
      {
        auth: AUTH,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return {
      success: true,
      id: res.data.ticket.id,
      subject,
      requester: requesterName,
    };
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
      console.log(`Success (ID: ${result.id}, Requester: ${result.requester})`);
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
