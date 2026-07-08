import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Music, Play, Pause, FastForward, SkipBack, Link2, CheckCircle2, Volume2, Settings2, ShieldCheck, Speaker, Smartphone, Laptop, Search, Plus, X, Trash2, MoreVertical } from 'lucide-react';
import { cn } from './BottomNav';
import { useAppContext } from '../context/AppContext';
import FireProgressBar from './FireProgressBar';
import KineticVolumeBar from './KineticVolumeBar';
import { useUnifiedSearch, SearchResultType } from '../context/SearchContext';
import localforage from 'localforage';

interface Props {
  onClose: () => void;
}

import { 
  LocalAudioTrack, 
  localAudioPlayer, 
  globalLocalAudioTracks, 
  globalLocalAudioIndex, 
  isLocalMusicLoaded, 
  setGlobalLocalAudioTracks, 
  setGlobalLocalAudioIndex, 
  setLocalMusicLoaded,
  skipNextLocalTrack,
  skipPrevLocalTrack
} from '../utils/audio';

export function cleanTrackName(name: string): string {
  let cleaned = name;
  for (let i = 0; i < 10; i++) {
    const prev = cleaned;
    cleaned = cleaned.replace(/[-_()\s]*\bcopy\b[-_()\s]*/gi, ' ');
    if (cleaned === prev) break;
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^[-_\s()]+|[-_\s()]+$/g, '').trim();
  return cleaned || "Untitled Track";
}

export async function initializeLocalTracks() {
  if (isLocalMusicLoaded) return;
  try {
    const saved = await localforage.getItem<any[]>('local_audio_tracks');
    if (saved && saved.length > 0) {
      const tracks = saved.map(t => ({
        id: t.id,
        name: cleanTrackName(t.name),
        blob: t.blob,
        url: URL.createObjectURL(t.blob)
      }));
      setGlobalLocalAudioTracks(tracks);
      
      if (tracks.length > 0) {
         localAudioPlayer.src = tracks[0].url;
         setGlobalLocalAudioIndex(0);
      }
    }
    setLocalMusicLoaded(true);
    window.dispatchEvent(new Event('local_tracks_updated'));
  } catch (err) {
    console.error("Failed to init local tracks", err);
  }
}

export async function saveLocalTracksToDB() {
  try {
    const toSave = globalLocalAudioTracks.map(t => ({ id: t.id, name: t.name, blob: t.blob }));
    await localforage.setItem('local_audio_tracks', toSave);
  } catch (err) {}
}

initializeLocalTracks();

export default function MusicMenu({ onClose }: Props) {
  const { theme } = useAppContext();
  const { searchQuery, setSearchQuery, performSearch, searchResults, isSearching } = useUnifiedSearch();
  const [token, setToken] = useState<string | null>(localStorage.getItem('spotify_token'));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{name: string, artist: string, albumArt?: string} | null>(null);
  const [autoSountrack, setAutoSoundtrack] = useState(true);
  const [volume, setVolume] = useState(50);
  const [devices, setDevices] = useState<any[]>([]);
  const [activeDevice, setActiveDevice] = useState<string | null>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [targetPlaylistUri, setTargetPlaylistUri] = useState<string | null>(localStorage.getItem('target_workout_playlist') || null);

  const [savedTracks, setSavedTracks] = useState<any[]>([]);
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);

  const [localTracks, setLocalTracks] = useState<LocalAudioTrack[]>(globalLocalAudioTracks);
  const [currentLocalIndex, setCurrentLocalIndex] = useState(globalLocalAudioIndex);
  const [isLocalPlaying, setIsLocalPlaying] = useState(!localAudioPlayer.paused && localAudioPlayer.src !== '');
  const [showLocalOptions, setShowLocalOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playerRef = useRef<any>(null);

  const [durationMs, setDurationMs] = useState<number>(0);
  const [progressMs, setProgressMs] = useState<number>(0);

  useEffect(() => {
    const updateProgress = () => {
      if (localAudioPlayer.src) {
        setProgressMs(localAudioPlayer.currentTime * 1000);
        setDurationMs(localAudioPlayer.duration * 1000);
      }
    };
    localAudioPlayer.addEventListener('timeupdate', updateProgress);
    localAudioPlayer.addEventListener('loadedmetadata', updateProgress);
    return () => {
      localAudioPlayer.removeEventListener('timeupdate', updateProgress);
      localAudioPlayer.removeEventListener('loadedmetadata', updateProgress);
    };
  }, []);

  // Sync Local Audio State
  useEffect(() => {
    const syncLocalState = () => {
      setLocalTracks([...globalLocalAudioTracks]);
      setCurrentLocalIndex(globalLocalAudioIndex);
      setIsLocalPlaying(!localAudioPlayer.paused && localAudioPlayer.src !== '');
    };
    window.addEventListener('local_tracks_updated', syncLocalState);
    localAudioPlayer.addEventListener('play', syncLocalState);
    localAudioPlayer.addEventListener('pause', syncLocalState);
    
    // Initial sync
    syncLocalState();
    
    return () => {
      window.removeEventListener('local_tracks_updated', syncLocalState);
      localAudioPlayer.removeEventListener('play', syncLocalState);
      localAudioPlayer.removeEventListener('pause', syncLocalState);
    };
  }, []);

  // Fetch current track periodically
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      // Only poll API if SDK isn't handling states locally
      if (!isSdkReady) {
        fetchCurrentTrack(token);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [token, isSdkReady]);

  // Simulate progress
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && !localAudioPlayer.src && durationMs > 0) {
      interval = setInterval(() => {
        setProgressMs(prev => Math.min(prev + 1000, durationMs));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationMs]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setProgressMs(val);
    if (localAudioPlayer.src) {
       localAudioPlayer.currentTime = val / 1000;
    } else if (token) {
       fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${val}`, {
         method: 'PUT',
         headers: { 'Authorization': `Bearer ${token}` }
       });
    }
  };

  // Default playlists to show
  const recentPlaylists = [
    { id: '37i9dQZF1DX76Wlfdnj7AP', name: 'Beast Mode', tracks: '200', type: 'High Energy' },
    { id: '37i9dQZF1DX4eRPd9vX1IQ', name: 'Workout Twerkout', tracks: '150', type: 'Hip Hop / Pop' },
    { id: '37i9dQZF1DWZqzjXVI3H8m', name: 'Phonk', tracks: '120', type: 'Electronic / Phonk' }
  ];

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.token) {
        setToken(event.data.token);
        localStorage.setItem('spotify_token', event.data.token);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!token) return;

    // Load Spotify SDK
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      const player = new (window as any).Spotify.Player({
        name: 'AI Studio Health App',
        getOAuthToken: (cb: any) => { cb(token); },
        volume: volume / 100
      });

      player.addListener('initialization_error', ({ message }: any) => {
        console.warn('Spotify SDK initialization_error:', message);
      });
      player.addListener('authentication_error', ({ message }: any) => {
        console.warn('Spotify SDK authentication_error:', message);
      });
      player.addListener('account_error', ({ message }: any) => {
        setPremiumError('This functionality is restricted to premium users only. A Spotify Premium account is required.');
      });
      player.addListener('playback_error', ({ message }: any) => {
        console.warn('Spotify SDK playback_error:', message);
      });

      player.addListener('ready', ({ device_id }: {device_id: string}) => {
        console.log('Ready with Device ID', device_id);
        setIsSdkReady(true);
        setActiveDevice(device_id);
        fetchDevices(token);
        
        // Auto-transfer playback to this web player
        fetch(`https://api.spotify.com/v1/me/player`, {
          method: 'PUT',
          headers: { 
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json'
          },
          body: JSON.stringify({ device_ids: [device_id], play: false })
        }).catch(err => console.warn("Failed to transfer playback, likely non-premium account."));
      });

      player.addListener('not_ready', ({ device_id }: {device_id: string}) => {
        console.log('Device ID has gone offline', device_id);
      });

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        setCurrentTrack({
          name: state.track_window.current_track.name,
          artist: state.track_window.current_track.artists[0].name,
          albumArt: state.track_window.current_track.album.images[0]?.url
        });
        setIsPlaying(!state.paused);
      });

      player.connect().then((success: boolean) => {
        if (success) {
          console.log('The Web Playback SDK successfully connected to Spotify!');
        }
      });

      playerRef.current = player;
    };

    fetchCurrentTrack(token);
    fetchDevices(token);
    fetchUserPlaylists(token);
    fetchSavedTracks(token);
    
    return () => {
      if (playerRef.current) playerRef.current.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const onPlay = () => setIsLocalPlaying(true);
    const onPause = () => setIsLocalPlaying(false);
    const onEnded = () => {
      if (globalLocalAudioIndex < globalLocalAudioTracks.length - 1) {
        const newIndex = globalLocalAudioIndex + 1;
        setGlobalLocalAudioIndex(newIndex);
        setCurrentLocalIndex(newIndex);
        localAudioPlayer.src = globalLocalAudioTracks[newIndex].url;
        localAudioPlayer.play().catch(console.warn);
      } else {
        setIsLocalPlaying(false);
      }
    };
    
    localAudioPlayer.addEventListener('play', onPlay);
    localAudioPlayer.addEventListener('pause', onPause);
    localAudioPlayer.addEventListener('ended', onEnded);
    return () => {
      localAudioPlayer.removeEventListener('play', onPlay);
      localAudioPlayer.removeEventListener('pause', onPause);
      localAudioPlayer.removeEventListener('ended', onEnded);
    };
  }, []);

  const handleLocalFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newTracks = Array.from(e.target.files).map(file => ({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        name: cleanTrackName(file.name.replace(/\.[^/.]+$/, "")), // remove extension
        blob: file,
        url: URL.createObjectURL(file)
      }));
      
      const tracks = [...globalLocalAudioTracks, ...newTracks];
      setGlobalLocalAudioTracks(tracks);
      setLocalTracks([...tracks]);
      
      if (localAudioPlayer.src === '' || localAudioPlayer.paused) {
        if (localAudioPlayer.src === '') {
           const newIndex = tracks.length - newTracks.length;
           setGlobalLocalAudioIndex(newIndex);
           setCurrentLocalIndex(newIndex);
           localAudioPlayer.src = tracks[newIndex].url;
        }
        localAudioPlayer.play().catch(console.warn);
      }
      
      await saveLocalTracksToDB();
      window.dispatchEvent(new Event('local_tracks_updated'));
      
      // Reset input value so same files can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeLocalTrack = async (e: any, index: number) => {
    e?.stopPropagation?.();
    const isRemovingCurrent = currentLocalIndex === index;
    const tracks = [...globalLocalAudioTracks];
    tracks.splice(index, 1);
    setGlobalLocalAudioTracks(tracks);
    
    if (tracks.length === 0) {
       clearLocalTracks();
       return;
    }
    
    if (isRemovingCurrent) {
       const nextIndex = Math.min(index, tracks.length - 1);
       setGlobalLocalAudioIndex(nextIndex);
       localAudioPlayer.src = tracks[nextIndex].url;
       localAudioPlayer.play().catch(console.warn);
    } else if (index < globalLocalAudioIndex) {
       setGlobalLocalAudioIndex(globalLocalAudioIndex - 1);
    }
    
    setLocalTracks([...tracks]);
    setCurrentLocalIndex(globalLocalAudioIndex);
    await saveLocalTracksToDB();
    window.dispatchEvent(new Event('local_tracks_updated'));
  };

  const playLocalTrack = (index: number) => {
    setGlobalLocalAudioIndex(index);
    setCurrentLocalIndex(index);
    localAudioPlayer.src = globalLocalAudioTracks[index].url;
    localAudioPlayer.play().catch(console.warn);
    window.dispatchEvent(new Event('local_tracks_updated'));
  };

  const toggleLocalPlay = () => {
    if (localAudioPlayer.src) {
       if (localAudioPlayer.paused) {
          localAudioPlayer.play().catch(console.warn);
       } else {
          localAudioPlayer.pause();
       }
    }
  };

  const clearLocalTracks = async () => {
    localAudioPlayer.pause();
    localAudioPlayer.src = '';
    setGlobalLocalAudioTracks([]);
    setGlobalLocalAudioIndex(0);
    setLocalTracks([]);
    setCurrentLocalIndex(0);
    setIsLocalPlaying(false);
    await saveLocalTracksToDB();
    window.dispatchEvent(new Event('local_tracks_updated'));
  };

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
        // Fallback to direct navigation if popup is blocked
        window.location.href = url;
      }
    } catch (error: any) {
      if (authWindow) authWindow.close();
      console.error('OAuth error:', error);
      alert('Error: ' + error.message);
    }
  };

  const updateDiagnostics = (key: string, data: any) => {
    try {
      const existingStr = localStorage.getItem('spotify_diagnostics');
      const existing = existingStr ? JSON.parse(existingStr) : {};
      existing[key] = {
        timestamp: new Date().toISOString(),
        data
      };
      localStorage.setItem('spotify_diagnostics', JSON.stringify(existing));
    } catch (e) {}
  };

  const fetchDevices = async (accessToken: string) => {
     try {
       const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
         headers: { 'Authorization': `Bearer ${accessToken}` }
       });
       if (res.ok) {
         const data = await res.json();
         setDevices(data.devices || []);
         updateDiagnostics('devices', { status: res.status, ok: true, devices: data.devices });
       } else {
         updateDiagnostics('devices', { status: res.status, ok: false, error: await res.text() });
       }
     } catch (err: any) {
       updateDiagnostics('devices', { status: 'error', error: err?.message || String(err) });
     }
  };

  const fetchSavedTracks = async (accessToken: string) => {
    try {
      const res = await fetch('https://api.spotify.com/v1/me/tracks?limit=20', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedTracks(data.items || []);
      } else {
         const errText = await res.text();
         if (res.status === 403 || errText.toLowerCase().includes('premium')) {
            setPremiumError("Spotify Premium required to access saved tracks.");
         }
      }
    } catch (err) {
      console.warn("Failed to fetch saved tracks");
    }
  };

  const fetchPlaylistTracks = async (playlistId: string) => {
    if (!token) return;
    setIsLoadingTracks(true);
    try {
      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylistTracks(data.items || []);
      } else {
         const errText = await res.text();
         if (res.status === 403 || errText.toLowerCase().includes('premium')) {
           setPremiumError("Spotify returned a 403 Forbidden. This often means the app owner or user needs an active Premium subscription for these API endpoints.");
         }
      }
    } catch (err) {
      console.warn("Failed to fetch playlist tracks");
    }
    setIsLoadingTracks(false);
  };

  const fetchUserPlaylists = async (accessToken: string) => {
    try {
      const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserPlaylists(data.items || []);
        updateDiagnostics('playlists', { status: res.status, ok: true, count: data.items?.length, summary: data.items?.map((i: any) => ({ name: i.name, id: i.id })) });
      } else {
        const errText = await res.text();
        updateDiagnostics('playlists', { status: res.status, ok: false, error: errText });
        if (res.status === 403 || errText.toLowerCase().includes('premium')) {
           setPremiumError("Spotify returned a 403 Forbidden. This often means the app owner or user needs an active Premium subscription for these API endpoints.");
        } else {
           console.warn("Failed to fetch playlists:", errText);
        }
      }
    } catch (err: any) {
      updateDiagnostics('playlists', { status: 'error', error: err?.message || String(err) });
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
            artist: data.item.artists.map((a: any) => a.name).join(', '),
            albumArt: data.item.album?.images[0]?.url
          });
          setIsPlaying(data.is_playing);
          if (!localAudioPlayer.src) {
             setProgressMs(data.progress_ms || 0);
             setDurationMs(data.item.duration_ms || 0);
          }
        }
      }
    } catch(err) {
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
    } catch (err) {}
  };
  
  const skipNext = async () => {
    if (localAudioPlayer.src) {
      skipNextLocalTrack();
      return;
    }
    if (!token) return;
    
    // Optimistic UI update or clear name to show action
    setCurrentTrack(prev => prev ? { ...prev, name: 'Skipping...', artist: 'Please wait' } : null);
    
    try {
      await fetch(`https://api.spotify.com/v1/me/player/next`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Multiple attempts to sync due to Spotify API propagation delay
      setTimeout(() => fetchCurrentTrack(token), 800);
      setTimeout(() => fetchCurrentTrack(token), 2000);
      setTimeout(() => fetchCurrentTrack(token), 4000);
    } catch (err) {
      fetchCurrentTrack(token);
    }
  };

  const skipPrevious = async () => {
    if (localAudioPlayer.src) {
      skipPrevLocalTrack();
      return;
    }
    if (!token) return;

    setCurrentTrack(prev => prev ? { ...prev, name: 'Skipping...', artist: 'Please wait' } : null);

    try {
      await fetch(`https://api.spotify.com/v1/me/player/previous`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTimeout(() => fetchCurrentTrack(token), 800);
      setTimeout(() => fetchCurrentTrack(token), 2000);
      setTimeout(() => fetchCurrentTrack(token), 4000);
    } catch (err) {
      fetchCurrentTrack(token);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (playerRef.current) {
      playerRef.current.setVolume(val / 100);
    } else if (token) {
      fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${val}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  };

  const transferPlayback = async (deviceId: string) => {
    if (!token) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player`, {
        method: 'PUT',
        headers: { 
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json'
        },
        body: JSON.stringify({ device_ids: [deviceId], play: true })
      });
      setActiveDevice(deviceId);
      fetchDevices(token);
    } catch (err) {}
  };

  const queueSong = async (uri: string) => {
    if (!token) return;
    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`, {
        method: 'POST',
        headers: { 
           'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
         const errText = await res.text();
         if (res.status === 403 || errText.toLowerCase().includes('premium')) {
            setPremiumError("Spotify Premium is required to add songs to the queue.");
         }
      } else {
         // Show some visual feedback or notification if possible
         console.log("Song added to queue");
         setQueueMessage("Added to queue");
         setTimeout(() => setQueueMessage(null), 2500);
      }
    } catch (err) {}
  };

  const playSong = async (uri: string) => {
    if (!token) return;
    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: 'PUT',
        headers: { 
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: [uri] })
      });
      if (!res.ok) {
         const errText = await res.text();
         if (res.status === 403 || errText.toLowerCase().includes('premium')) {
            setPremiumError("Spotify Premium is required to play songs programmatically.");
         }
      }
      setTimeout(() => fetchCurrentTrack(token), 1000);
    } catch (err) {}
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn("flex flex-col z-50", theme === 'dark' ? "bg-[#0a0a0a] text-white" : "bg-[#f8fafc] text-black")}
    >
      <header className={cn("sticky top-0 z-50 px-8 py-10 border-b border-card-border flex items-center gap-6 backdrop-blur-3xl bg-background/60 shadow-[0_4px_30px_rgba(0,0,0,0.1)]")}>
        <button onClick={onClose} className="p-3 bg-surface-elevated border border-card-border rounded-2xl hover:scale-110 hover:rotate-[-5deg] transition-all shadow-xl shadow-black/20 group">
          <ChevronLeft size={24} strokeWidth={3} className="text-muted group-hover:text-foreground transition-colors" />
        </button>
        <div className="flex flex-col">
           <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Audio Engine</h2>
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-40 mt-2">Harmonic Calibration</span>
        </div>
      </header>

      <div className="flex-1 pb-32 p-6 space-y-8">
        
        {/* Queue Message Toast */}
        {queueMessage && (
           <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-[#1DB954] text-black font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} />
              {queueMessage}
           </div>
        )}
        
        {/* Connection Status */}
        {token && premiumError && (
           <div className="w-full bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
              <h4 className="font-bold text-rose-500 mb-1">Spotify Premium Required</h4>
              <p className="text-xs text-rose-400 opacity-90">{premiumError}</p>
           </div>
        )}
        <div className={cn("glass-card border rounded-3xl p-6", theme === 'dark' ? "border-white/5 bg-[#111]" : "border-black/5 bg-white")}>
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm tracking-wide">Linked Services</h3>
           </div>
           
           {!token ? (
             <div className="flex flex-col items-center justify-center p-4 py-8 text-center bg-[#1DB954]/10 rounded-2xl border border-[#1DB954]/20">
               <div className="bg-[#1DB954] p-4 rounded-full mb-4">
                 <Music size={28} className="text-black" />
               </div>
               <h4 className="font-black text-lg mb-2">Connect Spotify</h4>
               <p className="text-xs opacity-70 mb-2 max-w-[200px]">Link your premium account to play workout soundtracks directly in the app.</p>
               <div className="bg-black/20 p-2 rounded-lg text-[10px] break-all font-mono text-[#1DB954] mb-4 w-full select-all selection:bg-[#1DB954] selection:text-black mt-2 border border-[#1DB954]/20 relative group">
                  <div className="absolute -top-2 left-2 bg-[#1DB954] text-black px-1.5 rounded text-[8px] font-bold uppercase tracking-wider">Redirect URI for Spotify</div>
                  {window.location.origin}/auth/callback
               </div>
               <button 
                 onClick={handleConnect}
                 className="flex items-center space-x-2 bg-[#1DB954] text-black font-bold py-3 px-8 rounded-full text-sm hover:scale-105 transition-transform"
               >
                 <Link2 size={16} />
                 <span>Connect Account</span>
               </button>
             </div>
           ) : (
             <div className="flex items-center justify-between p-4 bg-[#1DB954]/10 rounded-2xl border border-[#1DB954]/30">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center">
                      <Music size={20} className="text-black" />
                   </div>
                   <div>
                      <h4 className="font-bold text-sm">Spotify Connected</h4>
                      <p className="text-xs opacity-70 flex items-center gap-1 mt-1">
                         <span className="w-2 h-2 rounded-full bg-[#1DB954] inline-block animate-pulse" />
                         Web Playback {isSdkReady ? 'Ready' : 'Initializing...'}
                      </p>
                   </div>
                </div>
                <button 
                   onClick={() => {
                      setToken(null);
                      localStorage.removeItem('spotify_token');
                      if (playerRef.current) playerRef.current.disconnect();
                   }}
                   className="text-xs font-bold text-rose-400 p-2"
                >
                   Disconnect
                </button>
             </div>
           )}
        </div>

        {/* Unified Player Controls */}
        {(token || localTracks.length > 0) && (
           <div className={cn("glass-card border rounded-3xl p-6 overflow-hidden relative", theme === 'dark' ? "border-white/5 bg-[#1a1a1a]" : "border-black/5 bg-white")}>
              {(!localAudioPlayer.src && currentTrack?.albumArt) && (
                 <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url(${currentTrack.albumArt})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px)' }} />
              )}
              
              <div className="relative z-10 flex flex-col items-center">
                 {!localAudioPlayer.src && currentTrack?.albumArt ? (
                    <img src={currentTrack.albumArt} alt="Album Art" className="w-32 h-32 rounded-2xl shadow-xl mb-6 object-cover" />
                 ) : (
                    <div className="w-32 h-32 rounded-2xl bg-neutral-800 flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
                       {localAudioPlayer.src && (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/20 to-transparent pointer-events-none" />
                       )}
                       <Music size={40} className={localAudioPlayer.src ? "text-[#1DB954]" : "text-neutral-600"} />
                    </div>
                 )}

                 <h3 className="text-xl font-black mb-1 text-center truncate w-full px-4">
                    {localAudioPlayer.src ? (localTracks[currentLocalIndex]?.name || 'Local Track') : (currentTrack ? currentTrack.name : 'Ready to Play')}
                 </h3>
                 <p className="text-sm opacity-60 mb-6">
                    {localAudioPlayer.src ? 'Local MP3' : (currentTrack ? currentTrack.artist : 'Select a device or playlist to start')}
                 </p>

                  <div className="w-full px-4 mb-6">
                    <FireProgressBar 
                      progress={durationMs > 0 ? progressMs / durationMs : 0}
                      onSeek={(e) => {
                        const val = parseFloat(e.target.value) * durationMs;
                        handleSeek({ target: { value: val.toString() } } as any);
                      }}
                      color="#00FF88"
                      showStatus={false}
                    />
                    
                    <div className="flex justify-between text-xs font-mono mt-3 px-1">
                       <span className="text-white/80 tabular-nums">{Math.floor(progressMs / 60000)}:{(Math.floor((progressMs % 60000) / 1000)).toString().padStart(2, '0')}</span>
                       <span className="text-white/40 tabular-nums">{Math.floor(durationMs / 60000)}:{(Math.floor((durationMs % 60000) / 1000)).toString().padStart(2, '0')}</span>
                    </div>
                 </div>

                  <div className="flex items-center justify-center gap-6 mb-8 w-full">
                    <button onClick={skipPrevious} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all active:scale-95 group">
                       <SkipBack size={20} className="text-neutral-400 group-hover:text-white" />
                    </button>
                    <button onClick={() => localAudioPlayer.src ? toggleLocalPlay() : togglePlay()} className="w-16 h-16 bg-[#00FF88] shadow-[0_15px_40px_rgba(0,255,136,0.3)] text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all group relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                       {(localAudioPlayer.src ? isLocalPlaying : isPlaying) ? <Pause size={24} className="fill-current" /> : <Play size={24} className="ml-1 fill-current" />}
                    </button>
                    <button onClick={skipNext} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all active:scale-95 group">
                       <FastForward size={20} className="text-neutral-400 group-hover:text-white" />
                    </button>
                 </div>

                 <div className="flex flex-col gap-4 w-full px-4">
                    <div className="flex items-center gap-2">
                       <Volume2 size={14} className="text-[#00D1FF]" />
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Volume Control</span>
                    </div>
                    
                    <KineticVolumeBar 
                       value={volume}
                       onChange={(val) => {
                          setVolume(val);
                          localAudioPlayer.volume = val / 100;
                          handleVolumeChange({ target: { value: val.toString() } } as any);
                       }}
                    />
                 </div>
              </div>
           </div>
        )}

        {/* Track Search */}
        {(token || globalLocalAudioTracks.length > 0) && (
           <div className="w-full pb-6">
              <h3 className="font-bold text-xs uppercase tracking-widest opacity-50 mb-3 px-2">Search Songs</h3>
              <div className="relative">
                 <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-500">
                    <Search size={16} />
                 </div>
                 <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for any track..."
                    className={cn("w-full pl-12 pr-4 py-3 rounded-2xl border text-sm transition-colors focus:border-[#1DB954] focus:outline-none", theme === 'dark' ? "bg-[#111] border-white/5 text-white" : "bg-white border-black/5 text-black")}
                 />
                 {isSearching && (
                    <div className="absolute inset-y-0 right-4 flex items-center">
                       <span className="w-4 h-4 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                    </div>
                 )}
              </div>

              {isSearching && searchResults.length === 0 && (
                 <div className="mt-4 space-y-2">
                    {[1, 2, 3, 4].map((i, iIndex) => (
                       <motion.div 
                          key={i} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: iIndex * 0.05 }}
                          className={cn("p-3 rounded-xl border flex items-center justify-between animate-pulse", theme === 'dark' ? "bg-[#111] border-white/5" : "bg-white border-black/5")}
                       >
                          <div className="flex items-center gap-3 w-full">
                             <div className={cn("w-10 h-10 rounded shadow-sm flex-shrink-0", theme === 'dark' ? "bg-white/10" : "bg-black/10")} />
                             <div className="flex flex-col gap-2 w-full pr-4">
                                <div className={cn("h-3 w-24 rounded", theme === 'dark' ? "bg-white/10" : "bg-black/10")} />
                                <div className={cn("h-2 w-32 rounded", theme === 'dark' ? "bg-white/5" : "bg-black/5")} />
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className={cn("w-9 h-9 rounded-full", theme === 'dark' ? "bg-white/10" : "bg-black/10")} />
                          </div>
                       </motion.div>
                    ))}
                 </div>
              )}

              {searchResults.length > 0 && (
                 <div className="mt-4 space-y-2">
                    {searchResults.map((result, mapIndex) => {
                       if (result.type === 'local_audio') {
                          const { track, index } = result.metadata;
                          return (
                             <motion.div 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ duration: 0.2, delay: mapIndex * 0.05 }}
                               key={result.id} 
                               className={cn("p-3 rounded-xl border flex items-center justify-between", theme === 'dark' ? "bg-[#111] border-white/5" : "bg-white border-black/5")}
                             >
                                <div className="flex items-center gap-3 w-full overflow-hidden">
                                   <div className={cn("w-10 h-10 rounded shadow-sm flex-shrink-0 flex items-center justify-center bg-black/20", currentLocalIndex === index && localAudioPlayer.src !== '' ? "text-[#1DB954]" : "text-neutral-500")}>
                                      {currentLocalIndex === index && isLocalPlaying ? (
                                         <div className="flex items-end gap-0.5 h-3">
                                            <div className="w-0.5 bg-[#1DB954] h-2 animate-pulse" />
                                            <div className="w-0.5 bg-[#1DB954] h-3 animate-pulse" style={{ animationDelay: '0.1s' }} />
                                            <div className="w-0.5 bg-[#1DB954] h-1.5 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                         </div>
                                      ) : (
                                         <Music size={16} />
                                      )}
                                   </div>
                                   <div className="flex flex-col truncate w-full pr-2">
                                      <span className={cn("font-bold text-sm truncate", currentLocalIndex === index && localAudioPlayer.src !== '' ? "text-[#1DB954]" : "text-foreground")}>{result.title}</span>
                                      <span className="text-xs opacity-50 truncate">{result.subtitle}</span>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2">
                                   <button 
                                     onClick={() => playLocalTrack(index)}
                                     className="p-2.5 bg-[#1DB954]/10 text-[#1DB954] rounded-full hover:bg-[#1DB954]/20 transition-colors flex-shrink-0"
                                   >
                                      <Play size={14} fill="currentColor" />
                                   </button>
                                </div>
                             </motion.div>
                          );
                       } else if (result.type === 'spotify_track') {
                          const track = result.metadata.track;
                          return (
                             <motion.div 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ duration: 0.2, delay: mapIndex * 0.05 }}
                               key={result.id} 
                               className={cn("p-3 rounded-xl border flex items-center justify-between", theme === 'dark' ? "bg-[#111] border-white/5" : "bg-white border-black/5")}
                             >
                                <div className="flex items-center gap-3 w-full overflow-hidden">
                                   {result.imageUrl ? (
                                      <img src={result.imageUrl} alt={result.title} className="w-10 h-10 rounded shadow-sm flex-shrink-0" />
                                   ) : (
                                      <div className={cn("w-10 h-10 rounded shadow-sm flex-shrink-0 flex items-center justify-center", theme === 'dark' ? "bg-white/10" : "bg-black/10")}>
                                         <Music size={16} className="opacity-50" />
                                      </div>
                                   )}
                                   <div className="flex flex-col truncate w-full pr-2">
                                      <span className="font-bold text-sm truncate">{result.title}</span>
                                      <span className="text-xs opacity-50 truncate">{result.subtitle}</span>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2">
                                   <button 
                                     onClick={() => queueSong(track.uri)}
                                     className="p-2.5 bg-neutral-500/10 text-neutral-500 rounded-full hover:bg-neutral-500/20 transition-colors flex-shrink-0"
                                     title="Add to Queue"
                                   >
                                      <Plus size={14} />
                                   </button>
                                   <button 
                                     onClick={() => playSong(track.uri)}
                                     className="p-2.5 bg-[#1DB954]/10 text-[#1DB954] rounded-full hover:bg-[#1DB954]/20 transition-colors flex-shrink-0"
                                   >
                                      <Play size={14} fill="currentColor" />
                                   </button>
                                </div>
                             </motion.div>
                          );
                       } else if (result.type === 'user') {
                          return (
                             <motion.div 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ duration: 0.2, delay: mapIndex * 0.05 }}
                               key={result.id} 
                               className={cn("p-3 rounded-xl border flex items-center justify-between", theme === 'dark' ? "bg-[#111] border-white/5" : "bg-white border-black/5")}
                             >
                                <div className="flex items-center gap-3 w-full overflow-hidden">
                                   {result.imageUrl ? (
                                      <img src={result.imageUrl} alt={result.title} className="w-10 h-10 rounded-full shadow-sm flex-shrink-0 object-cover" />
                                   ) : (
                                      <div className={cn("w-10 h-10 rounded-full shadow-sm flex-shrink-0 flex items-center justify-center", theme === 'dark' ? "bg-white/10" : "bg-black/10")}>
                                         <span className="font-bold text-sm uppercase">{result.title.charAt(0)}</span>
                                      </div>
                                   )}
                                   <div className="flex flex-col truncate w-full pr-2">
                                      <span className="font-bold text-sm truncate">{result.title}</span>
                                      <span className="text-xs opacity-50 truncate">{result.subtitle}</span>
                                   </div>
                                </div>
                             </motion.div>
                          );
                       }
                       return null;
                    })}
                 </div>
              )}
           </div>
        )}

        {/* Local Audio Playlist Section */}
        <div className={cn("glass-card border rounded-3xl p-6 pb-8", theme === 'dark' ? "border-white/5 bg-[#111]" : "border-black/5 bg-white")}>
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm tracking-wide">Local Library</h3>
              <div className="flex items-center gap-2 relative">
                 <button 
                    onClick={() => setShowLocalOptions(!showLocalOptions)} 
                    className="p-2 bg-neutral-500/10 hover:bg-neutral-500/20 rounded-full transition-colors"
                 >
                    <MoreVertical size={16} />
                 </button>
                 {showLocalOptions && (
                    <>
                       <div className="fixed inset-0 z-40" onClick={() => setShowLocalOptions(false)} />
                       <div className={cn("absolute right-0 top-10 mt-2 w-48 rounded-xl border shadow-xl z-50 overflow-hidden text-sm flex flex-col", theme === 'dark' ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10")}>
                          <button onClick={() => { setShowLocalOptions(false); fileInputRef.current?.click(); }} className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-white/10 transition-colors">
                             <Plus size={16} /> Add Files
                          </button>
                          {localTracks.length > 0 && (
                             <button onClick={() => { setShowLocalOptions(false); clearLocalTracks(); }} className={cn("w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-rose-500/10 text-rose-500 transition-colors border-t", theme === 'dark' ? "border-white/5" : "border-black/5")}>
                                <Trash2 size={16} /> Clear All
                             </button>
                          )}
                       </div>
                    </>
                 )}
              </div>
           </div>
           
           <input 
              type="file" 
              accept="audio/*" 
              multiple 
              onChange={handleLocalFiles} 
              className="hidden" 
              ref={fileInputRef} 
           />

           {localTracks.length === 0 ? (
              <div className={cn("rounded-2xl border p-8 flex flex-col items-center justify-center text-center mt-2", theme === 'dark' ? "bg-black/20 border-white/5" : "bg-black/5 border-black/5")}>
                 <div className="w-12 h-12 rounded-full bg-[#1DB954]/10 flex items-center justify-center mb-3">
                    <Music size={20} className="text-[#1DB954]" />
                 </div>
                 <p className="text-sm font-bold mb-1">No Local Tracks</p>
                 <p className="text-xs opacity-60">Add some MP3 files to play them here.</p>
              </div>
           ) : (
              <div className="max-h-64 overflow-y-auto no-scrollbar pr-1 mt-2 space-y-1">
                 {localTracks.map((track, i) => (
                    <div 
                       key={track.id} 
                       className={cn("p-2 rounded-xl flex items-center justify-between transition-colors group", currentLocalIndex === i && localAudioPlayer.src !== '' ? (theme === 'dark' ? "bg-white/10" : "bg-black/5") : (theme === 'dark' ? "hover:bg-white/5" : "hover:bg-black/5"))}
                    >
                       <div className="flex items-center gap-3 w-full overflow-hidden cursor-pointer flex-1" onClick={() => playLocalTrack(i)}>
                          <div className={cn("w-10 h-10 rounded shadow-sm flex-shrink-0 flex items-center justify-center bg-black/20", currentLocalIndex === i && localAudioPlayer.src !== '' ? "text-[#1DB954]" : "text-neutral-500")}>
                             {currentLocalIndex === i && isLocalPlaying ? (
                                <div className="flex items-end gap-0.5 h-3">
                                   <div className="w-0.5 bg-[#1DB954] h-2 animate-pulse" />
                                   <div className="w-0.5 bg-[#1DB954] h-3 animate-pulse" style={{ animationDelay: '0.1s' }} />
                                   <div className="w-0.5 bg-[#1DB954] h-1.5 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                </div>
                             ) : (
                                <Music size={16} />
                             )}
                          </div>
                          <div className="flex flex-col truncate w-full pr-2">
                             <span className={cn("font-bold text-sm truncate", currentLocalIndex === i && localAudioPlayer.src !== '' ? "text-[#1DB954]" : "text-foreground")}>{track.name}</span>
                             <span className="text-xs opacity-50 truncate">Local Audio</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>

        {/* Soundtrack Preferences */}
        <div className="w-full pt-4 border-t border-white/5">
           <div className="flex items-center justify-between mb-4 px-2">
              <div>
                 <h3 className="font-bold text-sm tracking-wide">Automatic Soundtrack</h3>
                 <p className="text-xs opacity-60">Auto-play high energy playlists when starting a workout</p>
              </div>
              <button 
                 onClick={() => setAutoSoundtrack(!autoSountrack)}
                 className={`w-12 h-6 rounded-full relative transition-colors ${autoSountrack ? 'bg-[#1DB954]' : 'bg-neutral-700'}`}
              >
                 <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${autoSountrack ? 'right-0.5' : 'left-0.5'}`} />
              </button>
           </div>
        </div>

        {/* Devices List */}
        {token && devices.length > 0 && (
           <div className="w-full">
              <h3 className="font-bold text-xs uppercase tracking-widest opacity-50 mb-3 px-2">Playback Devices</h3>
              <div className="space-y-2">
                 {devices.map(device => (
                    <button 
                       key={device.id}
                       onClick={() => transferPlayback(device.id)}
                       className={cn("w-full p-4 rounded-2xl flex items-center justify-between border transition-colors", 
                          device.is_active || activeDevice === device.id
                             ? "bg-[#1DB954]/10 border-[#1DB954]/30 text-[#1DB954]" 
                             : theme === 'dark' ? "bg-[#111] border-white/5 hover:bg-white/5" : "bg-neutral-50 border-black/5 hover:bg-black/5"
                       )}
                    >
                       <div className="flex items-center gap-3">
                          {device.type === 'Computer' ? <Laptop size={18} /> : device.type === 'Smartphone' ? <Smartphone size={18} /> : <Speaker size={18} />}
                          <span className="font-bold text-sm text-foreground">{device.name} {device.name === 'AI Studio Health App' && '(This App)'}</span>
                       </div>
                       {(device.is_active || activeDevice === device.id) && (
                          <div className="flex items-center gap-2">
                             <div className="flex gap-0.5">
                                <span className="w-1 h-3 bg-[#1DB954] rounded-full animate-pulse" />
                                <span className="w-1 h-2 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: '0.1s'}} />
                                <span className="w-1 h-4 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: '0.2s'}} />
                             </div>
                          </div>
                       )}
                    </button>
                 ))}
              </div>
           </div>
        )}



        {/* User Playlists */}
        {token && userPlaylists.length > 0 && (
           <div className="w-full pb-8">
              <h3 className="font-bold text-xs uppercase tracking-widest opacity-50 mb-3 px-2">Your Playlists</h3>
              <div className="grid grid-cols-1 gap-3">
                 {userPlaylists.map(pl => {
                    const isTarget = targetPlaylistUri === pl.uri;
                    const isExpanded = expandedPlaylist === pl.id;
                    return (
                    <div key={pl.id} className={cn("rounded-2xl border transition-colors overflow-hidden", theme === 'dark' ? (isTarget ? "bg-[#1DB954]/10 border-[#1DB954]/50" : "bg-[#111] border-white/5 hover:border-white/20") : (isTarget ? "bg-[#1DB954]/10 border-[#1DB954]/50" : "bg-white border-black/5 hover:border-black/20"))}>
                       <div className="p-4 flex items-center justify-between cursor-pointer"
                         onClick={() => {
                            if (isExpanded) {
                               setExpandedPlaylist(null);
                            } else {
                               setExpandedPlaylist(pl.id);
                               fetchPlaylistTracks(pl.id);
                            }
                            setTargetPlaylistUri(pl.uri);
                            localStorage.setItem('target_workout_playlist', pl.uri);
                         }}>
                         <div className="flex items-center gap-4">
                            {pl.images?.[0]?.url && (
                               <img src={pl.images[0].url} alt={pl.name} className="w-12 h-12 rounded-lg object-cover" />
                            )}
                            <div className="flex flex-col">
                               <div className="flex items-center gap-2">
                                  <span className={cn("font-bold text-sm truncate max-w-[140px]", isTarget && "text-[#1DB954]")}>{pl.name}</span>
                                  {isTarget && <span className="text-[9px] font-bold uppercase bg-[#1DB954] text-black px-1.5 py-0.5 rounded tracking-wider">Target</span>}
                               </div>
                               <span className="text-xs opacity-50">{pl.tracks?.total || 0} tracks</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                 e.stopPropagation();
                                 fetch(`https://api.spotify.com/v1/me/player/play`, {
                                    method: 'PUT',
                                    headers: { 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({ context_uri: pl.uri })
                                 }).then(() => setTimeout(() => fetchCurrentTrack(token), 1000));
                              }}
                              className={cn("p-3 rounded-full transition-colors flex-shrink-0", isTarget ? "bg-[#1DB954] text-black" : "bg-[#1DB954]/10 text-[#1DB954] hover:bg-[#1DB954]/20")}
                              title="Play Now"
                            >
                               <Play size={16} fill="currentColor" />
                            </button>
                         </div>
                       </div>
                       
                       {isExpanded && (
                          <div className={cn("px-4 pb-4 max-h-[300px] overflow-y-auto w-full no-scrollbar", theme === 'dark' ? "bg-black/20" : "bg-black/5")}>
                             {isLoadingTracks ? (
                                <div className="py-4 text-center text-xs opacity-50 flex items-center justify-center">
                                   <span className="w-4 h-4 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin mr-2" />
                                   Loading tracks...
                                </div>
                             ) : (
                                <div className="space-y-1 mt-2">
                                   {playlistTracks.map((item, idx) => {
                                      if (!item.track) return null;
                                      return (
                                         <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer" onClick={() => playSong(item.track.uri)}>
                                            <div className="flex flex-col truncate pr-2">
                                               <span className="text-sm font-medium truncate">{item.track.name}</span>
                                               <span className="text-xs opacity-50 truncate">{item.track.artists.map((a:any)=>a.name).join(', ')}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                               <button onClick={(e) => { e.stopPropagation(); queueSong(item.track.uri); }} className="text-neutral-500 hover:text-white transition-colors p-1" title="Add to Queue">
                                                  <Plus size={12} />
                                               </button>
                                               <button className="text-neutral-500 hover:text-[#1DB954] transition-colors p-1">
                                                  <Play size={12} fill="currentColor" />
                                               </button>
                                            </div>
                                         </div>
                                      )
                                   })}
                                </div>
                             )}
                          </div>
                       )}
                    </div>
                 )})}
              </div>
           </div>
        )}

        {/* Liked Songs */}
        {token && savedTracks.length > 0 && (
           <div className="w-full pb-8">
              <h3 className="font-bold text-xs uppercase tracking-widest opacity-50 mb-3 px-2">Your Liked Songs</h3>
              <div className="grid grid-cols-1 gap-2 border rounded-2xl p-4 overflow-hidden" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                 {savedTracks.map((item, idx) => {
                    const track = item.track;
                    if (!track) return null;
                    return (
                       <div key={idx} className={cn("p-2 rounded-xl flex items-center justify-between transition-colors", theme === 'dark' ? "hover:bg-white/5" : "hover:bg-black/5")}>
                          <div className="flex items-center gap-3 w-full overflow-hidden">
                             {track.album?.images?.[0]?.url && (
                                <img src={track.album.images[0].url} alt={track.name} className="w-10 h-10 rounded shadow-sm flex-shrink-0" />
                             )}
                             <div className="flex flex-col truncate w-full pr-2">
                                <span className="font-bold text-sm truncate">{track.name}</span>
                                <span className="text-xs opacity-50 truncate">{track.artists.map((a: any) => a.name).join(', ')}</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => queueSong(track.uri)}
                               className="p-2.5 bg-neutral-500/10 text-neutral-500 rounded-full hover:bg-neutral-500/20 transition-colors flex-shrink-0"
                               title="Add to Queue"
                             >
                                <Plus size={14} />
                             </button>
                             <button 
                               onClick={() => playSong(track.uri)}
                               className="p-2.5 bg-[#1DB954]/10 text-[#1DB954] rounded-full hover:bg-[#1DB954]/20 transition-colors flex-shrink-0"
                             >
                                <Play size={14} fill="currentColor" />
                             </button>
                          </div>
                       </div>
                    )
                 })}
              </div>
           </div>
        )}

        {/* Recent Playlists */}
        {token && (
           <div className="w-full pb-8">
              <h3 className="font-bold text-xs uppercase tracking-widest opacity-50 mb-3 px-2">High Energy Playlists</h3>
              <div className="grid grid-cols-1 gap-3">
                 {recentPlaylists.map(pl => (
                    <div key={pl.id} className={cn("p-4 rounded-2xl border flex items-center justify-between", theme === 'dark' ? "bg-[#111] border-white/5" : "bg-white border-black/5")}>
                       <div className="flex flex-col">
                          <span className="font-bold text-sm">{pl.name}</span>
                          <span className="text-xs opacity-50">{pl.type} • {pl.tracks} tracks</span>
                       </div>
                       <button 
                         onClick={() => {
                            fetch(`https://api.spotify.com/v1/me/player/play`, {
                               method: 'PUT',
                               headers: { 'Authorization': `Bearer ${token}` },
                               body: JSON.stringify({ context_uri: `spotify:playlist:${pl.id}` })
                            }).then(() => setTimeout(() => fetchCurrentTrack(token), 1000));
                         }}
                         className="p-2 bg-[#1DB954]/10 text-[#1DB954] rounded-full hover:bg-[#1DB954]/20 transition-colors"
                       >
                          <Play size={16} fill="currentColor" />
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        )}

      </div>
    </motion.div>
  );
}
