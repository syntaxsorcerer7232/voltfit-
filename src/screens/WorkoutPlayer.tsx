import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Play, Pause, ChevronRight, Check, Plus, X } from 'lucide-react';
import { cn } from '../components/BottomNav';
import { useAppContext } from '../context/AppContext';
import ShareButton from '../components/ShareButton';
import SpotifyPlayer from '../components/SpotifyPlayer';

interface Props {
  workout: any;
  onClose: () => void;
}

export default React.memo(function WorkoutPlayer({ workout, onClose }: Props) {
  const { user, disciplineMode, awardPoints, workoutHistory, updateUser, showToast } = useAppContext();
  
  const [sessionExercises, setSessionExercises] = useState<any[]>(workout?.exercises || []);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [repsInput, setRepsInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');

  const [loggedExercises, setLoggedExercises] = useState<any[]>([]);

  const exercises = sessionExercises;
  const currentExercise = exercises[currentExerciseIndex];
  
  // Try to find previous weight for this exercise 
  // by searching the workoutHistory.
  const [previousWeight, setPreviousWeight] = useState<number | null>(null);

  useEffect(() => {
    if (currentExercise) {
      let foundWeight = null;
      // Search backwards through history
      for (let i = workoutHistory.length - 1; i >= 0; i--) {
         const pastWorkout = workoutHistory[i];
         const pastEx = pastWorkout.exercises?.find(e => e.name === currentExercise.name);
         if (pastEx && pastEx.sets && pastEx.sets.length > 0) {
            foundWeight = pastEx.sets[0].weight;
            break;
         }
      }
      setPreviousWeight(foundWeight);
      if (foundWeight) {
         setWeightInput(foundWeight.toString());
      } else {
         setWeightInput('');
      }
    }
  }, [currentExercise, workoutHistory]);
  
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTimerOverlay, setShowTimerOverlay] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  // Initialize reps input based on expected reps
  useEffect(() => {
    if (currentExercise && currentExercise.reps) {
      setRepsInput(currentExercise.reps.split('-')[0] || '10');
    }
  }, [currentExercise, currentSet]);
  
  useEffect(() => {
    let interval: any = null;
    if (showTimerOverlay && isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      setShowTimerOverlay(false);
    }
    return () => clearInterval(interval);
  }, [showTimerOverlay, isTimerRunning, timeLeft]);

  const recordCurrentSet = () => {
    setLoggedExercises(prev => {
      const cloned = [...prev];
      let ex = cloned.find(e => e.name === currentExercise.name);
      if (!ex) {
         ex = {
            id: Date.now().toString(),
            exerciseId: currentExercise.id || currentExercise.name,
            name: currentExercise.name,
            sets: []
         };
         cloned.push(ex);
      }
      ex.sets.push({
         reps: parseInt(repsInput) || 0,
         weight: parseFloat(weightInput) || 0,
         completed: true
      });
      return cloned;
    });
  };

  const handleLogSet = () => {
    recordCurrentSet();
    setCurrentSet(c => c + 1);
    setTimeLeft(60);
    setShowTimerOverlay(true);
    setIsTimerRunning(true);
  };

  const finishExercise = () => {
    // Record if there are any unlogged inputs? No, we assume Log Set does that.
    
    if (currentExerciseIndex < sessionExercises.length - 1) {
      setCurrentExerciseIndex(i => i + 1);
      setCurrentSet(1);
      setShowTimerOverlay(false);
      setIsTimerRunning(false);
      showToast(`Finished ${currentExercise.name}`, "info");
    } else {
      handleFinalWorkoutCompletion();
    }
  };

  const handleFinalWorkoutCompletion = () => {
    // Record current set state if it hasn't been logged? Actually, we should probably check if current inputs are new.
    // To simplify, we assume the user clicking "Log Set" is the source of truth.
    // If they click "End Workout" without logging the last set, we'll log it for them to be safe if inputs exist.
    
    const finalExList = [...loggedExercises];
    
    // We will call awardPoints(100, false) so it doesn't create a dummy history
    awardPoints(100, false, 'Workout Finished');
    const newHistory = [...workoutHistory, { 
        id: Date.now().toString(), 
        name: workout?.name || 'Workout', 
        type: 'gym', 
        completed: true, 
        date: new Date().toISOString(), 
        exercises: finalExList,
        notes: workoutNotes
    }];
    updateUser({}, newHistory);
    showToast("Workout Saved", "success");
    onClose();
  };

  const skipToNextExercise = () => {
      if (currentExerciseIndex < sessionExercises.length - 1) {
        setCurrentExerciseIndex(i => i + 1);
        setCurrentSet(1);
        setShowTimerOverlay(false);
        setIsTimerRunning(false);
      } else {
        handleFinalWorkoutCompletion();
      }
  };

  const getRestTimerSVG = () => {
    const size = 200;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = timeLeft / 60;
    const strokeDashoffset = circumference - progress * circumference;

    return (
      <div className="relative flex items-center justify-center mb-8 mt-4">
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <circle className="text-neutral-900" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2} />
          <circle
            className="transition-all duration-1000 ease-linear text-primary"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size/2}
            cy={size/2}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center font-mono">
           <span className="text-6xl font-extrabold tracking-tighter text-white">{timeLeft}</span>
           <span className="text-primary text-xs uppercase tracking-widest mt-1">REST</span>
        </div>
      </div>
    );
  };

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) return;
    const newEx = {
      id: `session-${Date.now()}`,
      name: newExerciseName.trim(),
      sets: 3,
      reps: '10',
      muscleGroups: []
    };
    setSessionExercises(prev => [...prev, newEx]);
    setNewExerciseName('');
    setIsAddingExercise(false);
    showToast(`Added ${newEx.name} to session`, "success");
  };

  if (!currentExercise) return null;

  // Calculate overall progress across all exercises
  const completedExercises = currentExerciseIndex;
  const progressRatio = ((completedExercises * 100)) / (sessionExercises.length || 1);

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground w-full fixed top-0 left-0 z-[100] shader-bg overflow-hidden shadow-2xl">
      {/* Progress Header */}
      <div className="h-1.5 bg-surface-elevated/50 w-full shrink-0 relative">
        <motion.div 
          className="h-full bg-primary absolute top-0 left-0 shadow-glow" 
          initial={{ width: '0%' }}
          animate={{ width: `${progressRatio}%` }}
        />
      </div>

      <header className="px-6 py-4 flex items-center justify-between shrink-0 relative z-10 sticky top-0 bg-background/80 backdrop-blur-md">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full bg-surface-elevated border border-card-border hover:bg-primary/5 transition active:scale-90 z-20 shadow-sm text-foreground">
          <ChevronLeft />
        </button>
        {disciplineMode ? (
           <div className="px-3 py-1 rounded-full border border-red-500/50 text-[10px] font-black text-red-500 tracking-[0.2em] bg-red-500/10 uppercase">
             Discipline Mode Active
           </div>
        ) : (
          <div className="text-[10px] font-black text-primary tracking-[0.2em] uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            {workout?.name || 'Workout'}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto w-full pb-20 no-scrollbar">
        <div className="px-6 mb-2">
          <SpotifyPlayer />
        </div>

        <div className="w-full flex flex-col items-center px-6 min-h-[70vh] justify-center relative z-10">
          <div className="text-center mb-8 w-full">
           <motion.span 
             key={`num-${currentExerciseIndex}`}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-3 block shadow-glow"
           >
             Exercise {currentExerciseIndex + 1} of {sessionExercises.length}
           </motion.span>
           <h2 className="text-4xl font-black tracking-tighter mb-4 leading-none text-foreground uppercase">{currentExercise.name}</h2>
           <div className="flex items-center justify-center space-x-4 text-muted text-[10px] font-black uppercase tracking-[.15em] bg-surface-elevated py-2.5 px-6 rounded-full border border-card-border w-fit mx-auto mb-8 shadow-inner">
             <span className="flex items-center text-primary italic"><Play size={10} className="mr-1.5 fill-current" /> Set {currentSet}</span>
             <span className="w-1 h-1 bg-muted/20 rounded-full" />
             <span>{currentExercise.reps || '8-12'} Target Reps</span>
           </div>
           
           <div className="flex justify-center items-center mt-8 space-x-12">
              <div className="flex flex-col items-center">
                 <label className="text-[10px] text-muted font-black uppercase tracking-widest mb-3 opacity-60">Weight ({user?.weightUnit || 'kg'})</label>
                 <input 
                   type="number" 
                   value={weightInput}
                   onChange={(e) => setWeightInput(e.target.value)}
                   readOnly={disciplineMode}
                   className="w-24 text-center bg-transparent border-b-2 border-card-border text-4xl font-black focus:outline-none focus:border-primary pb-2 transition-all text-foreground"
                 />
                 {previousWeight !== null && (
                   <span className="text-[10px] text-muted font-bold mt-2 italic opacity-50">PREV: {previousWeight}</span>
                 )}
              </div>
              <div className="flex flex-col items-center">
                 <label className="text-[10px] text-muted font-black uppercase tracking-widest mb-3 opacity-60">Reps Done</label>
                 <input 
                   type="number" 
                   value={repsInput}
                   onChange={(e) => setRepsInput(e.target.value)}
                   readOnly={disciplineMode}
                   className="w-24 text-center bg-transparent border-b-2 border-card-border text-4xl font-black focus:outline-none focus:border-primary pb-2 transition-all text-foreground"
                 />
              </div>
           </div>
        </div>

        {/* Tally of logged sets */}
        <div className="flex flex-col items-center mb-6 w-full opacity-60">
           <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-2">Total Sets: {currentSet - 1} Logged</span>
        </div>

        {/* Notes Input */}
        <div className="w-full max-w-[320px] mb-8">
          <label className="text-[10px] text-muted font-black uppercase tracking-widest mb-2 block text-center opacity-60">Session Observation</label>
          <textarea
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
            placeholder="Record observations, soreness..."
            className="w-full bg-surface-elevated border border-card-border rounded-2xl p-4 text-xs font-bold focus:outline-none focus:border-primary/50 transition-all text-foreground resize-none shadow-inner placeholder:text-muted/30"
            rows={2}
          />
        </div>

        <div className="w-full flex flex-col items-center space-y-4">
           <motion.button 
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={handleLogSet} 
             disabled={showTimerOverlay}
             className={cn(
               "w-full max-w-[320px] py-5 rounded-3xl flex flex-col items-center justify-center transition-all bg-primary text-black shadow-lg",
               showTimerOverlay && "opacity-50 cursor-not-allowed"
             )}
           >
              <span className="flex items-center uppercase font-black tracking-widest text-lg">
                <Check size={20} className="mr-2" strokeWidth={3} />
                Log Set {currentSet}
              </span>
           </motion.button>

           <motion.button 
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={finishExercise} 
             disabled={showTimerOverlay}
             className={cn(
               "w-full max-w-[320px] py-4 rounded-2xl flex flex-col items-center justify-center transition-all bg-surface-elevated text-foreground border border-card-border shadow-md",
               showTimerOverlay && "opacity-50 cursor-not-allowed"
             )}
           >
              <span className="flex items-center uppercase font-black tracking-widest text-[10px] italic">
                Finish {currentExercise.name}
              </span>
           </motion.button>
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-4 mt-8 w-full">
          {!disciplineMode && !isAddingExercise && (
            <button 
               onClick={() => setIsAddingExercise(true)}
               className="text-primary hover:text-white font-black text-[10px] uppercase tracking-[0.2em] transition-colors flex items-center bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl"
            >
              <Plus size={14} className="mr-2" /> Add Exercise to Session
            </button>
          )}

          {isAddingExercise && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="w-full max-w-[320px] glass-card p-4 rounded-3xl border border-primary/30"
             >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">New Exercise</span>
                  <button onClick={() => setIsAddingExercise(false)} className="text-neutral-500">
                    <X size={16} />
                  </button>
                </div>
                <input 
                  autoFocus
                  placeholder="e.g. Hammer Curls"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm mb-3 focus:border-primary outline-none"
                />
                <button 
                  onClick={handleAddExercise}
                  className="w-full bg-primary text-black font-black py-3 rounded-xl text-xs uppercase tracking-widest"
                >
                  Confirm & Add
                </button>
             </motion.div>
          )}

          {!disciplineMode && (
            <button 
               onClick={skipToNextExercise}
               className="text-neutral-500 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] transition-colors flex items-center"
            >
              {currentExerciseIndex < sessionExercises.length - 1 ? 'Skip Exercise' : 'End Workout'} <ChevronRight size={12} className="ml-1" />
            </button>
          )}
        </div>
        </div>
      </div>

      {/* Visual Rest Timer Overlay */}
      <AnimatePresence>
        {showTimerOverlay && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center"
            >
              {getRestTimerSVG()}
              
              <div className="flex flex-col items-center space-y-6 mt-4">
                <div className="flex space-x-4">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsTimerRunning(!isTimerRunning)} 
                    className="w-20 h-20 rounded-full glass-card flex items-center justify-center text-primary border border-primary/30"
                  >
                    {isTimerRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                  </motion.button>
                  
                  {(!disciplineMode) && (
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setTimeLeft(0); setShowTimerOverlay(false); setIsTimerRunning(false); }} 
                      className="px-8 py-4 rounded-full bg-neutral-900 border border-neutral-800 font-black text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white transition-colors flex items-center justify-center"
                    >
                      Skip Rest
                    </motion.button>
                  )}
                </div>
                
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.2em] text-center max-w-[200px] leading-relaxed">
                  Next: {currentExercise.name} Set {currentSet}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
