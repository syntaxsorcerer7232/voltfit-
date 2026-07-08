import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, useReducer } from 'react';
import { AppState, UserProfile } from '../types';
import { calculateMacros } from '../utils/calories';
import { auth, db } from '../lib/firebase';
import { BadgeDef, BADGES } from '../utils/gamification';

export interface AppLogsState {
  meals: any[];
  waterIntake: any[];
  sleepLogs: any[];
  dailySteps: number;
  moods: any[];
  supplementLogs: any[];
  aiRecovery?: {
    score: number;
    status: string;
    recommendation: string;
    timestamp: string;
  };
  lastCheckInDate?: string;
  lastStepsReset?: string;
}

export interface ToastDef {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType extends AppState {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  updateUser: (data: Partial<UserProfile>, overrideHistory?: import('../types').WorkoutHistoryItem[]) => void;
  updateWorkoutSchedule: (schedule: import('../types').WorkoutSchedule) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => void;
  setDisciplineMode: (active: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  awardPoints: (points: number, incrementWorkout?: boolean, reason?: string) => void;
  recentRewards: { points: number, reason: string, id: string }[];
  clearRecentRewards: (id?: string) => void;
  userRank: number | null;
  addSteps: (steps: number) => void;
  resetDailySteps: () => void;
  addWater: (amountMl: number) => void;
  addMeal: (meal: Omit<import('../types').Meal, 'id' | 'date' | 'time'>) => void;
  removeMeal: (id: string) => void;
  addSleepLog: (action: 'sleep' | 'wake') => void;
  addMoodLog: (status: 'Tired' | 'Normal' | 'Motivated') => void;
  addSupplementLog: (log: Omit<import('../types').SupplementLog, 'id' | 'date' | 'time'>) => void;
  removeSupplementLog: (id: string) => void;
  updateAIRecovery: (aiData: { score: number, status: string, recommendation: string }) => void;
  recentBadges: BadgeDef[];
  clearRecentBadges: (badgeId?: string) => void;
  triggerBadgeCelebration: (badges: BadgeDef[]) => void;
  setServerState: (data: any) => void;
  setIsDataLoading: (loading: boolean) => void;
  currentDateStr: string;
  toast: ToastDef | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

const defaultUser: UserProfile = {
  name: '',
  email: '',
  points: 0,
  badges: [],
  gender: '',
  dateOfBirth: '',
  mobile: '',
  height: 0,
  weight: 0,
  bodyType: '',
  allergies: [],
  dietPreference: '',
  workoutPreference: '',
  workoutFrequency: '',
  goal: '',
  goalSpeed: '',
  calorieGoal: 0,
  maintainCalories: 0,
  proteinGoal: 0,
  carbsGoal: 0,
  fatsGoal: 0,
  waterIntakeGoal: 2000,
  bio: '',
  profilePicture: '',
  biometricEnabled: false,
  supplements: [],
  isNatural: true,
};

const defaultLogsState: AppLogsState = {
  meals: [],
  waterIntake: [],
  sleepLogs: [],
  dailySteps: 0,
  moods: [],
  supplementLogs: [],
};

const defaultState: AppState = {
  user: defaultUser,
  isAuthenticated: false,
  onboardingCompleted: false,
  disciplineMode: false,
  theme: 'dark',
  streak: 0,
  workoutSchedule: { mode: 'default', custom: [] },
  workoutHistory: [],
  workoutDiary: [],
  isDataLoading: true,
  challenges: [],
  communityTips: [],
  communityQuestions: [],
  leaderboard: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);
const AppLogsContext = createContext<AppLogsState | undefined>(undefined);

const reducer = <T,>(state: T, action: Partial<T> | ((prev: T) => T)): T => {
  return typeof action === 'function' ? action(state) : { ...state, ...action };
};

const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0]; // Standard YYYY-MM-DD
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDateStr, setCurrentDateStr] = useState(() => {
    const today = getTodayStr();
    const cachedDate = localStorage.getItem('last_active_date');
    return cachedDate || today;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [state, setState] = useReducer(reducer<AppState>, defaultState, (def) => {
    try {
      const cached = localStorage.getItem('user_data_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const hasCompleted = parsed.onboardingCompleted === true || !!parsed.user?.name;
        // Stale-while-revalidate: if onboarding is complete in cache, don't show loading screen
        return { ...def, ...parsed, isDataLoading: !hasCompleted, onboardingCompleted: hasCompleted };
      }
    } catch (e) {
      console.warn('Failed to load local cache', e);
    }
    return def;
  });

  const [logsState, setLogsState] = useReducer(reducer<AppLogsState>, defaultLogsState, (def) => {
    try {
      const cached = localStorage.getItem('user_logs_cache');
      if (cached) {
        return { ...def, ...JSON.parse(cached) };
      }
      // Migration from unified state
      const unifiedCache = localStorage.getItem('user_data_cache');
      if (unifiedCache) {
         const parsed = JSON.parse(unifiedCache);
         return {
           meals: parsed.meals || [],
           waterIntake: parsed.waterIntake || [],
           sleepLogs: parsed.sleepLogs || [],
           dailySteps: parsed.dailySteps || 0,
           moods: parsed.moods || []
         };
      }
    } catch (e) {
       console.warn('Failed to load logs cache', e);
    }
    return def;
  });

  const [recentBadges, setRecentBadges] = useState<BadgeDef[]>([]);
  const [recentRewards, setRecentRewards] = useState<{ points: number, reason: string, id: string }[]>([]);
  const [toast, setToast] = useState<ToastDef | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: Date.now().toString(), message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Cache cleanup utility
  useEffect(() => {
    const checkNewDay = () => {
       const today = getTodayStr();
       setCurrentDateStr(prevDate => {
          if (prevDate !== today) {
             console.log(`[checkNewDay] Day transition detected: ${prevDate} -> ${today}. Resetting daily logs.`);
             // Date changed! Reset daily volatile values.
             
             // First grab the latest states safely via callback to archive them
             setLogsState(currentLogs => {
                 setState(currentState => {
                     // Fire and forget archival for the previous date
                     if (auth.currentUser) {
                         import('../utils/dailyLogManager').then(({ archiveDailyData }) => {
                             archiveDailyData(auth.currentUser!.uid, prevDate, currentLogs, currentState.workoutHistory, currentState.workoutDiary, currentState.user.habits || []);
                         });
                     }
                     return currentState;
                 });
                 
                 const newLogs = { 
                     ...currentLogs, 
                     dailySteps: 0,
                     meals: currentLogs.meals.filter(m => m.date === today),
                     waterIntake: currentLogs.waterIntake.filter(w => w.date === today),
                     sleepLogs: currentLogs.sleepLogs.filter(s => s.time?.startsWith(today)),
                     moods: currentLogs.moods?.filter(m => m.date === today) || []
                 };
                 
                 // Push the new initial day state to Firestore
                 if (auth.currentUser) {
                     import('firebase/firestore').then(({ doc, updateDoc }) => {
                         const userRef = doc(db, 'users', auth.currentUser!.uid);
                         updateDoc(userRef, { 
                             dailySteps: 0,
                             meals: newLogs.meals,
                             waterIntake: newLogs.waterIntake,
                             moods: newLogs.moods,
                             lastCheckInDate: today,
                             lastStepsReset: today
                         }).catch(console.error);
                     });
                 }
                 return newLogs;
             });
             localStorage.setItem('last_active_date', today);
             return today;
          }
          localStorage.setItem('last_active_date', prevDate);
          return prevDate;
       });
    };
    
    // Check immediately and then every minute
    checkNewDay();
    const dayInterval = setInterval(checkNewDay, 60000);

    const purgeStaleCaches = () => {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          // Purge expired cache entries
          if (key.startsWith('athlete_app_cache_') && key !== 'user_data_cache') {
            localStorage.removeItem(key);
          }
          if (key.startsWith('cache_entry_') || key.endsWith('_expired')) {
            localStorage.removeItem(key);
          }
          // Purge compressed stale logs and temporary data
          if (key.includes('stale') || key.includes('temp') || key.includes('log_') || key.includes('compressed_log')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Stale cache purge failed', e);
      }
    };
    
    // Initial cleanup
    purgeStaleCaches();
    
    // Periodically purge expired cache entries and compressed stale logs every 15 minutes
    const interval = setInterval(purgeStaleCaches, 1000 * 60 * 15);
    return () => {
       clearInterval(interval);
       clearInterval(dayInterval);
    };
  }, []);

  // Global Real-time Sync for Challenges and Community Tips
  useEffect(() => {
    let unsubscribeChallenges: (() => void) | null = null;
    let unsubscribeTips: (() => void) | null = null;

    const startGlobalSync = async () => {
      try {
        const { collection, query, orderBy, limit, onSnapshot } = await import('firebase/firestore');
        
        // 1. Challenges Sync
        const challengesQ = query(collection(db, 'challenges'), orderBy('createdAt', 'desc'));
        unsubscribeChallenges = onSnapshot(challengesQ, (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setState({ challenges: data as any });
        }, (err) => console.error("Global Challenges sync error:", err.code, err.message));

        // 2. Tips Sync
        const tipsQ = query(collection(db, 'tips'), orderBy('createdAt', 'desc'), limit(100));
        unsubscribeTips = onSnapshot(tipsQ, (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setState({ communityTips: data as any });
        }, (err) => console.error("Global Tips sync error:", err.code, err.message));

        // 3. Questions Sync
        const questionsQ = query(collection(db, 'community_questions'), orderBy('createdAt', 'desc'), limit(50));
        const unsubscribeQuestions = onSnapshot(questionsQ, (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setState({ communityQuestions: data as any });
        }, (err) => console.error("Global Questions sync error:", err.code, err.message));

        // 4. Leaderboard Sync
        const leaderboardQ = query(collection(db, 'public_profiles'), orderBy('points', 'desc'), limit(50));
        const unsubscribeLeaderboard = onSnapshot(leaderboardQ, (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setState({ leaderboard: data as any });
        }, (err) => console.error("Global Leaderboard sync error:", err.code, err.message));

        return () => {
          unsubscribeChallenges?.();
          unsubscribeTips?.();
          unsubscribeQuestions?.();
          unsubscribeLeaderboard?.();
        };
      } catch (err) {
        console.error("Failed to initialize Global Sync:", err);
      }
    };

    const cleanup = startGlobalSync();

    // Global Seeding
    const seedInitialData = async () => {
      // Wait a bit to ensure sync has a chance to populate
      setTimeout(async () => {
        if (!auth.currentUser) return;
        
        try {
          const { getDocs, query, collection, limit, addDoc } = await import('firebase/firestore');
          
          // Seed Challenges
          const challengesSnap = await getDocs(query(collection(db, 'challenges'), limit(1)));
          if (challengesSnap.empty) {
            console.log("Seeding initial challenges...");
            const initial = [
               {
                 title: 'Weekly 50k Steps',
                 description: 'Walk 50,000 steps this week.',
                 participants: 1,
                 type: 'steps',
                 goal: 50000,
                 friends: [{ name: 'System', progress: 0, userId: 'system' }],
                 joinedUsers: ['system'],
                 createdAt: new Date().toISOString()
               },
               {
                 title: '4-Day Split Consistency',
                 description: 'Complete 4 workouts this week.',
                 participants: 0,
                 type: 'workout',
                 goal: 4,
                 friends: [],
                 joinedUsers: [],
                 createdAt: new Date().toISOString()
               }
             ];
             for (const c of initial) {
               await addDoc(collection(db, 'challenges'), c);
             }
          }

          // Seed Tips
          const tipsSnap = await getDocs(query(collection(db, 'tips'), limit(1)));
          if (tipsSnap.empty) {
             console.log("Seeding initial community tips...");
             const initialTips = [
               {
                 title: 'The Perfect Warm-up',
                 content: 'Always start with 5-10 minutes of dynamic stretching. Avoid static stretching before heavy lifting.',
                 authorId: 'system',
                 authorName: 'AthletePro Bot',
                 authorRank: 'Expert',
                 likes: { helpful: [], science: [], motivating: [], bookmarks: [] },
                 createdAt: new Date().toISOString()
               },
               {
                 title: 'Hydration Strategy',
                 content: 'Drink 500ml of water 2 hours before your workout and sip throughout your session.',
                 authorId: 'system',
                 authorName: 'AthletePro Bot',
                 authorRank: 'Expert',
                 likes: { helpful: [], science: [], motivating: [], bookmarks: [] },
                 createdAt: new Date().toISOString()
               }
             ];
             for (const t of initialTips) {
               await addDoc(collection(db, 'tips'), t);
             }
          }
        } catch (e) {
          console.warn("Seeding failed", e);
        }
      }, 5000);
    };

    seedInitialData();

    return () => {
       cleanup.then(unsub => unsub?.());
    };
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    try {
      const stateToCache = { ...state };
      
      // Compress and trim stale logs before caching to save space & stay performant
      const MAX_CACHE_RECORDS = 40;
      if (stateToCache.workoutHistory?.length > MAX_CACHE_RECORDS) {
         stateToCache.workoutHistory = stateToCache.workoutHistory.slice(-MAX_CACHE_RECORDS);
      }
      if (stateToCache.workoutDiary?.length > MAX_CACHE_RECORDS) {
         stateToCache.workoutDiary = stateToCache.workoutDiary.slice(-MAX_CACHE_RECORDS);
      }
      
      const cachePayload = {
        ...stateToCache,
        _uid: auth.currentUser?.uid || null
      };
      
      localStorage.setItem('user_data_cache', JSON.stringify(cachePayload));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, clearing cache...');
        localStorage.removeItem('user_data_cache');
      } else {
        console.warn('Failed to save local cache', e);
      }
    }
  }, [state]);

  // Persist logs to localStorage
  useEffect(() => {
    try {
      const logsToCache = { ...logsState };
      const MAX_CACHE_RECORDS = 40;
      if (logsToCache.meals?.length > MAX_CACHE_RECORDS) {
         logsToCache.meals = logsToCache.meals.slice(-MAX_CACHE_RECORDS);
      }
      // Similarly for sleepLogs and waterIntake if they get too big
      localStorage.setItem('user_logs_cache', JSON.stringify(logsToCache));
    } catch (e) {
      console.warn('Failed to save logs cache', e);
    }
  }, [logsState]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(state.theme);
  }, [state.theme]);

  const setServerState = useCallback((data: any) => {
    console.log('[setServerState] called with firestore data:', data);
    
    // Use the current date string derived from state to align with the rest of the app
    const today = getTodayStr();
    
    const root = window.document.documentElement;
    const { workoutHistory, workoutSchedule, meals, waterIntake, dailySteps, streak, sleepLogs, moods, aiRecovery, ...userProfile } = data;
    
    // Update theme if present in profile
    if (userProfile.theme) {
       root.classList.remove('light', 'dark');
       root.classList.add(userProfile.theme);
    }
    
    // Filter fresh logs from the server payload to prevent stale UI on missing archival.
    const freshMeals = (meals || []).filter((m: any) => m.date === today);
    const freshWater = (waterIntake || []).filter((w: any) => w.date === today);
    const freshSleep = (sleepLogs || []).filter((s: any) => s.time?.startsWith(today));
    const freshMoods = (moods || []).filter((m: any) => m.date === today);
    // If the server's daily steps are present but don't match our freshly truncated ones, that means it might be from yesterday, but we'll accept it; ideally it comes from the archive fix.
    
    // Update main state
    setState(prev => {
      let safePoints = userProfile.points ?? prev.user?.points ?? 0;
      const safeHistory = workoutHistory || prev.workoutHistory || [];
      
      // Recalculate minimum points if a corrupted drop occurred
      const expectedWorkoutPoints = safeHistory.filter((w: any) => w.completed).length * 50;
      const expectedBadgePoints = (userProfile.badges || prev.user?.badges || []).reduce((acc: number, bId: string) => {
          return acc + (BADGES[bId]?.pointsReward || 0);
      }, 0);
      
      const minPoints = expectedWorkoutPoints + expectedBadgePoints;
      if (safePoints < minPoints) {
          console.log(`[setServerState] Restoring missing points: Auto-correcting ${safePoints} -> ${minPoints}`);
          safePoints = minPoints;
      }

      const newUser = { ...prev.user, ...userProfile, points: safePoints };

      console.log('[setServerState] Current local schedule:', prev.workoutSchedule);
      console.log('[setServerState] Incoming server schedule:', workoutSchedule);

      // Ensure stable schedules: prevent server's stale 'default' state from reverting local 'custom' state
      let safeSchedule = workoutSchedule || prev.workoutSchedule;
      if (prev.workoutSchedule?.mode === 'custom' && workoutSchedule?.mode === 'default') {
         console.warn('[setServerState] Detected server pushing default schedule while local is custom. Preserving local custom schedule.');
         safeSchedule = prev.workoutSchedule;
      }

      console.log('[setServerState] Final safeSchedule applied:', safeSchedule);

      return {
        ...prev,
        user: newUser,
        workoutHistory: workoutHistory || prev.workoutHistory,
        workoutSchedule: safeSchedule,
        theme: userProfile.theme || prev.theme,
      };
    });

    // Update logs state
    setLogsState(prev => {
       const hasResettedToday = userProfile.lastStepsReset === today || userProfile.lastCheckInDate === today;
       const stepsDateMatches = hasResettedToday;
       
       if (!hasResettedToday && auth.currentUser) {
          console.log(`[setServerState] Stale date detected in Firestore (${userProfile.lastStepsReset}). Triggering sync reset for ${today}.`);
          // Explicitly sync the reset back to Firestore to ensure consistency
          syncLogsToFirestore({ 
             dailySteps: 0, 
             meals: [], 
             waterIntake: [], 
             moods: [], 
             lastCheckInDate: today, 
             lastStepsReset: today 
          });
       }

       return {
          ...prev,
          meals: freshMeals.length > 0 ? freshMeals : (stepsDateMatches ? (meals || prev.meals) : []),
          waterIntake: freshWater.length > 0 ? freshWater : (stepsDateMatches ? (waterIntake || prev.waterIntake) : []),
          dailySteps: stepsDateMatches ? (dailySteps !== undefined ? dailySteps : prev.dailySteps) : 0,
          sleepLogs: freshSleep.length > 0 ? freshSleep : (stepsDateMatches ? (sleepLogs || prev.sleepLogs) : []),
          moods: freshMoods.length > 0 ? freshMoods : (stepsDateMatches ? (moods || prev.moods || []) : []),
          aiRecovery: stepsDateMatches ? (aiRecovery || prev.aiRecovery) : undefined,
       };
    });
  }, []);

  const updateWorkoutSchedule = useCallback(async (schedule: import('../types').WorkoutSchedule) => {
    console.log('[updateWorkoutSchedule] Lifecycle start. Target schedule:', JSON.stringify(schedule, null, 2));

    if (auth.currentUser) {
       console.log(`[updateWorkoutSchedule] Auth currentUser found (${auth.currentUser.uid}). Initiating Firestore update...`);
       try {
          const { doc, updateDoc, setDoc, getDoc } = await import('firebase/firestore');
          const userRef = doc(db, 'users', auth.currentUser.uid);
          
          console.log('[updateWorkoutSchedule] Firestore imported, executing updateDoc...');
          const startTime = performance.now();
          
          try {
             await updateDoc(userRef, { workoutSchedule: schedule });
          } catch (err: any) {
             if (err.code === 'not-found') {
                await setDoc(userRef, { workoutSchedule: schedule }, { merge: true });
             } else {
                throw err;
             }
          }
          
          const duration = (performance.now() - startTime).toFixed(2);
          console.log(`[updateWorkoutSchedule] Successfully saved workoutSchedule to Firestore via updateDoc in ${duration}ms.`);
          
          // Verify what was saved
          const verifyDoc = await getDoc(userRef);
          console.log('[updateWorkoutSchedule] Verification read:', verifyDoc.data()?.workoutSchedule);

          // Update local state ONLY after Firestore sync succeeds to prevent reverts
          console.log('[updateWorkoutSchedule] Updating local state...');
          setState(prev => ({ ...prev, workoutSchedule: schedule }));
          console.log('[updateWorkoutSchedule] Lifecycle complete.');
       } catch (error) {
          console.error('[updateWorkoutSchedule] Error saving workoutSchedule to Firestore:', error);
          throw error; // Rethrow to let caller know it failed
       }
    } else {
       console.log('[updateWorkoutSchedule] No auth.currentUser active, updating local state only.');
       setState(prev => ({ ...prev, workoutSchedule: schedule }));
       console.log('[updateWorkoutSchedule] Lifecycle complete (local only).');
    }
  }, []);

  const syncProfileTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingProfileUpdatesRef = useRef<Record<string, any>>({});
  const syncLogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingLogUpdatesRef = useRef<Record<string, any>>({});

  const syncToFirestore = useCallback((updates: Record<string, any>) => {
    if (auth.currentUser) {
       Object.assign(pendingProfileUpdatesRef.current, updates);
       
       if (syncProfileTimerRef.current) {
           clearTimeout(syncProfileTimerRef.current);
       }
       syncProfileTimerRef.current = setTimeout(async () => {
           const updatesToPush = { ...pendingProfileUpdatesRef.current };
           pendingProfileUpdatesRef.current = {};
           if (Object.keys(updatesToPush).length === 0) return;

           try {
               const { doc, updateDoc, setDoc } = await import('firebase/firestore');
               const userRef = doc(db, 'users', auth.currentUser!.uid);
               try {
                  await updateDoc(userRef, updatesToPush);
               } catch (err: any) {
                  if (err.code === 'not-found') {
                      await setDoc(userRef, updatesToPush, { merge: true });
                  } else {
                      console.error('Failed to sync profile to firestore', err);
                  }
               }
           } catch (err) {
               console.error('Failed to load firestore for profile sync', err);
           }
       }, 2000);
    }
  }, []);

  const updateUser = useCallback(async (data: Partial<UserProfile>, overrideHistory?: import('../types').WorkoutHistoryItem[]) => {
    const now = new Date().toISOString();

    if (auth.currentUser) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', auth.currentUser.uid);
        
        let updates: any = { ...data, updatedAt: now };
        if (overrideHistory) updates.workoutHistory = overrideHistory;

        // Write directly and immediately to Firestore
        await setDoc(userRef, updates, { merge: true });

        // If also updating public profiles (e.g., name, picture, points, rank), update that instantly too
        if ('name' in data || 'profilePicture' in data || 'points' in data || 'strengthRank' in data || 'rank' in data) {
          const publicRef = doc(db, 'public_profiles', auth.currentUser.uid);
          const publicUpdates: any = {};
          if ('name' in data) publicUpdates.name = data.name;
          if ('profilePicture' in data) publicUpdates.profilePicture = data.profilePicture;
          if ('points' in data) publicUpdates.points = data.points;
          if ('strengthRank' in data) publicUpdates.strengthRank = data.strengthRank;
          if ('rank' in data) publicUpdates.rank = data.rank;
          publicUpdates.updatedAt = Date.now();
          await setDoc(publicRef, publicUpdates, { merge: true });
        }
        console.log('[updateUser] Direct cloud profile sync successful.');
      } catch (err) {
        console.error('[updateUser] Instant profile sync failed:', err);
      }
    }

    setState(prev => {
      const newUser = { ...prev.user, ...data };
      const macros = calculateMacros(newUser);
      const finalUser = { ...newUser, ...macros };

      // Backwards compatibility sync call in case other non-critical items need it
      const updates: any = { ...data, ...macros, updatedAt: now, syncStatus: 'synced' };
      if (overrideHistory) updates.workoutHistory = overrideHistory;
      syncToFirestore(updates);

      return {
        ...prev,
        user: { ...finalUser, updatedAt: now },
        ...(overrideHistory && { workoutHistory: overrideHistory })
      };
    });
  }, [syncToFirestore]);

  const setOnboardingCompleted = useCallback((completed: boolean) => setState(prev => ({ ...prev, onboardingCompleted: completed, isAuthenticated: completed })), []);
  const setDisciplineMode = useCallback((active: boolean) => setState(prev => ({ ...prev, disciplineMode: active })), []);
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState(prev => ({ ...prev, theme }));
    updateUser({ theme });
  }, [updateUser]);

  const awardPoints = useCallback((points: number, incrementWorkout: boolean = false, reason: string = 'General Activity') => {
    console.log(`[awardPoints] Called with points=${points}, incrementWorkout=${incrementWorkout}, reason='${reason}'`);
    
    // Add to recent rewards for popup feedback
    setRecentRewards(prev => [...prev.slice(-2), { points, reason, id: Date.now().toString() + Math.random() }]);

    setState(prev => {
      const newPoints = (prev.user.points || 0) + points;
      let newHistory = prev.workoutHistory;
      let historyChanged = false;
      
      if (incrementWorkout) {
          console.log(`[awardPoints] incrementWorkout is TRUE. Simulating workout history entry.`);
          newHistory = [...newHistory, { id: Date.now().toString(), name: 'Workout', type: 'gym', completed: true, date: new Date().toISOString(), exercises: [] }];
          historyChanged = true;
      }

      if (auth.currentUser) {
          console.log(`[awardPoints] Authenticated user ${auth.currentUser.uid} found. Writing to Firestore.`);
          import('firebase/firestore').then(({ doc, updateDoc, increment, setDoc, collection, addDoc, serverTimestamp }) => {
              const userRef = doc(db, 'users', auth.currentUser!.uid);
              const publicRef = doc(db, 'public_profiles', auth.currentUser!.uid);
              const pointsSubcollectionRef = collection(db, 'users', auth.currentUser!.uid, 'points');
              
              const updatePromises = [];

              // Atomic increment
              const p1 = updateDoc(userRef, { points: increment(points) }).catch((err: any) => {
                  console.warn(`[awardPoints] users doc updateDoc failed: ${err.message}. Creating document.`);
                  if (err.code === 'not-found') {
                     return setDoc(userRef, { points: points }, { merge: true });
                  }
                  throw err;
              });
              updatePromises.push(p1);
              
              const p2 = updateDoc(publicRef, { 
                  points: increment(points),
                  name: state.user.name || 'Anonymous',
                  updatedAt: Date.now()
              }).catch((err: any) => {
                  console.warn(`[awardPoints] public_profiles doc updateDoc failed: ${err.message}. Creating document.`);
                  if (err.code === 'not-found') {
                     return setDoc(publicRef, { 
                         points: points, 
                         name: state.user.name || 'Anonymous',
                         updatedAt: Date.now()
                     }, { merge: true });
                  }
                  throw err;
              });
              updatePromises.push(p2);

              // Add a record to the points sub-collection
              const p3 = addDoc(pointsSubcollectionRef, {
                  amount: points,
                  reason: reason,
                  timestamp: serverTimestamp()
              }).then((docRef) => {
                  console.log(`[awardPoints] Successfully wrote point transaction to sub-collection: ${docRef.id}`);
              }).catch((err: any) => {
                  console.error(`[awardPoints] Failed to write point log to sub-collection: ${err.message}`);
              });
              updatePromises.push(p3);

              Promise.all(updatePromises).then(() => {
                  console.log(`[awardPoints] All Firestore point updates successfully persisted.`);
              }).catch((err: any) => {
                  console.error(`[awardPoints] Error while persisting points to Firestore:`, err);
              });

          }).catch((err: any) => {
              console.error(`[awardPoints] Failed to import firestore modules:`, err);
          });
      } else {
          console.warn(`[awardPoints] No authenticated user. Points ${points} added locally only.`);
      }

      setTimeout(() => {
          if (historyChanged) {
              updateUser({}, newHistory); 
          }
      }, 0);

      if (historyChanged) {
          return { ...prev, workoutHistory: newHistory, user: { ...prev.user, points: newPoints }}; 
      }
      return { ...prev, user: { ...prev.user, points: newPoints }};
    });
  }, [updateUser]);

   const syncLogsToFirestore = useCallback((updatedLogs: Partial<AppLogsState>) => {
    if (auth.currentUser) {
        const today = getTodayStr();
        const logsRefPath = `users/${auth.currentUser.uid}/daily_logs/${today}`;
        
        // Add to a background sync queue for the logs document
        Object.assign(pendingLogUpdatesRef.current, updatedLogs);
        
        if (syncLogTimerRef.current) {
            clearTimeout(syncLogTimerRef.current);
        }
        syncLogTimerRef.current = setTimeout(async () => {
            const updatesToPush = { ...pendingLogUpdatesRef.current };
            pendingLogUpdatesRef.current = {};
            if (Object.keys(updatesToPush).length === 0) return;

            try {
                const { doc, setDoc } = await import('firebase/firestore');
                const logRef = doc(db, logsRefPath);
                // We use setDoc with merge to ensure the document exists and fields are updated
                await setDoc(logRef, { ...updatesToPush, userId: auth.currentUser!.uid, date: today, updatedAt: new Date().toISOString() }, { merge: true });
                console.log(`[syncLogsToFirestore] Successfully synced user-submitted logs to ${logsRefPath}`);
            } catch (err) {
                console.error('Failed to sync logs to firestore', err);
            }
        }, 2000);
    }
  }, []);

  const addSteps = useCallback((steps: number) => {
    setLogsState(prev => {
      const today = getTodayStr();
      const newSteps = prev.dailySteps + steps;
      syncLogsToFirestore({ dailySteps: newSteps, lastCheckInDate: today, lastStepsReset: today });
      return { ...prev, dailySteps: newSteps };
    });
    showToast(`Steps recorded! Total: ${logsState.dailySteps + steps}`, "success");
  }, [logsState.dailySteps, showToast, syncLogsToFirestore]);

  const resetDailySteps = useCallback(() => {
    setLogsState(prev => {
      const today = getTodayStr();
      syncLogsToFirestore({ dailySteps: 0, lastCheckInDate: today, lastStepsReset: today });
      return { ...prev, dailySteps: 0 };
    });
    // Silent reset usually doesn't need toast unless requested
  }, [syncLogsToFirestore]);

  const addWater = useCallback((amountMl: number) => {
    setLogsState(prev => {
       const today = getTodayStr();
       const newWaterIntake = [...prev.waterIntake, { date: today, amountMl }];
       syncLogsToFirestore({ waterIntake: newWaterIntake, lastCheckInDate: today });
       return { ...prev, waterIntake: newWaterIntake };
    });
    showToast(`Hydration logged: +${amountMl}ml`, "success");
  }, [showToast, syncLogsToFirestore]);

  const addMeal = useCallback((mealData: Omit<import('../types').Meal, 'id' | 'date' | 'time'>) => {
    setLogsState(prev => {
       const today = getTodayStr();
       const newMeal: import('../types').Meal = {
          ...mealData,
          id: Date.now().toString(),
          date: today,
          time: new Date().toISOString(),
          type: 'food' 
       };
       const newMeals = [...prev.meals, newMeal];
       syncLogsToFirestore({ meals: newMeals, lastCheckInDate: today });
       return { ...prev, meals: newMeals };
    });
    // Toast is already handled in Diet.tsx, but we can double-guard here if needed
  }, [syncLogsToFirestore]);

  const removeMeal = useCallback((id: string) => {
    setLogsState(prev => {
       const newMeals = prev.meals.filter(m => m.id !== id);
       syncLogsToFirestore({ meals: newMeals });
       return { ...prev, meals: newMeals };
    });
  }, []);

  const addSleepLog = useCallback((action: 'sleep' | 'wake') => {
    setLogsState(prev => {
      const logs = prev.sleepLogs || [];
      const newLogs = [...logs, { time: new Date().toISOString(), action }];
      syncLogsToFirestore({ sleepLogs: newLogs });
      return { ...prev, sleepLogs: newLogs };
    });
    showToast(`${action === 'sleep' ? 'Good night!' : 'Welcome back!'} Time logged.`, "info");
  }, [showToast, syncLogsToFirestore]);

  const addMoodLog = useCallback((status: 'Tired' | 'Normal' | 'Motivated') => {
    setLogsState(prev => {
       const today = getTodayStr();
       const logs = prev.moods || [];
       const newLogs = [...logs, { date: today, time: new Date().toISOString(), status }];
       syncLogsToFirestore({ moods: newLogs, lastCheckInDate: today });
       return { ...prev, moods: newLogs };
    });
    // Toast is handled in Dashboard.tsx
  }, [syncLogsToFirestore]);

  const addSupplementLog = useCallback((log: Omit<import('../types').SupplementLog, 'id' | 'date' | 'time'>) => {
    setLogsState(prev => {
      const today = getTodayStr();
      const newLog = {
        ...log,
        id: Date.now().toString(),
        date: today,
        time: new Date().toISOString()
      };
      const logs = prev.supplementLogs || [];
      const newLogs = [...logs, newLog];
      syncLogsToFirestore({ supplementLogs: newLogs });
      return { ...prev, supplementLogs: newLogs };
    });
    showToast(`${log.name} logged.`, "success");
  }, [showToast, syncLogsToFirestore]);

  const removeSupplementLog = useCallback((id: string) => {
    setLogsState(prev => {
      const newLogs = (prev.supplementLogs || []).filter(l => l.id !== id);
      syncLogsToFirestore({ supplementLogs: newLogs });
      return { ...prev, supplementLogs: newLogs };
    });
  }, [syncLogsToFirestore]);

  const updateAIRecovery = useCallback((aiData: { score: number, status: string, recommendation: string }) => {
    setLogsState(prev => {
      const newAiRecovery = {
        ...aiData,
        timestamp: new Date().toISOString()
      };
      syncLogsToFirestore({ aiRecovery: newAiRecovery });
      return { ...prev, aiRecovery: newAiRecovery };
    });
  }, [syncLogsToFirestore]);

  const clearRecentBadges = useCallback((badgeId?: string) => {
    if (badgeId) {
      setRecentBadges(prev => prev.filter(b => b.id !== badgeId));
    } else {
      setRecentBadges([]);
    }
  }, []);

  const clearRecentRewards = useCallback((id?: string) => {
    if (id) {
      setRecentRewards(prev => prev.filter(r => r.id !== id));
    } else {
      setRecentRewards([]);
    }
  }, []);

  const triggerBadgeCelebration = useCallback((badges: BadgeDef[]) => {
    setRecentBadges(prev => [...prev, ...badges]);
  }, []);

  const computedMacros = useMemo(() => {
    return calculateMacros(state.user);
  }, [
    state.user.weight,
    state.user.height,
    state.user.dateOfBirth,
    state.user.gender,
    state.user.workoutFrequency,
    state.user.goal,
    state.user.goalSpeed,
    state.user.calorieGoal,
    state.user.goals?.dailyCalories,
    state.user.macros?.protein,
    state.user.macros?.carbs,
    state.user.macros?.fats,
  ]);

  const computedStreak = useMemo(() => {
    if (!state.workoutHistory || state.workoutHistory.length === 0) return 0;
    
    // Sort in descending order to process from newest to oldest
    const sortedHistory = [...state.workoutHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstWorkoutDate = new Date(sortedHistory[0].date);
    firstWorkoutDate.setHours(0, 0, 0, 0);

    // If the most recent workout is older than yesterday, streak is 0
    const diffDaysFirst = Math.floor((today.getTime() - firstWorkoutDate.getTime()) / (1000 * 3600 * 24));
    if (diffDaysFirst > 1) {
       return 0;
    }

    let expectedDate = firstWorkoutDate;
    
    for (const record of sortedHistory) {
      if (!record.completed) continue;
      
      const d = new Date(record.date);
      d.setHours(0, 0, 0, 0);
      
      const diffExpected = Math.floor((expectedDate.getTime() - d.getTime()) / (1000 * 3600 * 24));
      
      if (diffExpected === 0) {
        // Same day as expected
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1); // Expect a workout yesterday
      } else if (diffExpected > 0) {
        // A gap in the streak
        break;
      }
    }
    
    return currentStreak;
  }, [state.workoutHistory]);

  const userRank = useMemo(() => {
    if (!state.leaderboard || state.leaderboard.length === 0 || !auth.currentUser) return null;
    
    // Merge local user points into leaderboard view for instant feedback
    const mergedLeaderboard = state.leaderboard.map(l => 
      l.id === auth.currentUser?.uid ? { ...l, points: (state.user.points || 0) } : l
    );
    
    const sorted = [...mergedLeaderboard].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(l => l.id === auth.currentUser?.uid);
    return index !== -1 ? index + 1 : null;
  }, [state.leaderboard, state.user.points]);

  const setIsDataLoading = useCallback((loading: boolean) => setState(prev => ({ ...prev, isDataLoading: loading })), []);

  const contextValue = React.useMemo(() => ({
    ...state,
    user: { ...state.user, ...computedMacros },
    streak: Math.max(state.streak, computedStreak),
    selectedDate,
    setSelectedDate,
    updateUser,
    updateWorkoutSchedule,
    setOnboardingCompleted,
    setDisciplineMode,
    setTheme,
    awardPoints,
    addSteps,
    resetDailySteps,
    addWater,
    addMeal,
    removeMeal,
    addSleepLog,
    addMoodLog,
    addSupplementLog,
    removeSupplementLog,
    updateAIRecovery,
    recentBadges,
    clearRecentBadges,
    recentRewards,
    clearRecentRewards,
    userRank,
    triggerBadgeCelebration,
    setServerState,
    setIsDataLoading,
    currentDateStr,
    toast,
    showToast,
    hideToast
  }), [
    state,
    selectedDate,
    computedMacros,
    computedStreak,
    updateUser,
    updateWorkoutSchedule,
    setOnboardingCompleted,
    setDisciplineMode,
    setTheme,
    awardPoints,
    addSteps,
    resetDailySteps,
    addWater,
    addMeal,
    removeMeal,
    addSleepLog,
    addMoodLog,
    addSupplementLog,
    removeSupplementLog,
    updateAIRecovery,
    recentBadges,
    clearRecentBadges,
    recentRewards,
    clearRecentRewards,
    userRank,
    triggerBadgeCelebration,
    setServerState,
    setIsDataLoading,
    currentDateStr,
    toast,
    showToast,
    hideToast
  ]);

  return (
    <AppContext.Provider value={contextValue}>
       <AppLogsContext.Provider value={logsState}>
         {children}
       </AppLogsContext.Provider>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

export const useAppLogs = () => {
  const ctx = useContext(AppLogsContext);
  if (!ctx) throw new Error('useAppLogs must be used within AppProvider');
  return ctx;
};
