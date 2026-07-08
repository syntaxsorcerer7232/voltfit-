import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Edit2, Play, Activity, History, Calendar as CalendarIcon, User } from 'lucide-react';
import { cn } from '../components/BottomNav';
import WorkoutSplitEditor from './WorkoutSplitEditor';
import WorkoutPlayer from './WorkoutPlayer';
import WorkoutLogs from './WorkoutLogs';
import Insights from './Insights';
import MonthlyCalendarView from '../components/MonthlyCalendarView';
import AIRecommendations from '../components/AIRecommendations';
import ErrorBoundary from '../components/ErrorBoundary';
import AnatomyGuide from '../components/AnatomyGuide';

export default React.memo(function Workouts() {
  const { workoutSchedule, streak, workoutHistory, currentDateStr } = useAppContext();
  const [view, setView] = useState<'list' | 'editor' | 'player' | 'logs' | 'insights' | 'calendar'>('list');
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [showAnatomy, setShowAnatomy] = useState(false);

  const isWorkoutComplete = workoutHistory.some(w => w.date.startsWith(currentDateStr));

  if (view === 'editor') return <WorkoutSplitEditor onClose={() => setView('list')} />;
  if (view === 'player' && activeWorkout) return <WorkoutPlayer workout={activeWorkout} onClose={() => setView('list')} />;
  if (view === 'logs') return <WorkoutLogs onClose={() => setView('list')} />;
  if (view === 'insights') return <Insights onClose={() => setView('list')} />;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();

  // Mock schedule if empty
  const schedule = (workoutSchedule.mode === 'custom' && workoutSchedule.custom.length) ? workoutSchedule.custom : weekDays.map((name, i) => ({
    weekday: i,
    name: name,
    isRest: i === 0 || i === 3, // Rest on Sun, Wed
    muscleGroups: i === 1 ? ['Chest', 'Triceps'] : i === 2 ? ['Back', 'Biceps'] : i === 4 ? ['Legs'] : i === 5 ? ['Shoulders'] : i === 6 ? ['Full Body'] : [],
    exercises: [
      { id: '1', name: 'Bench Press', sets: 4, reps: '8-12', muscleGroups: ['Chest'] },
      { id: '2', name: 'Overhead Press', sets: 3, reps: '8-12', muscleGroups: ['Shoulders'] }
    ]
  }));

  const todayWorkout = schedule.find(day => day.weekday === today);

  return (
    <div className="flex flex-col flex-1 space-y-4 pt-safe px-4 pb-32">
      <header className="pt-6 flex justify-between items-end pb-2">
        <div>
          <span className="text-secondary tracking-widest text-[10px] font-mono uppercase bg-secondary/10 px-2 py-0.5 rounded border border-secondary/30">
            {workoutSchedule.mode === 'default' ? 'Default Split' : 'Custom Split'}
          </span>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200 mt-1">Training</h1>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setView(view === 'calendar' ? 'list' : 'calendar')} className={cn("w-10 h-10 border border-card-border bg-surface-elevated rounded-full flex justify-center items-center transition-all shadow-md active:scale-90", view === 'calendar' ? 'border-primary text-primary bg-primary/10 shadow-glow' : 'text-muted hover:text-primary')}>
             <CalendarIcon size={18} />
          </button>
          <button onClick={() => setView('logs')} className="w-10 h-10 border border-card-border bg-surface-elevated rounded-full flex justify-center items-center text-muted hover:text-primary transition-all shadow-md active:scale-90">
             <History size={18} />
          </button>
          <button onClick={() => setView('editor')} className="w-10 h-10 border border-card-border bg-surface-elevated rounded-full flex justify-center items-center text-muted hover:text-primary transition-all shadow-md active:scale-90">
             <Edit2 size={18} />
          </button>
        </div>
      </header>
      
      {/* Telemetry Row inline */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => setView('insights')}
          className="bg-surface-elevated/40 rounded-2xl p-4 border border-card-border flex flex-col justify-center cursor-pointer hover:bg-surface-elevated transition-all shadow-lg group"
        >
          <div className="flex items-center mb-2">
            <Activity className="text-primary mr-2 group-hover:scale-110 transition-transform" size={18} />
            <div className="font-black text-xs uppercase tracking-tight italic text-foreground">Insights</div>
          </div>
          <div className="text-[9px] text-muted font-black uppercase tracking-widest opacity-50 italic">Analyze Combat Metrics</div>
          <div className="text-primary font-black font-mono text-xl italic shadow-glow mt-1">+{streak}</div>
        </div>

        <div 
          onClick={() => setShowAnatomy(true)}
          className="bg-surface-elevated/40 rounded-2xl p-4 border border-card-border flex flex-col justify-center cursor-pointer hover:bg-surface-elevated transition-all shadow-lg group"
        >
          <div className="flex items-center mb-2">
            <User className="text-[#00D1FF] mr-2 group-hover:scale-110 transition-transform" size={18} />
            <div className="font-black text-xs uppercase tracking-tight italic text-foreground">Anatomy Guide</div>
          </div>
          <div className="text-[9px] text-muted font-black uppercase tracking-widest opacity-50 italic">Interactive 3D Muscle Map</div>
        </div>
      </div>

      {view === 'calendar' ? (
         <MonthlyCalendarView />
      ) : (
        <div className="space-y-6 md:space-y-8">
          <div className="flex justify-between items-center px-1">
             <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-muted opacity-40 italic">Weekly Transmission Protocol</h2>
          </div>
          
          <div className="flex flex-col space-y-6 md:space-y-8 md:px-4">
            {schedule.map((day, i) => {
              const isToday = today === day.weekday;
              return (
                <div key={i} className={cn(
                  "bg-surface-elevated/40 rounded-[2rem] p-7 md:p-12 border relative overflow-hidden flex flex-col transition-all duration-500 shadow-xl", 
                  isToday ? 'border-primary shadow-[0_0_30px_rgba(132,204,22,0.2)]' : 'border-card-border'
                )}>
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-6">
                      <span className={cn("text-2xl md:text-4xl font-black tracking-tighter uppercase italic", isToday ? 'text-primary grayscale-0' : 'text-foreground grayscale opacity-40')}>
                        {weekDays[day.weekday]}
                      </span>
                      <span className={cn(
                        "text-[9px] md:text-[10px] font-black uppercase px-3 py-1.5 rounded-full border tracking-[0.2em] italic", 
                        day.isRest ? 'bg-surface-elevated border-card-border text-muted opacity-40' : 'bg-primary/20 border-primary/30 text-primary shadow-glow'
                      )}>
                        {day.isRest ? 'RECOVERY' : 'TRAINING'}
                      </span>
                    </div>
                  </div>

                  {!day.isRest ? (
                    <div className="flex flex-col">
                      <div className="flex flex-wrap gap-3 mb-8">
                        {day.muscleGroups.map(m => (
                          <span key={m} className="text-[10px] md:text-xs bg-background border border-card-border rounded-xl px-4 py-2 font-black uppercase tracking-widest text-muted italic">
                            {m}
                          </span>
                        ))}
                      </div>
                      
                      <div className="mb-8">
                         <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-5 px-1 opacity-40 italic">Workout Routine</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                            {day.exercises.map((ex, idx) => (
                              <div key={idx} className="flex items-center text-[11px] md:text-sm text-foreground/70 font-black uppercase tracking-tight italic group">
                                <span className={cn("w-2 h-0.5 mr-3 transition-all", isToday ? "bg-primary" : "bg-muted")}></span>
                                <span className="truncate group-hover:text-primary transition-colors">{ex.name}</span>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="mt-4 pt-8 border-t border-card-border/30">
                        {isToday ? (
                          isWorkoutComplete ? (
                            <div className="w-full bg-primary/10 border border-primary/30 text-primary font-black py-4 md:py-6 rounded-2xl flex items-center justify-center uppercase tracking-[0.3em] text-[10px] md:text-sm italic border-dashed shadow-glow">
                               ✓ WORKOUT COMPLETE
                            </div>
                          ) : (
                            <button 
                              onClick={() => { setActiveWorkout(day); setView('player'); }} 
                              className="w-full bg-foreground text-background font-black py-5 md:py-8 rounded-[2rem] flex items-center justify-center uppercase tracking-[0.15em] text-xs md:text-lg shadow-2xl active:scale-95 transition-all italic hover:scale-[1.02]"
                            >
                              <Play size={20} className="mr-3" fill="currentColor" strokeWidth={3} />
                              Start Workout
                            </button>
                          )
                        ) : (
                          <div className="text-center py-2">
                             <span className="text-[10px] md:text-xs font-black uppercase text-muted tracking-[0.3em] italic opacity-30">Upcoming Workout</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-12 md:p-20 group">
                       <Activity size={64} className="text-muted/20 mb-6 group-hover:text-primary/20 transition-colors" strokeWidth={1} />
                       <p className="text-sm md:text-2xl text-foreground font-black uppercase tracking-tighter italic opacity-20">Rest & Recovery</p>
                       <p className="text-[9px] md:text-[10px] text-muted mt-3 uppercase tracking-[0.4em] font-black italic opacity-20">Letting muscles repair and rebuild</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {!todayWorkout?.isRest && todayWorkout && todayWorkout.muscleGroups.length > 0 && (
         <div className="pt-2">
           <ErrorBoundary>
             <AIRecommendations activeFocus={todayWorkout.muscleGroups} />
           </ErrorBoundary>
         </div>
      )}
      
      <AnatomyGuide isOpen={showAnatomy} onClose={() => setShowAnatomy(false)} />
    </div>
  );
});
