import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext, useAppLogs } from '../context/AppContext';
import { Zap, Activity, Droplets, Utensils, Play, Plus, Flame, Award, Share2, Download, Trophy, Crown, ShieldCheck } from 'lucide-react';
import RingProgress from '../components/RingProgress';
import WaterIntakeCard from '../components/WaterIntakeCard';
import { cn } from '../components/BottomNav';
import Skeleton from '../components/Skeleton';
import { calculateRecovery } from '../utils/insightsCalculations';
import Leaderboard from '../components/Leaderboard';
import CommunityChallenges from '../components/CommunityChallenges';
import ShareButton from '../components/ShareButton'; // Keep for now or replace
import ShareSummaryModal from '../components/ShareSummaryModal';
import WorkoutPlayer from './WorkoutPlayer';
import { BADGES } from '../utils/gamification';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import ErrorBoundary from '../components/ErrorBoundary';
import HabitTracker from '../components/HabitTracker';

interface DashboardProps {
  navigate?: (tab: string) => void;
}

export default React.memo(function Dashboard({ navigate }: DashboardProps = {}) {
  const { user, disciplineMode, streak, workoutDiary, workoutHistory, workoutSchedule, addSleepLog, updateUser, addSteps, resetDailySteps, isDataLoading, addMoodLog, awardPoints, currentDateStr, userRank, showToast } = useAppContext();
  const { waterIntake, dailySteps, sleepLogs, moods, aiRecovery } = useAppLogs();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  
  // Calculate today's consumed calories & macros
  const { meals, supplementLogs } = useAppLogs();
  
  const todayStr = currentDateStr;
  const hasLoggedMoodToday = moods?.some((m: any) => m.date === todayStr);
  const hasCheckedInToday = user?.lastCheckInDate === todayStr;
  const hasCheckedInRef = useRef(false);

  useEffect(() => {
     if (!isDataLoading && !hasCheckedInToday && !hasCheckedInRef.current) {
        hasCheckedInRef.current = true; // immediately lock
        updateUser({ lastCheckInDate: todayStr });
        resetDailySteps();
        showToast("Welcome back! Your daily logs have been reset for the new day.", "info");
     }
  }, [isDataLoading, hasCheckedInToday, updateUser, resetDailySteps, todayStr, showToast]);

  const todayMeals = meals.filter((m: any) => m.date === todayStr);
  const consumedCalories = todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const consumedProtein = todayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
  
  const todayWater = waterIntake.filter((w: any) => w.date === todayStr).reduce((acc: number, log: any) => acc + log.amountMl, 0);

  const isWorkoutComplete = workoutHistory.some(w => w.date.startsWith(todayStr));
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDay = new Date().getDay();
  const schedule = (workoutSchedule.mode === 'custom' && workoutSchedule.custom.length) ? workoutSchedule.custom : weekDays.map((name, i) => ({
    weekday: i,
    name: name,
    isRest: i === 0 || i === 3,
    muscleGroups: i === 1 ? ['Chest', 'Triceps'] : i === 2 ? ['Back', 'Biceps'] : i === 4 ? ['Legs'] : i === 5 ? ['Shoulders'] : i === 6 ? ['Full Body'] : [],
    exercises: [
      { id: '1', name: 'Bench Press', sets: 4, reps: '8-12', muscleGroups: ['Chest'] },
      { id: '2', name: 'Overhead Press', sets: 3, reps: '8-12', muscleGroups: ['Shoulders'] }
    ]
  }));
  const todayWorkout = schedule.find(day => day.weekday === todayDay);
  
  const waterGoal = user?.waterIntakeGoal || 2000;
  const targetProtein = user?.proteinGoal || 150;

  const recoveryBase = calculateRecovery(workoutDiary, sleepLogs, supplementLogs);
  const recovery = useMemo(() => {
    if (aiRecovery && aiRecovery.timestamp.startsWith(todayStr)) {
      return {
        score: aiRecovery.score,
        status: aiRecovery.status,
        recommendation: aiRecovery.recommendation
      };
    }
    return recoveryBase;
  }, [aiRecovery, recoveryBase, todayStr]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (isDataLoading) {
    return (
      <div className="flex flex-col space-y-6 pt-safe pb-8 bg-transparent min-h-full">
         <header className="px-4 flex justify-between items-center my-4 mt-8">
            <div className="flex items-center space-x-3">
               <Skeleton className="w-12 h-12 rounded-full" />
               <div className="flex flex-col space-y-2">
                 <Skeleton className="w-24 h-3" />
                 <Skeleton className="w-40 h-6" />
               </div>
            </div>
         </header>

         <div className="px-4">
            <Skeleton className="w-full h-24" />
         </div>

         <div className="px-4 flex space-x-4 overflow-hidden">
            <Skeleton className="min-w-[140px] h-40" />
            <Skeleton className="min-w-[140px] h-40" />
            <Skeleton className="min-w-[140px] h-40" />
         </div>

         <div className="px-4 grid grid-cols-2 gap-4">
            <Skeleton className="w-full h-32" />
            <Skeleton className="w-full h-32" />
         </div>

         <div className="px-4">
            <Skeleton className="w-full h-40" />
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 space-y-6 pt-safe pb-32">
      
      {/* Header */}
      <ErrorBoundary>
      <header className="flex justify-between items-center px-4 pt-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-elevated border-2 border-primary/30 flex items-center justify-center shrink-0 shadow-lg">
             {user?.profilePicture ? <img src={user.profilePicture} alt="User" /> : <div className="text-xl font-black text-primary">{user?.name?.charAt(0) || 'U'}</div>}
          </div>
          <div className="flex flex-col relative w-full">
             <div className="flex items-center gap-2">
               <span className="text-muted text-[10px] font-black tracking-widest uppercase">{getGreeting()}</span>
             </div>
             <span className="text-xl font-extrabold text-foreground">{user?.name || 'Athlete'}</span>
             <div className="flex items-center mt-1 space-x-2">
                <div className="flex items-center bg-surface-elevated px-2 py-0.5 rounded-lg border border-card-border shadow-inner">
                   <span className="text-[10px] font-mono text-primary font-black uppercase tracking-tighter">{(user?.points || 0).toLocaleString()} PTS</span>
                </div>
                
                {userRank !== null && (
                   <div className={cn(
                     "flex items-center px-2 py-0.5 rounded border shadow-sm transition-all",
                     userRank === 1 
                       ? "bg-amber-500/10 text-amber-500 border-amber-500/30" 
                       : "bg-surface-elevated text-primary border-primary/20"
                   )}>
                      {userRank === 1 ? <Crown size={10} className="mr-1" /> : <Award size={10} className="mr-1" />}
                      <span className="text-[10px] font-black tracking-tighter">#{userRank}</span>
                   </div>
                )}
                {/* Removed the badges.length display to follow user request for clarity */}
             </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           <button onClick={() => setShowShareModal(true)} className="p-2 bg-surface-elevated text-muted rounded-full hover:bg-primary/10 hover:text-primary transition-all border border-card-border shadow-sm">
              <Share2 size={16} />
           </button>
           {disciplineMode && (
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1, textShadow: ['0 0 0px #ef4444', '0 0 10px #ef4444', '0 0 0px #ef4444'] }} transition={{ repeat: Infinity, duration: 2 }} className="px-2 py-1 rounded-md border border-red-500 text-[10px] font-bold text-red-500 tracking-widest bg-red-500/10">
               DISCIPLINE
             </motion.div>
           )}
        </div>
      </header>
      </ErrorBoundary>

      {/* Daily Check-In Prompt */}
      <AnimatePresence>
        {!hasLoggedMoodToday && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="px-4"
          >
            <div className="bg-surface-elevated p-6 rounded-[2.5rem] border border-primary/20 shadow-xl overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
              <h3 className="text-lg font-black tracking-tighter mb-4 italic uppercase">Status Transmission?</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Tired', emoji: '😴', points: 10 },
                  { label: 'Normal', emoji: '🙂', points: 10 },
                  { label: 'Motivated', emoji: '🔥', points: 10 }
                ].map(m => (
                  <button
                    key={m.label}
                    onClick={() => {
                      addMoodLog(m.label as any);
                      awardPoints(m.points, false, 'Daily Check-In');
                      showToast(`Mood logged: ${m.label}! +${m.points} points`, "success");
                    }}
                    className="bg-background hover:bg-primary/10 rounded-2xl py-4 flex flex-col items-center transition-all border border-card-border active:scale-95 group shadow-sm"
                  >
                    <span className="text-3xl mb-2 group-hover:scale-125 transition-transform">{m.emoji}</span>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest opacity-60">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 md:px-8 space-y-6">
        {/* Water & Recovery Grid */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {/* Water */}
          <ErrorBoundary>
            <WaterIntakeCard />
          </ErrorBoundary>

          {/* Recovery Info */}
          <ErrorBoundary>
            <div className="bg-surface-elevated/40 p-6 md:p-8 rounded-[2rem] border border-card-border flex flex-col h-full shadow-lg">
                <div className="flex items-center text-muted text-[10px] font-black uppercase tracking-widest mb-4 opacity-40">
                   <Activity size={16} className={cn("mr-2", recovery.score > 70 ? 'text-primary' : recovery.score > 40 ? 'text-orange-500' : 'text-red-500')} />
                   Recovery
                </div>
                
                <div className="flex items-end space-x-1 mt-1 mb-2">
                <span className="text-3xl md:text-4xl font-black italic tracking-tighter text-foreground">{recovery.score}</span>
                <span className="text-[10px] md:text-xs text-muted pb-1 uppercase font-black tracking-widest italic opacity-50">{recovery.status}</span>
              </div>

              <button 
                onClick={() => {
                  navigate?.('insights');
                }}
                className="mt-2 w-full py-3 bg-background border border-card-border rounded-xl hover:bg-primary/10 transition-all text-[10px] font-black text-foreground flex items-center justify-center uppercase tracking-widest active:scale-95 shadow-md italic">
                 Recap Analysis
              </button>

              <p className="text-[10px] md:text-xs text-muted font-black leading-tight mt-auto pt-3 border-t border-card-border/30 italic opacity-40">
                {recovery.recommendation}
              </p>
          </div>
        </ErrorBoundary>
      </div>

      {/* Steps Tracking */}
      <div className="flex flex-col">
        <ErrorBoundary>
        <div className="bg-surface-elevated rounded-[2.5rem] p-7 md:p-10 flex flex-col relative overflow-hidden border border-card-border shadow-2xl">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center text-muted text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">
               <Activity size={16} className="mr-1 text-primary shadow-glow" />Steps Tactical
             </div>
             <span className="text-[9px] md:text-[10px] font-black text-primary font-mono uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded border border-primary/20 shadow-glow">Goal: 10k</span>
           </div>
           
           <div className="text-4xl md:text-5xl font-black mb-1 flex items-end tracking-tighter text-foreground italic">
             {dailySteps} <span className="text-sm md:text-base text-muted font-black mb-1.5 ml-2 tracking-[0.2em] opacity-20">/ 10K TRANSMISSION</span>
           </div>

           {/* Progress Line */}
           <div className="w-full h-2.5 bg-background border border-card-border rounded-full my-6 overflow-hidden shadow-inner flex p-0.5">
             <motion.div className="h-full bg-primary rounded-full shadow-glow" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (dailySteps/10000)*100)}%` }} />
           </div>

           {/* Quick adds */}
           <div className="grid grid-cols-4 gap-3 mt-2">
             {[
               { label: '+100', val: 100 },
               { label: '+500', val: 500 },
               { label: '+1K', val: 1000 },
               { label: '+5K', val: 5000 }
             ].map(s => (
               <button 
                  key={s.val} 
                  onClick={() => addSteps(s.val)}
                  className="bg-background hover:bg-primary/10 border border-card-border hover:border-primary/30 rounded-xl py-3 text-[10px] md:text-xs font-black text-foreground transition-all active:scale-90 shadow-md grayscale hover:grayscale-0 italic"
               >
                  {s.label}
               </button>
             ))}
           </div>
        </div>
        </ErrorBoundary>
      </div>

        {/* Habit Tracker */}
        <div className="grid grid-cols-1 gap-4">
          <ErrorBoundary>
            <HabitTracker />
          </ErrorBoundary>
        </div>

         {/* Workout Launcher */}
        <div className="relative">
          <ErrorBoundary>
          <motion.div
             animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.1, 0.2, 0.1] }}
             transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
             className="absolute top-0 left-0 right-0 bottom-6 bg-primary/10 rounded-3xl blur-xl"
          />
          <motion.div 
             className="bg-surface-elevated/40 border border-card-border/50 rounded-[2.5rem] p-7 md:p-10 relative overflow-hidden backdrop-blur-3xl shadow-xl hover:border-primary/20 transition-all font-black uppercase italic"
             animate={{ 
               boxShadow: ["0px 0px 0px rgba(132,204,22,0)", "0px 0px 20px rgba(132,204,22,0.1)", "0px 0px 0px rgba(132,204,22,0)"],
               borderColor: ["rgba(132,204,22,0.1)", "rgba(132,204,22,0.3)", "rgba(132,204,22,0.1)"]
             }}
             transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
             <div className="absolute -right-4 -top-4 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
             <div className="relative z-10 flex flex-col h-full justify-between">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <div className="flex items-center space-x-2 mb-2">
                     <h3 className="text-xs md:text-sm font-bold text-muted uppercase tracking-widest flex items-center opacity-40">
                       <motion.div
                         animate={{ opacity: [1, 0.3, 1] }}
                         transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                         className="w-2.5 h-2.5 bg-primary rounded-full mr-2 shadow-glow"
                       />
                       Combat Phase
                     </h3>
                     <span className="bg-primary/20 text-primary border border-primary/30 text-[9px] md:text-[10px] px-2.5 py-1 rounded-full uppercase font-black italic">GYM</span>
                   </div>
                   <h4 className="text-2xl md:text-4xl font-black mb-1 italic tracking-tighter">
                     {todayWorkout?.isRest ? 'Biological Recovery' : todayWorkout?.name || 'Workout'}
                   </h4>
                   <p className="text-xs md:text-sm text-primary font-black uppercase italic opacity-60">
                     {todayWorkout?.isRest ? 'Halt Ops' : todayWorkout?.muscleGroups.join(' • ') || 'Various'}
                   </p>
                 </div>
                 <div className="text-right">
                   <span className="text-sm md:text-lg font-black text-foreground">{todayWorkout?.isRest ? 0 : todayWorkout?.exercises.length || 0}</span>
                   <span className="text-[10px] md:text-xs text-muted block leading-tight px-1 uppercase tracking-widest font-black italic opacity-20">UNITS</span>
                 </div>
               </div>
               
               {isWorkoutComplete ? (
                 <div className="w-full bg-primary/10 text-primary border border-primary/20 font-black py-4 md:py-6 rounded-2xl flex flex-col items-center justify-center gap-1 uppercase tracking-widest text-xs border-dashed">
                   <div className="flex items-center gap-2">
                     <Trophy size={20} className="text-primary shadow-glow" />
                     <span>MISSION ACCOMPLISHED</span>
                   </div>
                   <span className="text-[9px] opacity-40 normal-case font-black tracking-widest italic mt-1 uppercase">Daily workout completed. Recharge for tomorrow!</span>
                 </div>
               ) : !todayWorkout?.isRest ? (
                 <button 
                   onClick={() => setIsWorkoutActive(true)}
                   className="w-full bg-primary hover:bg-primary-dark text-black font-black py-4 md:py-6 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-[0.4em] text-xs transition-all active:scale-95 shadow-glow italic group">
                   START WORKOUT
                   <Play size={20} fill="currentColor" strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                 </button>
               ) : (
                 <div className="w-full bg-background/50 border border-card-border text-muted/30 font-black py-5 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-[0.4em] text-[10px] italic">
                   RECHARGE: REST DAY
                 </div>
               )}
             </div>
          </motion.div>
          </ErrorBoundary>
        </div>

        <div className="space-y-6">
          <ErrorBoundary>
            <Leaderboard currentUserId={auth.currentUser?.uid || ''} />
          </ErrorBoundary>
          
          <ErrorBoundary>
            <CommunityChallenges />
          </ErrorBoundary>
        </div>

        {/* Daily Missions */}
        <div className="flex flex-col">
          <ErrorBoundary>
            <div className="bg-surface-elevated/40 rounded-[2rem] border border-card-border p-6 md:p-8 flex flex-col h-full shadow-lg">
               <h3 className="text-[10px] md:text-xs text-muted font-black uppercase tracking-widest mb-6 opacity-30 italic">Today's Targets</h3>
               <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${todayWater >= waterGoal ? 'bg-primary text-black' : 'bg-background border border-card-border shadow-inner'}`}>
                        {todayWater >= waterGoal && <span className="text-xs font-black text-black">✓</span>}
                     </div>
                     <span className={`text-[11px] font-black uppercase tracking-widest italic ${todayWater >= waterGoal ? 'text-muted opacity-30 line-through' : 'text-foreground'}`}>Hydration: {waterGoal/1000}L Goal</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${consumedProtein >= targetProtein ? 'bg-primary text-black' : 'bg-background border border-card-border shadow-inner'}`}>
                        {consumedProtein >= targetProtein && <span className="text-xs font-black text-black">✓</span>}
                     </div>
                     <span className={`text-[11px] font-black uppercase tracking-widest italic ${consumedProtein >= targetProtein ? 'text-muted opacity-30 line-through' : 'text-foreground'}`}>Protein Target: {targetProtein}g</span>
                  </div>

                  <div className="flex items-center space-x-4">
                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isWorkoutComplete ? 'bg-primary text-black' : 'bg-background border border-card-border shadow-inner'}`}>
                        {isWorkoutComplete && <span className="text-xs font-black text-black">✓</span>}
                     </div>
                     <span className={`text-[11px] font-black uppercase tracking-widest italic ${isWorkoutComplete ? 'text-muted opacity-30 line-through' : 'text-foreground'}`}>Complete Workout</span>
                  </div>
               </div>
            </div>
          </ErrorBoundary>
        </div>

        {/* Streak Card */}
        <div className="pb-4">
          <ErrorBoundary>
            <div className="bg-orange-500/10 rounded-[2.5rem] p-6 md:p-10 border border-orange-500/30 flex flex-col items-center justify-center text-center relative overflow-hidden h-full min-h-[160px] shadow-lg shadow-orange-500/5 group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Flame size={160} className="text-orange-500" />
              </div>
              <Flame size={48} className="text-orange-500 mb-3 z-10 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)] animate-pulse" />
              <span className="text-3xl md:text-4xl font-black text-foreground tracking-tighter z-10 uppercase italic">{streak || 0} Day Cycle</span>
              <span className="text-[9px] text-orange-500 font-bold uppercase tracking-[0.3em] mt-3 z-10 opacity-60 italic">Momentum Synchronized</span>
            </div>
          </ErrorBoundary>
        </div>

      </div>

      <AnimatePresence>
        {showShareModal && (
          <ShareSummaryModal onClose={() => setShowShareModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isWorkoutActive && todayWorkout && (
          <WorkoutPlayer workout={todayWorkout} onClose={() => setIsWorkoutActive(false)} />
        )}
      </AnimatePresence>

    </div>
  );
});
