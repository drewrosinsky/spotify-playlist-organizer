// routes/auth.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Spotify API endpoints
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Generate random string for state parameter
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Route 1: Initiate Spotify login
router.get('/login', (req, res) => {
    console.log('=== LOGIN ROUTE HIT ===');
  console.log('CLIENT_ID:', CLIENT_ID);
  console.log('REDIRECT_URI:', REDIRECT_URI);

  const state = generateRandomString(16);
  const scope = 'user-read-private user-read-email user-library-read playlist-modify-public playlist-modify-private user-top-read';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
    state: state
  });

  res.redirect(`${SPOTIFY_AUTH_URL}?${params.toString()}`);
});

// Route 2: Callback route - exchange code for token
router.get('/callback', async (req, res) => {
    console.log('=== CALLBACK ROUTE HIT ===');
  console.log('Query params:', req.query);

  const code = req.query.code || null;
  const state = req.query.state || null;

  if (state === null) {
    res.redirect(`${FRONTEND_URL}?error=state_mismatch`);
    return;
  }

  try {
    // Exchange code for access token
    const response = await axios.post(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      }),
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Redirect to frontend with tokens
    res.redirect(`${FRONTEND_URL}/dashboard?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`);

  } catch (error) {
    console.error('Error getting tokens:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}?error=invalid_token`);
  }
});

// Route 3: Refresh access token
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;

  try {
    const response = await axios.post(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      }),
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    res.status(400).json({ error: 'Failed to refresh token' });
  }
});

module.exports = router;