import React, { useState, useEffect } from 'react';
import { useAppContext, useAppLogs } from '../context/AppContext';
import { User, Settings, BarChart3, Settings2, Target, MapPin, ChevronRight, ChevronLeft, X, LogOut, Camera, Save, Download, Flame, FileText, Database, Image as ImageIcon, Sun, Moon, Music, Bell, FlaskConical, Bot } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../components/BottomNav';
import EditProfile from '../components/EditProfile';
import BodyStats from '../components/BodyStats';
import SettingsMenu from '../components/SettingsMenu';
import GoalsMenu from '../components/GoalsMenu';
import PreferencesMenu from '../components/PreferencesMenu';
import ProgressGallery from '../components/ProgressGallery';
import MusicMenu from '../components/MusicMenu';
import SpotifyAuthBridge from '../components/SpotifyAuthBridge';
import Notifications from '../components/Notifications';
import { generateWeeklyReportPDF } from '../utils/pdfGenerator';
import { generateWorkoutCSV, generateDietCSV } from '../utils/csvGenerator';
import { getDynamicStrengthScore, getRank } from '../utils/community';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import CustomFoodsMenu from '../components/CustomFoodsMenu';
import SupplementMenu from '../components/SupplementMenu';

type SubView = 'main' | 'profile' | 'settings' | 'stats' | 'preferences' | 'goals' | 'gyms' | 'progress' | 'music' | 'customFoods' | 'notifications' | 'supplements';

export default function MoreMenu({ navigate, openAIChat }: { navigate?: (tab: string) => void, openAIChat?: () => void }) {
  const { user, updateUser, setOnboardingCompleted, workoutHistory, theme, setTheme } = useAppContext();
  const { meals } = useAppLogs();
  const [activeView, setActiveView] = useState<SubView>('main');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (auth.currentUser) {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', auth.currentUser.uid),
        where('isRead', '==', false)
      );
      unsubscribe = onSnapshot(q, (snap) => {
        setUnreadCount(snap.size);
      }, (err) => {
        console.error("Unread count listener error:", err);
      });
    }
    
    return () => unsubscribe?.();
  }, [auth.currentUser]);

  const strengthScore = getDynamicStrengthScore(user?.lifts, workoutHistory);
  const currentRank = getRank(strengthScore);

  const handleDownloadReport = () => {
    generateWeeklyReportPDF(user, workoutHistory);
  };

  const handleDownloadWorkoutCSV = () => {
    generateWorkoutCSV(workoutHistory);
  };

  const handleDownloadDietCSV = () => {
    generateDietCSV(meals);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setOnboardingCompleted(false);
      // Optional: clear any cached user data
      localStorage.removeItem('user_data_cache');
      localStorage.removeItem('user_logs_cache');
    } catch (e) {
      console.error('Error signing out', e);
    }
  };

  const menuItems = [
    { id: 'profile', icon: User, label: 'Profile', sub: 'View & edit your information', color: 'bg-primary/10 text-primary' },
    { id: 'notifications', icon: Bell, label: 'Notifications', sub: 'Alerts & community updates', color: 'bg-orange-500/10 text-orange-500', badge: unreadCount },
    { id: 'progress', icon: ImageIcon, label: 'Progress', sub: 'Track physical changes', color: 'bg-purple-500/10 text-purple-500' },
    { id: 'customFoods', icon: Database, label: 'Custom Foods', sub: 'Your personal food library', color: 'bg-rose-500/10 text-rose-500' },
    { id: 'supplements', icon: FlaskConical, label: 'Supplement Stack', sub: 'Manage your bio-protocols', color: 'bg-primary/10 text-primary' },
    { id: 'music', icon: Music, label: 'Music & Audio', sub: 'Workout soundtracks', color: 'bg-[#1DB954]/10 text-[#1DB954]' },
    { id: 'settings', icon: Settings, label: 'Settings', sub: 'App settings & preferences', color: 'bg-emerald-500/10 text-emerald-500' },
    { id: 'stats', icon: BarChart3, label: 'Body Stats', sub: 'View your measurements', color: 'bg-blue-500/10 text-blue-500' },
    { id: 'preferences', icon: Settings2, label: 'Preferences', sub: 'Customize your experience', color: 'bg-lime-500/10 text-lime-500' },
    { id: 'goals', icon: Target, label: 'Goals', sub: 'Manage your fitness goals', color: 'bg-yellow-500/10 text-yellow-500' },
    { id: 'aiChat', icon: Bot, label: 'Neural Advisor', sub: 'Expert fitness & anatomy AI', color: 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.2)]' },
    { id: 'gyms', icon: MapPin, label: 'Nearby Gyms', sub: 'Find gyms near you', color: 'bg-neutral-500/10 text-neutral-500' },
  ];

  return (
    <div className="flex flex-col flex-1 pt-safe relative w-full bg-background text-foreground">
      <AnimatePresence mode="wait">
        {activeView === 'main' ? (
          <motion.div 
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col flex-1 min-h-0 space-y-8 px-6 pb-24 pt-8"
          >
            {/* Profile Header */}
            <div className="flex flex-col items-center justify-center">
              <button onClick={() => setActiveView('profile')} className="relative group cursor-pointer focus:outline-none">
                <div className="w-24 h-24 rounded-full bg-surface-elevated border-4 border-primary/20 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 shadow-xl">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-primary">{user?.name ? user.name.charAt(0) : 'U'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary text-black p-1.5 rounded-full border-4 border-background shadow-lg">
                  <Camera size={14} strokeWidth={3} />
                </div>
              </button>
              <h2 className="text-3xl font-black tracking-tighter mt-4 uppercase italic">{user?.name || 'Anonymous User'}</h2>
              <span className="text-xs text-muted font-bold uppercase tracking-[0.2em] mt-1 mb-3 opacity-60 font-mono">{user?.email || ''}</span>
              <div className="flex bg-surface-elevated/80 backdrop-blur-md rounded-full pl-1 pr-4 py-1.5 border border-card-border items-center gap-3 shadow-xl">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 flex items-center justify-center shadow-lg">
                    <Flame size={16} className="text-black" />
                 </div>
                 <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 leading-none">{currentRank.name}</span>
                    <span className="text-[9px] text-muted font-bold uppercase leading-none mt-1 tracking-tight">{strengthScore}{user?.weightUnit || 'kg'} Strength Score</span>
                 </div>
              </div>

              {/* Theme Toggle */}
              <div className="mt-8 flex p-1.5 rounded-3xl items-center gap-1 bg-surface-elevated/50 border border-card-border shadow-inner">
                <button 
                  onClick={() => setTheme('light')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                    theme === 'light' ? "bg-background text-foreground shadow-lg border border-card-border" : "text-muted hover:text-foreground"
                  )}
                >
                  <Sun size={14} strokeWidth={3} />
                  Light
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                    theme === 'dark' ? "bg-primary text-black shadow-lg shadow-primary/20 border border-primary/20" : "text-muted hover:text-foreground"
                  )}
                >
                  <Moon size={14} strokeWidth={3} />
                  Dark
                </button>
              </div>
            </div>

            {/* Menu List */}
            <div className="space-y-4">
               {menuItems.map(item => (
                 <button 
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'aiChat' && openAIChat) {
                      openAIChat();
                    } else {
                      setActiveView(item.id as SubView);
                    }
                  }}
                   className="w-full bg-surface-elevated/50 backdrop-blur-md p-5 rounded-[2.2rem] border border-card-border flex items-center group active:scale-[0.98] transition-all hover:bg-surface-elevated hover:border-primary/20 shadow-lg"
                 >
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mr-5 transition-colors shadow-sm", item.color)}>
                      <item.icon size={24} strokeWidth={3} />
                    </div>
                    <div className="flex-1 text-left relative">
                       <h3 className="font-black tracking-tight text-lg leading-none mb-1.5 flex items-center gap-2">
                         <span className="uppercase italic">{item.label}</span>
                         {item.badge && item.badge > 0 && (
                            <span className="bg-primary text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse shrink-0">
                              {item.badge}
                            </span>
                         )}
                       </h3>
                       <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-40">{item.sub}</p>
                    </div>
                    <ChevronRight size={20} strokeWidth={3} className="text-muted group-hover:text-primary transition-all group-hover:translate-x-1" />
                 </button>
               ))}
            </div>

            <div className="pt-4">
               <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-muted mb-4 px-2 opacity-50">Data Forge Export</h3>
               <div className="space-y-3">
                 <button 
                   onClick={handleDownloadReport}
                   className="w-full py-5 rounded-[2rem] bg-primary/10 border border-primary/20 text-primary font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center transition-all hover:bg-primary/20 active:scale-95 shadow-lg shadow-primary/5 italic"
                 >
                   <FileText size={18} className="mr-3" strokeWidth={3} />
                   Generate Weekly Intel
                 </button>
                 <div className="flex gap-3">
                   <button 
                     onClick={handleDownloadWorkoutCSV}
                     className="flex-1 py-5 rounded-[2rem] bg-surface-elevated border border-card-border text-[9px] font-black uppercase tracking-[0.15em] flex items-center justify-center transition-all hover:bg-surface-elevated/80 text-muted active:scale-95 shadow-md italic whitespace-nowrap"
                   >
                     <Database size={16} className="mr-2" strokeWidth={3} />
                     Workout Stream
                   </button>
                   <button 
                     onClick={handleDownloadDietCSV}
                     className="flex-1 py-5 rounded-[2rem] bg-surface-elevated border border-card-border text-[9px] font-black uppercase tracking-[0.15em] flex items-center justify-center transition-all hover:bg-surface-elevated/80 text-muted active:scale-95 shadow-md italic whitespace-nowrap"
                   >
                     <Database size={16} className="mr-2" strokeWidth={3} />
                     Dietary Stream
                   </button>
                 </div>
               </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full py-5 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 text-rose-500 font-black uppercase tracking-widest text-xs flex items-center justify-center hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </motion.div>
        ) : activeView === 'profile' ? (
          <EditProfile key="profile" onClose={() => setActiveView('main')} />
        ) : activeView === 'progress' ? (
          <ProgressGallery key="progress" onClose={() => setActiveView('main')} />
        ) : activeView === 'music' ? (
          <MusicMenu key="music" onClose={() => setActiveView('main')} />
        ) : activeView === 'notifications' ? (
          <Notifications key="notifications" onClose={() => setActiveView('main')} onNavigateToQuestion={(id) => navigate?.('community')} />
        ) : activeView === 'customFoods' ? (
          <CustomFoodsMenu key="customFoods" onClose={() => setActiveView('main')} />
        ) : activeView === 'supplements' ? (
          <SupplementMenu key="supplements" onClose={() => setActiveView('main')} />
        ) : activeView === 'stats' ? (
          <BodyStats key="stats" onClose={() => setActiveView('main')} />
        ) : activeView === 'goals' ? (
          <GoalsMenu key="goals" onClose={() => setActiveView('main')} />
        ) : activeView === 'settings' ? (
          <SettingsMenu key="settings" onClose={() => setActiveView('main')} />
        ) : activeView === 'preferences' ? (
          <PreferencesMenu key="preferences" onClose={() => setActiveView('main')} />
        ) : activeView === 'gyms' ? (
          <motion.div 
            key="gyms"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col bg-background z-50 pb-32 border-x border-card-border relative"
          >
            <header className="sticky top-0 z-50 px-8 py-10 border-b border-card-border flex items-center gap-6 backdrop-blur-3xl bg-background/60 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
              <button 
                onClick={() => setActiveView('main')} 
                className="p-3 bg-surface-elevated border border-card-border rounded-2xl hover:scale-110 hover:rotate-[-5deg] transition-all shadow-xl shadow-black/20 group"
              >
                <ChevronLeft size={24} strokeWidth={3} className="text-muted group-hover:text-foreground" />
              </button>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Nearby Gyms</h2>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-40 mt-2">Geospatial Recond</span>
              </div>
            </header>

            <div className="flex flex-col items-center justify-center p-12 text-center pt-20">
              <div className="w-24 h-24 rounded-[2.5rem] bg-surface-elevated border border-card-border flex items-center justify-center text-muted mb-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <MapPin size={48} strokeWidth={3} className="relative z-10" />
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter mb-1 uppercase">Strategic Zones</h2>
              <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4">Available soon</p>
              <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em] mb-10 leading-loose max-w-[280px] opacity-40">
                Locating the nearest combat centers for your next training cycle.
              </p>
              
              <div className="w-full max-w-xs p-8 rounded-[3rem] bg-surface-elevated border border-card-border shadow-2xl flex flex-col items-center gap-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl" />
                 <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Database size={24} className="text-primary animate-pulse" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted">Retrieving Node Data...</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
