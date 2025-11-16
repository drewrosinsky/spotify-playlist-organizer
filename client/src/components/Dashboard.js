import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [filteredTracks, setFilteredTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedVibe, setSelectedVibe] = useState('all');
  const [playlistName, setPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const hash = window.location.search;
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      setToken(accessToken);
      fetchUserData(accessToken);
      fetchTracks(accessToken);
    }
  }, []);

  const fetchUserData = async (accessToken) => {
    try {
      const response = await axios.get('https://spotify-organizer-backend.onrender.com/spotify/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchTracks = async (accessToken) => {
    try {
      const response = await axios.get('https://spotify-organizer-backend.onrender.com/spotify/tracks', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          limit: 50
        }
      });
      const trackItems = response.data.items;
      setTracks(trackItems);
      setFilteredTracks(trackItems);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      setLoading(false);
    }
  };

  const getTrackGenres = (track) => {
    // Get genres from all artists
    const genres = [];
    track.artists.forEach(artist => {
      if (artist.genres) {
        genres.push(...artist.genres);
      }
    });
    return genres;
  };

  const filterByVibe = (vibe) => {
    setSelectedVibe(vibe);
    
    console.log('Selected vibe:', vibe);
    console.log('Total tracks:', tracks.length);
    
    if (vibe === 'all') {
      setFilteredTracks(tracks);
      return;
    }

    const filtered = tracks.filter(item => {
      const track = item.track;
      const popularity = track.popularity; // 0-100
      const durationMs = track.duration_ms;
      const durationMin = durationMs / 60000;

      // Use popularity and duration as proxies for energy/vibe
      switch (vibe) {
        case 'happy':
          // Popular, upbeat tracks tend to be happy
          return popularity > 60;
        
        case 'sad':
          // Less popular, longer tracks tend to be slower/sadder
          return popularity < 50 && durationMin > 3.5;
        
        case 'energetic':
          // Very popular, shorter tracks tend to be high energy
          return popularity > 70 && durationMin < 4;
        
        case 'chill':
          // Medium popularity, medium-long tracks
          return popularity > 40 && popularity < 70 && durationMin > 3;
        
        case 'party':
          // Very popular tracks are often party songs
          return popularity > 75;
        
        default:
          return true;
      }
    });

    console.log('Filtered tracks:', filtered.length);
    setFilteredTracks(filtered);
  };

  const createPlaylist = async () => {
    if (!playlistName.trim()) {
      alert('Please enter a playlist name!');
      return;
    }

    if (filteredTracks.length === 0) {
      alert('No tracks to add to playlist!');
      return;
    }

    setCreating(true);

    try {
      const trackUris = filteredTracks.map(item => item.track.uri);
      
      await axios.post(
        'https://spotify-organizer-backend.onrender.com/spotify/create-playlist',
        {
          user_id: user.id,
          name: playlistName,
          description: `Created with Playlist Organizer - ${selectedVibe} vibe`,
          track_uris: trackUris
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      alert(`Playlist "${playlistName}" created successfully! 🎉 Check your Spotify app!`);
      setPlaylistName('');
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your library...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🎵 Spotify Playlist Organizer</h1>
        {user && (
          <div className="user-info">
            <p>Welcome, {user.display_name}!</p>
          </div>
        )}
      </header>

      <main className="dashboard-main">
        <section className="filter-section">
          <h2>Filter by Vibe</h2>
          <p className="filter-note">Filtering based on track popularity and duration</p>
          <div className="vibe-buttons">
            <button 
              className={selectedVibe === 'all' ? 'active' : ''} 
              onClick={() => filterByVibe('all')}
            >
              All Songs
            </button>
            <button 
              className={selectedVibe === 'happy' ? 'active' : ''} 
              onClick={() => filterByVibe('happy')}
            >
              😊 Happy
            </button>
            <button 
              className={selectedVibe === 'sad' ? 'active' : ''} 
              onClick={() => filterByVibe('sad')}
            >
              😢 Sad
            </button>
            <button 
              className={selectedVibe === 'energetic' ? 'active' : ''} 
              onClick={() => filterByVibe('energetic')}
            >
              ⚡ Energetic
            </button>
            <button 
              className={selectedVibe === 'chill' ? 'active' : ''} 
              onClick={() => filterByVibe('chill')}
            >
              😌 Chill
            </button>
            <button 
              className={selectedVibe === 'party' ? 'active' : ''} 
              onClick={() => filterByVibe('party')}
            >
              🎉 Party
            </button>
          </div>
        </section>

        <section className="create-playlist-section">
          <h2>Create Playlist ({filteredTracks.length} songs)</h2>
          <div className="playlist-creator">
            <input
              type="text"
              placeholder="Enter playlist name..."
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="playlist-input"
            />
            <button 
              onClick={createPlaylist} 
              disabled={creating}
              className="create-button"
            >
              {creating ? 'Creating...' : 'Create Playlist'}
            </button>
          </div>
        </section>

        <section className="tracks-section">
          <h2>
            {selectedVibe === 'all' ? 'All Your Tracks' : `${selectedVibe.charAt(0).toUpperCase() + selectedVibe.slice(1)} Vibes`} 
            ({filteredTracks.length})
          </h2>
          <div className="tracks-grid">
            {filteredTracks.map((item, index) => (
              <div key={index} className="track-card">
                <img 
                  src={item.track.album.images[0]?.url} 
                  alt={item.track.name}
                  className="track-image"
                />
                <div className="track-info">
                  <h3>{item.track.name}</h3>
                  <p>{item.track.artists.map(artist => artist.name).join(', ')}</p>
                  <span className="popularity">♫ {item.track.popularity}/100</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;