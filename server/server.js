require('dotenv').config();
console.log('CLIENT_ID:', process.env.CLIENT_ID); // Add this line
console.log('REDIRECT_URI:', process.env.REDIRECT_URI); // Add this line
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const spotifyRoutes = require('./routes/spotify');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  app.use(cors({
    origin: allowedOrigins,
    credentials: true
  }));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/spotify', spotifyRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Spotify Playlist Organizer API is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});