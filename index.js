require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Example route
app.get('/', (req, res) => {
  res.send('Zendesk Demo Utils API is running.');
});

// API endpoint to serve Clerk publishable key
app.get('/api/clerk-key', (req, res) => {
  res.json({
    publishableKey:
      process.env.CLERK_PUBLISHABLE_KEY ||
      'pk_test_bW9yYWwtdGFkcG9sZS02OC5jbGVyay5hY2NvdW50cy5kZXYk',
  });
});

// Placeholder for future routes using axios, etc.

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
