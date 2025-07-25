require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Launch schedule data
const launches = [
  {
    id: 'starlink-6-1',
    mission: 'Starlink Group 6-1',
    rocket: 'Falcon 9',
    launchDate: '2024-01-15T10:30:00Z',
    launchSite: 'Kennedy Space Center, Florida',
    status: 'scheduled',
    description:
      'A Falcon 9 rocket will launch Starlink satellites to low Earth orbit.',
    payload: 'Starlink satellites',
    orbit: 'Low Earth Orbit',
    missionPatch:
      'https://www.spacex.com/static/images/mission-patches/starlink.png',
  },
  {
    id: 'starlink-6-2',
    mission: 'Starlink Group 6-2',
    rocket: 'Falcon 9',
    launchDate: '2024-01-22T14:15:00Z',
    launchSite: 'Vandenberg Space Force Base, California',
    status: 'scheduled',
    description: 'Falcon 9 launching Starlink satellites to polar orbit.',
    payload: 'Starlink satellites',
    orbit: 'Polar Orbit',
    missionPatch:
      'https://www.spacex.com/static/images/mission-patches/starlink.png',
  },
  {
    id: 'starship-ift-3',
    mission: 'Starship Integrated Flight Test 3',
    rocket: 'Starship',
    launchDate: '2024-02-01T12:00:00Z',
    launchSite: 'Starbase, Texas',
    status: 'scheduled',
    description:
      'Third integrated flight test of Starship and Super Heavy booster.',
    payload: 'Test flight',
    orbit: 'Suborbital',
    missionPatch:
      'https://www.spacex.com/static/images/mission-patches/starship.png',
  },
  {
    id: 'crs-30',
    mission: 'CRS-30 (Commercial Resupply Services)',
    rocket: 'Falcon 9',
    launchDate: '2024-02-10T08:45:00Z',
    launchSite: 'Kennedy Space Center, Florida',
    status: 'scheduled',
    description:
      'Dragon spacecraft delivering supplies to the International Space Station.',
    payload: 'Dragon spacecraft with cargo',
    orbit: 'Low Earth Orbit (ISS)',
    missionPatch:
      'https://www.spacex.com/static/images/mission-patches/crs.png',
  },
  {
    id: 'starlink-6-3',
    mission: 'Starlink Group 6-3',
    rocket: 'Falcon 9',
    launchDate: '2024-02-18T16:20:00Z',
    launchSite: 'Cape Canaveral Space Force Station, Florida',
    status: 'scheduled',
    description: 'Falcon 9 launching another batch of Starlink satellites.',
    payload: 'Starlink satellites',
    orbit: 'Low Earth Orbit',
    missionPatch:
      'https://www.spacex.com/static/images/mission-patches/starlink.png',
  },
  {
    id: 'crew-8',
    mission: 'Crew-8',
    rocket: 'Falcon 9',
    launchDate: '2024-03-01T11:30:00Z',
    launchSite: 'Kennedy Space Center, Florida',
    status: 'scheduled',
    description:
      'Crew Dragon launching astronauts to the International Space Station.',
    payload: 'Crew Dragon with astronauts',
    orbit: 'Low Earth Orbit (ISS)',
    missionPatch:
      'https://www.spacex.com/static/images/mission-patches/crew.png',
  },
  {
    id: 'starlink-6-4',
    mission: 'Starlink Group 6-4',
    rocket: 'Falcon 9',
    launchDate: '2024-03-08T13:45:00Z',
    launchSite: 'Vandenberg Space Force Base, California',
    status: 'scheduled',
    description: 'Falcon 9 launching Starlink satellites to polar orbit.',
    payload: 'Starlink satellites',
    orbit: 'Polar Orbit',
    missionPatch:
      'https://www.spacex.com/static/images/mission-patches/starlink.png',
  },
  {
    id: 'starship-ift-4',
    mission: 'Starship Integrated Flight Test 4',
    rocket: 'Starship',
    launchDate: '2024-03-15T10:00:00Z',
    launchSite: 'Starbase, Texas',
    status: 'scheduled',
    description:
      'Fourth integrated flight test of Starship and Super Heavy booster.',
    payload: 'Test flight',
    orbit: 'Suborbital',
    missionPatch:
      'https://www.spacex.com/static/images/mission-patches/starship.png',
  },
];

// Health check route
app.get('/', (req, res) => {
  res.send('Zendesk Demo Utils API is running.');
});

// API endpoint to serve Clerk publishable key
app.get('/api/clerk-key', (req, res) => {
  const publishableKey =
    process.env.CLERK_PUBLISHABLE_KEY ||
    'pk_test_bW9yYWwtdGFkcG9sZS02OC5jbGVyay5hY2NvdW50cy5kZXYk';
  console.log(publishableKey);
  res.json({ publishableKey });
});

// Launch schedule routes
app.get('/api/launches', (req, res) => {
  res.json({
    success: true,
    count: launches.length,
    launches: launches,
  });
});

app.get('/api/launches/:launchId', (req, res) => {
  const launchId = req.params.launchId;
  const launch = launches.find((l) => l.id === launchId);

  if (!launch) {
    return res.status(404).json({
      success: false,
      error: 'Launch not found',
      message: `No launch found with ID: ${launchId}`,
    });
  }

  res.json({
    success: true,
    launch: launch,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
