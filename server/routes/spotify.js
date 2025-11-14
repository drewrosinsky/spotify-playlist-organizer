// routes/spotify.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// Middleware to check for access token
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No access token provided' });
  }
  req.token = token;
  next();
};

// Get user's profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/me`, {
      headers: { 'Authorization': `Bearer ${req.token}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching user profile:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get user's saved tracks
router.get('/tracks', requireAuth, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;

    const response = await axios.get(`${SPOTIFY_API_URL}/me/tracks`, {
      headers: { 'Authorization': `Bearer ${req.token}` },
      params: { limit, offset }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching tracks:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch tracks' });
  }
});

// Get audio features for multiple tracks
// Get audio features for multiple tracks
// Get audio features for multiple tracks
router.post('/audio-features', requireAuth, async (req, res) => {
    try {
      const { ids } = req.body;
  
      if (!ids || ids.length === 0) {
        return res.status(400).json({ error: 'No track IDs provided' });
      }
  
      console.log('Fetching audio features for', ids.length, 'tracks');
      console.log('Using token:', req.token.substring(0, 20) + '...');
      console.log('Track IDs:', ids.slice(0, 3), '...'); // Show first 3 IDs
  
      const response = await axios.get(`${SPOTIFY_API_URL}/audio-features`, {
        headers: { 
          'Authorization': `Bearer ${req.token}`,
          'Content-Type': 'application/json'
        },
        params: { ids: ids.join(',') }
      });
      
      console.log('Audio features fetched successfully');
      res.json(response.data);
    } catch (error) {
      console.error('FULL ERROR:', JSON.stringify(error.response?.data, null, 2));
      console.error('Status:', error.response?.status);
      console.error('Headers:', error.response?.headers);
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to fetch audio features',
        details: error.response?.data 
      });
    }
  });

// Create a new playlist
router.post('/create-playlist', requireAuth, async (req, res) => {
  try {
    const { user_id, name, description, track_uris } = req.body;

    // Create the playlist
    const createResponse = await axios.post(
      `${SPOTIFY_API_URL}/users/${user_id}/playlists`,
      {
        name: name,
        description: description || 'Created with Spotify Playlist Organizer',
        public: false
      },
      {
        headers: { 
          'Authorization': `Bearer ${req.token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const playlistId = createResponse.data.id;

    // Add tracks to the playlist
    if (track_uris && track_uris.length > 0) {
      await axios.post(
        `${SPOTIFY_API_URL}/playlists/${playlistId}/tracks`,
        { uris: track_uris },
        {
          headers: { 
            'Authorization': `Bearer ${req.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    res.json(createResponse.data);
  } catch (error) {
    console.error('Error creating playlist:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to create playlist' });
  }
});

module.exports = router;