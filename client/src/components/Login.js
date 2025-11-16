// src/components/Login.js
import React from 'react';
import './Login.css';

const Login = () => {
    const handleLogin = () => {
        window.location.href = 'https://spotify-organizer-backend.onrender.com/auth/login';
      };
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🎵 Spotify Playlist Organizer</h1>
        <p>Organize your music library by vibes and genres</p>
        <button className="login-button" onClick={handleLogin}>
          Login with Spotify
        </button>
      </div>
    </div>
  );
};

export default Login;