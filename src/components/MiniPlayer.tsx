import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, Music } from 'lucide-react';
import FireProgressBar from './FireProgressBar';
import { cn } from './BottomNav';
import { localAudioPlayer, globalLocalAudioTracks, globalLocalAudioIndex, skipNextLocalTrack } from '../utils/audio';

interface Props {
  onSwipe?: (direction: 'left' | 'right') => void;
}

export default function MiniPlayer({ onSwipe }: Props) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('spotify_token'));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{name: string, artist: string, albumArt?: string} | null>(null);
  const [isLocal, setIsLocal] = useState(!localAudioPlayer.paused && localAudioPlayer.src !== '');

  useEffect(() => {
    const tokenInterval = setInterval(() => {
      const currentToken = localStorage.getItem('spotify_token');
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 2000);
    return () => clearInterval(tokenInterval);
  }, [token]);

  useEffect(() => {
    // Local Audio listeners
    const updateLocalState = () => {
      if (localAudioPlayer.src) {
        setIsLocal(true);
        setIsPlaying(!localAudioPlayer.paused);
        setCurrentTrack({
          name: globalLocalAudioTracks[globalLocalAudioIndex]?.name || 'Local Audio',
          artist: 'Local File'
        });
      }
    };

    const handlePlay = () => {
      setIsLocal(true);
      setIsPlaying(true);
      updateLocalState();
    };

    const handlePause = () => {
      if (isLocal) setIsPlaying(false);
    };

    // Initial check
    updateLocalState();

    localAudioPlayer.addEventListener('play', handlePlay);
    localAudioPlayer.addEventListener('pause', handlePause);
    localAudioPlayer.addEventListener('ended', updateLocalState);
    window.addEventListener('local_tracks_updated', updateLocalState);

    return () => {
      localAudioPlayer.removeEventListener('play', handlePlay);
      localAudioPlayer.removeEventListener('pause', handlePause);
      localAudioPlayer.removeEventListener('ended', updateLocalState);
      window.removeEventListener('local_tracks_updated', updateLocalState);
    };
  }, [isLocal]);

  useEffect(() => {
    if (!token || isLocal) {
      if (!isLocal) setCurrentTrack(null);
      return;
    }

    let isMounted = true;
    
    const fetchCurrentTrack = async () => {
      try {
        const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!isMounted) return;

        if (res.ok && res.status === 200) {
          const data = await res.json();
          if (data && data.item) {
            setIsLocal(false);
            setCurrentTrack({
              name: data.item.name,
              artist: data.item.artists.map((a: any) => a.name).join(', '),
              albumArt: data.item.album?.images[0]?.url
            });
            setIsPlaying(data.is_playing);
          }
        }
      } catch(err) {
        console.warn('Failed to fetch mini player track status');
      }
    };

    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, isLocal]);

  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocal) {
       if (localAudioPlayer.paused) {
          localAudioPlayer.play().catch(console.warn);
       } else {
          localAudioPlayer.pause();
       }
       return;
    }

    if (!token) return;
    const endpoint = isPlaying ? 'pause' : 'play';
    setIsPlaying(!isPlaying);
    try {
      await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {}
  };
  
  const skipNext = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocal) {
       skipNextLocalTrack();
       return;
    }
    if (!token) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/next`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Trigger immediate and delayed fetches to ensure UI updates after Spotify's async skip
      const fetchCurrentTrack = async () => {
        try {
          const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok && res.status === 200) {
            const data = await res.json();
            if (data && data.item) {
              setIsLocal(false);
              setCurrentTrack({
                name: data.item.name,
                artist: data.item.artists.map((a: any) => a.name).join(', '),
                albumArt: data.item.album?.images[0]?.url
              });
              setIsPlaying(data.is_playing);
            }
          }
        } catch(err) {}
      };
      
      setTimeout(fetchCurrentTrack, 500);
      setTimeout(fetchCurrentTrack, 1500);
      setTimeout(fetchCurrentTrack, 3000);
    } catch (err) {}
  };

  const handleDragEnd = (e: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      onSwipe?.('left');
    } else if (info.offset.x > swipeThreshold) {
      onSwipe?.('right');
    }
  };

  const [progressMs, setProgressMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      setProgressMs(localAudioPlayer.currentTime * 1000);
      setDurationMs(localAudioPlayer.duration * 1000 || 0);
    };

    localAudioPlayer.addEventListener('timeupdate', updateProgress);
    localAudioPlayer.addEventListener('loadedmetadata', updateProgress);
    
    return () => {
      localAudioPlayer.removeEventListener('timeupdate', updateProgress);
      localAudioPlayer.removeEventListener('loadedmetadata', updateProgress);
    };
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // If we shouldn't render anything, we just render an empty area so swipe still works? No, BottomNav would be visible if not MiniPlayer.
  // Actually, the swipe will switch between BottomNav and MiniPlayer, so if MiniPlayer has no track, we show "No track playing".
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="w-full h-full bg-background/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex items-center px-6 cursor-grab active:cursor-grabbing overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative"
    >
      {/* Progress Bar Layer (Bottom Edge) */}
      <div className="absolute bottom-0 left-4 right-4 h-1 overflow-visible">
        <FireProgressBar 
          progress={progressMs / (durationMs || 1)}
          color="#00FF88"
          showStatus={false}
          height={4}
        />
      </div>

      {/* Animated Gradient Border Overlay */}
      <div className="absolute inset-0 rounded-[2rem] p-[1px] -z-20 pointer-events-none overflow-hidden">
         <motion.div 
            animate={isPlaying ? { 
              rotate: [0, 360],
            } : { rotate: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0%,#3b82f6_25%,#8b5cf6_50%,#ec4899_75%,transparent_100%)] opacity-30"
         />
      </div>

      {/* Dynamic Background Layer for Mix-Blend Effect */}
      <div className="absolute inset-0 -z-10 bg-surface-elevated/40 overflow-hidden">
         <motion.div 
            animate={{ 
              x: isPlaying ? [-50, 50, -50] : 0,
              y: isPlaying ? [-20, 20, -20] : 0,
              scale: isPlaying ? [1, 1.3, 1] : 1,
              opacity: isPlaying ? 0.6 : 0.1
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className={cn(
              "absolute inset-0 blur-[80px] transition-colors duration-1000",
              isPlaying ? "bg-gradient-to-tr from-blue-600/50 via-indigo-600/50 to-pink-600/50" : "bg-white/5"
            )}
         />
      </div>

      {!currentTrack ? (
         <div className="flex-1 flex items-center justify-center text-muted text-[10px] font-black uppercase tracking-[0.3em] mix-blend-overlay">
            CONNECT AUDIO SOURCE
         </div>
      ) : (
         <div className="flex items-center w-full relative">
            {/* Left: Track Info */}
            <div className="flex items-center gap-3 w-1/3 min-w-0">
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="relative shrink-0"
               >
                 {currentTrack.albumArt ? (
                   <img src={currentTrack.albumArt} alt="Album Art" className="w-10 h-10 rounded-lg object-cover bg-surface-elevated border border-white/10 pointer-events-none shadow-lg shadow-black/60 relative z-10" />
                 ) : (
                   <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-white/10 flex items-center justify-center pointer-events-none shadow-lg shadow-black/60 relative z-10">
                     <Music size={20} className="text-primary" />
                   </div>
                 )}
               </motion.div>
               
               <div className="flex-1 min-w-0 pointer-events-none">
                  <p className="text-xs font-black text-white truncate leading-tight uppercase tracking-tighter italic drop-shadow-md">{currentTrack.name}</p>
                  <p className="text-[9px] text-white/50 font-black uppercase tracking-[0.1em] truncate leading-tight mt-0.5">{currentTrack.artist}</p>
               </div>
            </div>
            
            {/* Center: Controls */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
               <button 
                 onClick={togglePlay} 
                 className={cn(
                   "w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-lg group/btn relative overflow-hidden",
                   isPlaying ? "bg-white text-black" : "bg-[#00FF88] text-black"
                 )}
               >
                 <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                 {isPlaying ? <Pause size={20} className="relative z-10 fill-current" /> : <Play size={20} className="relative z-10 fill-current translate-x-0.5" />}
               </button>
               <button 
                 onClick={skipNext} 
                 className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 text-white transition-all active:scale-90 shadow-lg"
               >
                 <SkipForward size={20} className="fill-white/80" />
               </button>
            </div>

            {/* Right: Timestamps */}
            <div className="w-1/3 flex justify-end items-center gap-1.5 tabular-nums">
               <span className="text-[10px] font-mono text-[#00FF88] font-bold drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]">
                  {formatTime(progressMs)}
               </span>
               <span className="text-[10px] font-mono text-white/20">/</span>
               <span className="text-[10px] font-mono text-white/40">
                  {formatTime(durationMs)}
               </span>
            </div>
         </div>
      )}
    </motion.div>
  );
}
