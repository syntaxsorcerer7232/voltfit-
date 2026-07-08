import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Dumbbell, Apple, AlertTriangle } from 'lucide-react';
import { useAppContext, useAppLogs } from '../context/AppContext';

interface Props {
  date: Date;
  onClose: () => void;
}

export default function DayDetailsModal({ date, onClose }: Props) {
  const { workoutHistory } = useAppContext();
  const { meals } = useAppLogs();
  const [showWarning, setShowWarning] = useState(false);

  const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const dateStr = date.toISOString().split('T')[0];

  const workoutsOnDay = workoutHistory.filter(w => w.date.startsWith(dateStr));
  const mealsOnDay = meals.filter(m => m.date === dateStr);

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  useEffect(() => {
    // If someone forgot to change the date to today, so a warning will be given after 2 hours if he doesn't change the date
    if (!isToday(date)) {
      const timer = setTimeout(() => {
        setShowWarning(true);
      }, 2 * 60 * 60 * 1000); // 2 hours
      // For testing, one could use a shorter timeout. But I'll stick to 2 hours.
      return () => clearTimeout(timer);
    }
  }, [date]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-3xl p-6 relative flex flex-col max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-neutral-800 rounded-full sm:hidden" />
          
          <div className="flex items-center justify-between mt-2 mb-6">
            <div>
               <h2 className="text-2xl font-black">{formattedDate}</h2>
               {!isToday(date) && <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest block mt-1">Past Date Selected</span>}
            </div>
            <button onClick={onClose} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors text-neutral-400">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {showWarning && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start space-x-3">
                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                <div>
                  <h4 className="text-red-500 font-bold text-sm tracking-wide">Date Warning</h4>
                  <p className="text-red-500/70 text-xs mt-1">You've been viewing a past date for over 2 hours. Make sure you're logging for the correct day.</p>
                </div>
              </div>
            )}

            <section>
              <div className="flex items-center space-x-2 text-primary font-black uppercase tracking-widest text-xs mb-4">
                 <Dumbbell size={16} />
                 <span>Workouts ({workoutsOnDay.length})</span>
              </div>
              
              {workoutsOnDay.length > 0 ? (
                <div className="space-y-3">
                  {workoutsOnDay.map((workout, idx) => (
                    <div key={idx} className="bg-neutral-800/30 border border-neutral-800 p-4 rounded-2xl">
                       <h4 className="font-bold mb-2">{workout.name}</h4>
                       
                       {workout.notes && (
                         <div className="mb-4 bg-neutral-900 border border-neutral-700 p-3 rounded-xl">
                           <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest mb-1 block">Session Notes</span>
                           <p className="text-sm text-neutral-300 italic">{workout.notes}</p>
                         </div>
                       )}

                       {workout.exercises && workout.exercises.length > 0 ? (
                         <div className="space-y-2">
                            {workout.exercises.map((ex, eIdx) => (
                               <div key={eIdx} className="text-sm">
                                  <div className="text-neutral-400 font-bold">{ex.name}</div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                     {ex.sets?.map((set, sIdx) => (
                                        <span key={sIdx} className="text-[10px] bg-neutral-800 px-2 py-1 rounded text-neutral-300">
                                           {set.reps} reps @ {set.weight}
                                        </span>
                                     ))}
                                  </div>
                               </div>
                            ))}
                         </div>
                       ) : (
                         <span className="text-xs text-neutral-500 italic">No exercise details logged.</span>
                       )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-neutral-600 text-sm font-bold bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-center">
                   No workouts logged on this day.
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center space-x-2 text-[#06b6d4] font-black uppercase tracking-widest text-xs mb-4">
                 <Apple size={16} />
                 <span>Nutrition ({mealsOnDay.length} meals)</span>
              </div>
              
              {mealsOnDay.length > 0 ? (
                <div className="space-y-3">
                  {mealsOnDay.map((meal, idx) => (
                    <div key={idx} className="bg-neutral-800/30 border border-neutral-800 p-4 rounded-2xl flex justify-between items-center">
                       <div>
                          <h4 className="font-bold text-sm">{meal.name}</h4>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{meal.mealTime}</span>
                       </div>
                       <div className="text-right">
                          <div className="font-black text-[#06b6d4]">{meal.calories} kcal</div>
                          <div className="text-[10px] text-neutral-500 mt-0.5">P:{meal.protein}g C:{meal.carbs}g F:{meal.fats}g</div>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-neutral-600 text-sm font-bold bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-center">
                   No meals logged on this day.
                </div>
              )}
            </section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
