/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, Suspense, lazy, useRef } from 'react';
import { AnimatePresence, motion, PanInfo } from 'motion/react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Bot, RefreshCw } from 'lucide-react';
import { cn } from './components/BottomNav';
import { AITrainerChat } from './components/AITrainerChat';

import Auth from './screens/Auth';
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import Workouts from './screens/Workouts';
import Diet from './screens/Diet';
import Insights from './screens/Insights';
import Community from './screens/Community';
import MoreMenu from './screens/MoreMenu';

import BottomNav from './components/BottomNav';
import RewardPopup from './components/RewardPopup';
import SyncStatus from './components/SyncStatus';
import BadgeManager from './components/BadgeManager';
import BadgeCelebration from './components/BadgeCelebration';
import RankUpAnimation from './components/RankUpAnimation';
import Toast from './components/Toast';
import PermissionRequestFlow from './components/PermissionRequestFlow';
import ErrorBoundary from './components/ErrorBoundary';
import MiniPlayer from './components/MiniPlayer';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

import BiometricLock from './components/BiometricLock';
import { checkAndScheduleWorkoutReminder } from './utils/notifications';
import { handleFirestoreError, OperationType } from './utils/firebaseErrors';

function MainApp() {
  const { user, onboardingCompleted, setOnboardingCompleted, updateUser, setServerState, setIsDataLoading, isDataLoading, workoutHistory } = useAppContext();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [direction, setDirection] = useState(0);
  const tabs = ['dashboard', 'workouts', 'diet', 'community', 'more'];

  const switchTab = (newTab: string) => {
    const prevIndex = tabs.indexOf(currentTab);
    const newIndex = tabs.indexOf(newTab);
    if (prevIndex === newIndex) return;
    setDirection(newIndex > prevIndex ? 1 : -1);
    setCurrentTab(newTab);
  };

  const handleDragEnd = (e: any, info: PanInfo) => {
    const target = e.target as HTMLElement;
    if (target && typeof target.closest === 'function' && (target.closest('[data-no-swipe="true"]') || target.closest('canvas') || target.closest('.no-swipe'))) {
      return;
    }
    const threshold = 50;
    const velocityThreshold = 500;
    
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      // Swipe Right -> Previous Tab
      const idx = tabs.indexOf(currentTab);
      if (idx > 0) switchTab(tabs[idx - 1]);
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      // Swipe Left -> Next Tab
      const idx = tabs.indexOf(currentTab);
      if (idx < tabs.length - 1) switchTab(tabs[idx + 1]);
    }
  };

  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [barDirection, setBarDirection] = useState<'up' | 'left' | 'right'>('up');
  const [showAITrainer, setShowAITrainer] = useState(false);

  const triggerMiniPlayer = (dir: 'up' | 'left' | 'right' = 'up') => {
    setBarDirection(dir);
    setShowMiniPlayer(true);
  };

  const dismissMiniPlayer = (dir: 'down' | 'left' | 'right' = 'down') => {
    // For dismissal, we'll just set it to 'up' or similar for now or map it
    setBarDirection(dir === 'down' ? 'up' : dir); 
    setShowMiniPlayer(false);
  };
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [userAuth, setUserAuth] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Handle Spotify Auth Callback
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('access_token');
        if (token) {
          // If in a popup, message the opener
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token }, window.location.origin);
            window.close();
          } else {
            // If not in a popup (mobile redirect), save directly
            localStorage.setItem('spotify_token', token);
            window.location.href = '/';
          }
        }
      }
    }
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (containerRef.current) {
// intentionally empty or track scroll if needed, though we don't need pull-to-refresh
    }
  };

  useEffect(() => {
    if (onboardingCompleted && workoutHistory) {
      checkAndScheduleWorkoutReminder(workoutHistory);
    }
  }, [onboardingCompleted, workoutHistory]);

  useEffect(() => {
    // Stale-while-revalidate logic: if we have local cache, we don't need to block UI
    let hasLocalCache = false;
    try {
      const cached = localStorage.getItem('user_data_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.onboardingCompleted) {
          hasLocalCache = true;
        }
      }
    } catch (e) {}

    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthChecking((prevChecking) => {
        if (!prevChecking && user) {
          // If auth checking was already done and we now have a user,
          // it means this is a fresh login (not a restored session).
          // We can bypass biometric lock for this session.
          setIsUnlocked(true);
        }
        return prevChecking;
      });

      setUserAuth(user);
      setIsAuthChecking(false);
      
      if (user) {
        if (user.email) {
          updateUser({ id: user.uid, email: user.email });
        }
        
        try {
          const cached = localStorage.getItem('user_data_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed._uid && parsed._uid !== user.uid) {
              localStorage.removeItem('user_data_cache');
              localStorage.removeItem('user_logs_cache');
              window.location.reload();
              return;
            }
          }
        } catch (e) {}

        const docRef = doc(db, 'users', user.uid);
        
        // Safety timeout for Firestore response
        const timeoutId = setTimeout(() => {
           console.warn("Data fetch timeout: Proceeding with local state");
           setIsDataLoading(false);
        }, 8000);

        // If we have local cache, stop blocking the UI immediately!
        // We'll let onSnapshot revalidate silently in the background.

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (!docSnap.metadata.fromCache) {
             clearTimeout(timeoutId);
             setIsDataLoading(false);
          }
          
          if (docSnap.exists()) {
             // Revalidate state from the server silently
             const data = docSnap.data();
             setServerState({ ...data, id: user.uid });

             // Ensure public profile exists for leaderboard visibility
             if (data.name) {
                const publicRef = doc(db, 'public_profiles', user.uid);
                getDoc(publicRef).then(pSnap => {
                   if (!pSnap.exists() || pSnap.data()?.name !== data.name) {
                      import('firebase/firestore').then(({ setDoc }) => {
                         setDoc(publicRef, {
                            name: data.name,
                            points: data.points || 0,
                            profilePicture: data.profilePicture || '',
                            updatedAt: Date.now()
                         }, { merge: true });
                      });
                   }
                });
             }

             if (data.onboardingCompleted === true || data.name) {
                 setOnboardingCompleted(true);
             } else {
                 if (!docSnap.metadata.fromCache) {
                     setOnboardingCompleted(false);
                 }
             }
          } else {
             if (!(docSnap as any).metadata.fromCache) {
                 setOnboardingCompleted(false);
             }
          }
        }, (error) => {
          clearTimeout(timeoutId);
          console.error("Firestore onSnapshot error:", error);
          if (!hasLocalCache) {
             setOnboardingCompleted(false);
          }
          setIsDataLoading(false);
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        });

        // 2. LISTEN TO THE TODAY'S LOGS DOCUMENT (Separated from user profile doc)
        const todayStr = new Date().toISOString().split('T')[0];
        const logDocRef = doc(db, 'users', user.uid, 'daily_logs', todayStr);
        const unsubscribeLogs = onSnapshot(logDocRef, (logSnap) => {
           if (logSnap.exists()) {
              console.log('[App] Daily logs refresh:', logSnap.data());
              setServerState(logSnap.data()); // This will merge into the logsState in AppContext
           }
        });

        return () => {
          unsubscribe();
          unsubscribeLogs();
        };
      } else {
        setIsDataLoading(false);
      }
    });
    return unsub;
  }, []);

  const LoadingFallback = () => (
     <div className="flex bg-(--color-background) h-screen flex-col space-y-4 px-4 w-full max-w-md mx-auto justify-center">
         <div className="animate-pulse flex flex-col space-y-4 w-full">
             <div className="h-8 bg-black/5 dark:bg-white/5 rounded-full w-1/3 self-center mb-2"></div>
             <div className="h-4 bg-black/5 dark:bg-white/5 rounded-full w-1/2 self-center mb-8"></div>
             
             <div className="grid grid-cols-2 gap-4 w-full">
               <div className="h-40 bg-black/5 dark:bg-white/5 rounded-[2.5rem]"></div>
               <div className="h-40 bg-black/5 dark:bg-white/5 rounded-[2.5rem]"></div>
             </div>
             
             <div className="h-64 bg-black/5 dark:bg-white/5 rounded-[3rem] w-full mt-4"></div>
             <div className="h-24 bg-black/5 dark:bg-white/5 rounded-[2rem] w-full mt-4"></div>
         </div>
     </div>
  );

  if (isAuthChecking) {
     return <LoadingFallback />;
  }

  if (!userAuth) {
     return (
       <Suspense fallback={<LoadingFallback />}>
         <Auth />
       </Suspense>
     );
  }

  if (!onboardingCompleted && isDataLoading) {
      return <LoadingFallback />;
  }

  if (!onboardingCompleted) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Onboarding />
      </Suspense>
    );
  }

  if (user?.biometricEnabled && !isUnlocked) {
    return <BiometricLock onUnlock={() => setIsUnlocked(true)} />;
  }

  const TabSkeleton = () => {
    switch(currentTab) {
      case 'workouts':
        return (
          <div className="flex bg-(--color-background) h-full flex-col p-4 w-full justify-start space-y-6 pt-12 animate-pulse">
            <div className="h-8 bg-black/5 dark:bg-white/5 rounded-full w-1/2 mb-4"></div>
            <div className="space-y-4">
              <div className="h-32 bg-black/5 dark:bg-white/5 rounded-[2rem] w-full"></div>
              <div className="h-32 bg-black/5 dark:bg-white/5 rounded-[2rem] w-full"></div>
              <div className="h-32 bg-black/5 dark:bg-white/5 rounded-[2rem] w-full"></div>
            </div>
          </div>
        );
      case 'diet':
        return (
          <div className="flex bg-(--color-background) h-full flex-col p-4 w-full justify-start space-y-6 pt-12 animate-pulse">
             <div className="flex justify-between items-center mb-2">
               <div className="h-8 bg-black/5 dark:bg-white/5 rounded-full w-1/3"></div>
               <div className="h-4 bg-black/5 dark:bg-white/5 rounded-full w-16"></div>
             </div>
             
             <div className="h-48 bg-black/5 dark:bg-white/5 rounded-[2.5rem] w-full mb-2"></div>
             
             <div className="flex gap-4">
                <div className="flex-1 h-32 bg-black/5 dark:bg-white/5 rounded-[2rem]"></div>
                <div className="flex-1 h-32 bg-black/5 dark:bg-white/5 rounded-[2rem]"></div>
             </div>
          </div>
        );
      case 'community':
        return (
          <div className="flex bg-(--color-background) h-full flex-col p-4 w-full justify-start space-y-6 pt-12 animate-pulse">
            <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-2 rounded-full w-full">
               <div className="flex-1 h-10 bg-black/10 dark:bg-white/10 rounded-full mx-1"></div>
               <div className="flex-1 h-10 bg-transparent rounded-full mx-1"></div>
               <div className="flex-1 h-10 bg-transparent rounded-full mx-1"></div>
            </div>
            <div className="space-y-4 mt-6">
              <div className="h-48 bg-black/5 dark:bg-white/5 rounded-[2rem] w-full"></div>
              <div className="h-48 bg-black/5 dark:bg-white/5 rounded-[2rem] w-full"></div>
            </div>
          </div>
        );
      case 'more':
        return (
           <div className="flex bg-(--color-background) h-full flex-col p-4 w-full justify-start space-y-6 pt-12 animate-pulse">
              <div className="flex flex-col items-center gap-4 mb-8">
                 <div className="w-24 h-24 bg-black/5 dark:bg-white/5 rounded-full"></div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="h-6 bg-black/5 dark:bg-white/5 rounded-full w-32"></div>
                    <div className="h-4 bg-black/5 dark:bg-white/5 rounded-full w-24"></div>
                 </div>
              </div>
              
              <div className="space-y-3">
                 <div className="h-16 bg-black/5 dark:bg-white/5 rounded-2xl w-full"></div>
                 <div className="h-16 bg-black/5 dark:bg-white/5 rounded-2xl w-full"></div>
                 <div className="h-16 bg-black/5 dark:bg-white/5 rounded-2xl w-full"></div>
                 <div className="h-16 bg-black/5 dark:bg-white/5 rounded-2xl w-full"></div>
              </div>
           </div>
        );
      case 'dashboard':
      default:
        return (
          <div className="flex bg-(--color-background) h-full flex-col space-y-4 p-4 w-full justify-start pt-12 animate-pulse">
            <div className="flex items-center justify-between pl-2">
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-black/5 dark:bg-white/5 rounded-full w-24"></div>
                  <div className="h-8 bg-black/5 dark:bg-white/5 rounded-full w-48"></div>
                </div>
                <div className="h-10 w-10 bg-black/5 dark:bg-white/5 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              <div className="h-32 bg-black/5 dark:bg-white/5 rounded-[2.5rem]"></div>
              <div className="h-32 bg-black/5 dark:bg-white/5 rounded-[2.5rem]"></div>
            </div>
            
            <div className="h-64 bg-black/5 dark:bg-white/5 rounded-[3rem] w-full mt-4"></div>
            <div className="h-24 bg-black/5 dark:bg-white/5 rounded-[2rem] w-full mt-4"></div>
          </div>
        );
    }
  };

  const variants: any = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  const renderTab = () => {
    switch(currentTab) {
      case 'dashboard': return <Dashboard navigate={switchTab} />;
      case 'workouts': return <Workouts />;
      case 'diet': return <Diet />;
      case 'community': return <Community />;
      case 'more': return <MoreMenu navigate={switchTab} openAIChat={() => setShowAITrainer(true)} />;
      default: return <Dashboard navigate={switchTab} />;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-(--color-background) text-(--color-foreground) overflow-hidden w-full max-w-[100vw] md:max-w-3xl mx-auto border-x border-white/5 relative shader-bg">
      <Toast />
      <SyncStatus />
      <RewardPopup />
      <BadgeManager />
      <BadgeCelebration />
      <RankUpAnimation />
      <PermissionRequestFlow />
      <div 
        className="flex-1 flex flex-col overflow-hidden relative"
        ref={containerRef}
        onScroll={handleScroll}
      >
        <div
          className="flex-1 flex flex-col relative h-full w-full"
          ref={contentRef}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentTab}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 flex flex-col w-full h-full cursor-grab active:cursor-grabbing overflow-y-auto no-scrollbar pb-32"
            >
              <ErrorBoundary>
                <div 
                  className="w-full h-full flex flex-col"
                  onPointerDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('canvas') || target.closest('.no-swipe')) {
                      e.stopPropagation();
                    }
                  }}
                >
                  <Suspense fallback={<TabSkeleton />}>
                    {renderTab()}
                  </Suspense>
                </div>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      <div className="absolute bottom-0 z-[100] w-full max-w-3xl mx-auto pointer-events-none">
        {/* AI Floating Button */}
        <div className="absolute -top-16 right-4 pointer-events-auto">
          <button 
            onClick={() => setShowAITrainer(true)}
            className="w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center shadow-glow active:scale-95 transition-all hover:scale-110 border-4 border-background"
          >
            <Bot size={28} strokeWidth={3} />
          </button>
        </div>

        <div className="relative w-full px-4 pt-4 pb-4 flex flex-col justify-end pointer-events-auto">
          <AnimatePresence mode="wait" initial={false}>
            {showMiniPlayer ? (
              <motion.div
                key="mini-player"
                initial={{ 
                  y: 100,
                  opacity: 0 
                }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ 
                  y: 100,
                  opacity: 0 
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="w-full h-18 pointer-events-auto"
              >
                <MiniPlayer onSwipe={(dir) => dismissMiniPlayer(dir as any)} />
              </motion.div>
            ) : (
              <motion.div
                key="bottom-nav"
                initial={{ 
                  y: 100,
                  opacity: 0 
                }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ 
                  y: 100,
                  opacity: 0 
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="w-full h-16 pointer-events-auto"
              >
                <BottomNav 
                  currentTab={currentTab} 
                  setCurrentTab={switchTab} 
                  onSwipeUp={(dir) => triggerMiniPlayer(dir)} 
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="h-safe-bottom" />
        </div>
      </div>
      <AnimatePresence>
        {showAITrainer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <div className="w-full h-full relative">
              <AITrainerChat onClose={() => setShowAITrainer(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { SearchProvider } from './context/SearchContext';

export default function App() {
  return (
    <SearchProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </SearchProvider>
  );
}
