import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Play, Pause, FastForward, SkipBack, Link2, CheckCircle2, ChevronUp } from 'lucide-react';
import { cn } from './BottomNav'; // Assuming cn is there
import MusicMenu from './MusicMenu';

export default function SpotifyPlayer() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('spotify_token'));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{name: string, artist: string} | null>(null);
  const [showMusicMenu, setShowMusicMenu] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.token) {
        setToken(event.data.token);
        localStorage.setItem('spotify_token', event.data.token);
        
        // As soon as we get a token, try to play a high-energy playlist
        playHighEnergyPlaylist(event.data.token);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    const authWindow = window.open('about:blank', 'oauth_popup', 'width=600,height=700');
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const response = await fetch(`https://ais-pre-pukf7am6c6fm6ry5qdobwt-273387987006.asia-southeast1.run.app/api/auth/url?redirectUri=${encodeURIComponent(redirectUri)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get auth URL');
      }
      const { url } = await response.json();

      if (authWindow) {
        authWindow.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (error: any) {
      if (authWindow) authWindow.close();
      console.warn('OAuth error:', error);
      alert('Error: ' + error.message + '\n\nPlease configure OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET for Spotify in settings or .env file to enable this functionality.');
    }
  };

  const playHighEnergyPlaylist = async (accessToken: string) => {
    try {
      // Get the user's targeted workout playlist from local storage
      const targetContextUri = localStorage.getItem('target_workout_playlist');
      
      // Fallback to "Beast Mode" high energy workout playlist URI
      const workoutPlaylistUri = targetContextUri || 'spotify:playlist:37i9dQZF1DX76Wlfdnj7AP'; 
      
      const res = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context_uri: workoutPlaylistUri
        })
      });
      
      if (res.ok) {
        setIsPlaying(true);
        fetchCurrentTrack(accessToken);
      } else {
        // If 404, maybe no active device.
        console.log("Could not start playback. Open Spotify on one of your devices first.");
      }
    } catch (err) {
      console.warn('Playback failed. Network error or missing premium subscription.');
    }
  };

  const fetchCurrentTrack = async (accessToken: string) => {
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok && res.status === 200) {
        const data = await res.json();
        if (data && data.item) {
          setCurrentTrack({
            name: data.item.name,
            artist: data.item.artists.map((a: any) => a.name).join(', ')
          });
          setIsPlaying(data.is_playing);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch current track");
    }
  };

  const togglePlay = async () => {
    if (!token) return;
    const endpoint = isPlaying ? 'pause' : 'play';
    try {
      await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setIsPlaying(!isPlaying);
      if (!isPlaying) fetchCurrentTrack(token);
    } catch (err) {
      console.warn('Toggle play failed');
    }
  };
  
  const skipNext = async () => {
    if (!token) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/next`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTimeout(() => fetchCurrentTrack(token), 1000);
    } catch (err) {
      console.warn('Skip next failed');
    }
  };

  if (!token) {
    return (
      <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-6 flex flex-col items-center justify-center text-center">
        <div className="bg-[#1DB954]/20 p-3 rounded-full mb-3 text-[#1DB954]">
          <Music size={24} />
        </div>
        <h4 className="font-bold text-sm mb-1 text-white">Workout Soundtrack</h4>
        <p className="text-xs text-neutral-400 mb-4 px-2">Link Spotify to auto-play high-energy playlists during your workouts.</p>
        <button 
          onClick={handleConnect}
          className="flex items-center space-x-2 bg-[#1DB954] text-black font-bold py-2 px-6 rounded-full text-xs"
        >
          <Link2 size={14} />
          <span>Connect Spotify</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-6 relative overflow-hidden glass-card cursor-pointer" onClick={() => setShowMusicMenu(true)}>
        <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
          <Music size={64} />
        </div>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex-1 truncate pr-4">
            <div className="flex items-center space-x-2 mb-1">
               <div className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
               <span className="text-[10px] text-[#1DB954] font-bold uppercase tracking-widest">Spotify Connected</span>
            </div>
            <h4 className="font-bold text-white text-sm truncate">
              {currentTrack ? currentTrack.name : 'Workout Playlist Ready'}
            </h4>
            <p className="text-xs text-neutral-400 truncate">
              {currentTrack ? currentTrack.artist : 'High Energy Mix'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 bg-black/40 rounded-full p-1.5 border border-white/5" onClick={e => e.stopPropagation()}>
            <button onClick={togglePlay} className="p-2 text-white hover:text-[#1DB954] transition-colors rounded-full bg-neutral-800">
               {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
            <button onClick={skipNext} className="p-2 text-white hover:text-[#1DB954] transition-colors rounded-full">
               <FastForward size={14} fill="currentColor" />
            </button>
            <button onClick={() => setShowMusicMenu(true)} className="p-2 text-white hover:text-[#1DB954] transition-colors rounded-full text-xs font-bold uppercase flex items-center pr-3">
               <ChevronUp size={14} fill="currentColor" className="mr-1" />
               Menu
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMusicMenu && (
          <div className="fixed inset-0 z-[200] overflow-hidden">
            <MusicMenu onClose={() => setShowMusicMenu(false)} />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
