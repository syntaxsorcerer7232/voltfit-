import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Check, Plus, X } from 'lucide-react';
import { Habit } from '../types';

export default React.memo(function HabitTracker() {
  const { user, updateUser } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  const habits = user?.habits || [];
  const today = new Date().toISOString().split('T')[0];

  const toggleHabit = (habitId: string) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const isCompletedToday = habit.completedDates.includes(today);
        return {
          ...habit,
          completedDates: isCompletedToday
            ? habit.completedDates.filter(d => d !== today)
            : [...habit.completedDates, today]
        };
      }
      return habit;
    });
    updateUser({ habits: updatedHabits });
  };

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      completedDates: [],
    };

    updateUser({ habits: [...habits, newHabit] });
    setNewHabitName('');
    setIsAdding(false);
  };

  const deleteHabit = (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateUser({ habits: habits.filter(h => h.id !== habitId) });
  };

  return (
    <div className="glass-card p-5 rounded-3xl space-y-4 shadow-xl border-white/5">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Daily Habits</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-9 h-9 flex items-center justify-center bg-primary text-black rounded-full hover:scale-110 transition-all active:scale-90 shadow-[0_4px_12px_rgba(132,204,22,0.3)] z-10"
        >
          {isAdding ? <X size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={addHabit} className="flex space-x-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="e.g. Read 10 mins"
            className="flex-1 bg-black/5 dark:bg-black/20 border border-card-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted/50 font-medium"
            autoFocus
          />
          <button 
            type="submit"
            className="bg-primary text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            Add
          </button>
        </form>
      )}

      <div className="space-y-2">
        {habits.length === 0 && !isAdding && (
          <div className="text-center py-6 text-slate-600 text-xs font-bold uppercase tracking-widest italic">
            Discipline starts here...
          </div>
        )}
        
        {habits.map(habit => {
          const isCompleted = habit.completedDates.includes(today);
          
          return (
            <div 
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                isCompleted 
                  ? 'bg-primary/10 border-primary/20' 
                  : 'bg-surface-elevated border-card-border hover:bg-primary/5'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                  isCompleted ? 'bg-primary border-primary text-black shadow-glow' : 'border-card-border bg-black/5 text-transparent'
                }`}>
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className={`text-sm font-black uppercase tracking-tight transition-all ${isCompleted ? 'opacity-50 line-through text-muted' : 'text-foreground'}`}>
                  {habit.name}
                </span>
              </div>
              <button 
                onClick={(e) => deleteHabit(habit.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-500 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});
