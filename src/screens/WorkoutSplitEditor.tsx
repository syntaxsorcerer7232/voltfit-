import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, RotateCcw, Sparkles, Pencil, ChevronUp, ChevronDown, Search, Share2, Download, Loader, GripVertical } from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { cn } from '../components/BottomNav';
import { jsPDF } from 'jspdf';

import { EXERCISE_LIBRARY } from '../data/exercises';

interface Props {
  onClose: () => void;
}

const DAYS = [
  { id: 'mon', label: 'Mon', index: 1 },
  { id: 'tue', label: 'Tue', index: 2 },
  { id: 'wed', label: 'Wed', index: 3 },
  { id: 'thu', label: 'Thu', index: 4 },
  { id: 'fri', label: 'Fri', index: 5 },
  { id: 'sat', label: 'Sat', index: 6 },
  { id: 'sun', label: 'Sun', index: 0 },
];

const FOCUS_AREAS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Core', 'Cardio', 'Calves', 'Full Body'];

import { useAppContext } from '../context/AppContext';
import { WorkoutDay } from '../types';

export default function WorkoutSplitEditor({ onClose }: Props) {
  const { user, workoutSchedule, updateWorkoutSchedule, workoutHistory } = useAppContext();
  const [scheduleMode, setScheduleMode] = useState<'default' | 'custom'>(workoutSchedule.mode);
  
  const [customDays, setCustomDays] = useState<WorkoutDay[]>(() => {
    if (workoutSchedule.custom && workoutSchedule.custom.length > 0) return workoutSchedule.custom;
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return weekDays.map((name, i) => ({
      weekday: i,
      name: i === 0 || i === 3 ? 'Combat Recovery' : (i === 1 ? 'Heavy Push' : i === 2 ? 'Tactical Pull' : i === 4 ? 'Leg Protocol' : i === 5 ? 'Shoulder Ops' : 'Full Assault'),
      isRest: i === 0 || i === 3,
      muscleGroups: i === 1 ? ['Chest', 'Triceps'] : i === 2 ? ['Back', 'Biceps'] : i === 4 ? ['Legs'] : i === 5 ? ['Shoulders'] : i === 6 ? ['Full Body'] : [],
      exercises: i === 0 || i === 3 ? [] : [
        { id: '1', name: 'Bench Press', sets: 4, reps: '8-12', muscleGroups: ['Chest'] },
        { id: '2', name: 'Overhead Press', sets: 3, reps: '8-12', muscleGroups: ['Shoulders'] }
      ]
    }));
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');

  const currentDay = customDays.find(d => d.weekday === selectedDayIndex) || customDays[0];
  const workoutName = currentDay.name;
  const activeFocus = currentDay.muscleGroups || [];
  const plannedExercises = currentDay.exercises || [];

  const updateCurrentDay = (updates: Partial<WorkoutDay>) => {
    setScheduleMode('custom');
    setCustomDays(prev => prev.map(d => d.weekday === selectedDayIndex ? { ...d, ...updates } : d));
  };

  const toggleFocus = (focus: string) => {
    const newFocus = activeFocus.includes(focus) ? activeFocus.filter(f => f !== focus) : [...activeFocus, focus];
    updateCurrentDay({ muscleGroups: newFocus });
  };

  const removeExercise = (id: string) => {
    updateCurrentDay({ exercises: plannedExercises.filter(ex => ex.id !== id) });
  };

  const moveExerciseUp = (index: number) => {
    if (index === 0) return;
    const newExercises = [...plannedExercises];
    [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
    updateCurrentDay({ exercises: newExercises });
  };

  const moveExerciseDown = (index: number) => {
    if (index === plannedExercises.length - 1) return;
    const newExercises = [...plannedExercises];
    [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
    updateCurrentDay({ exercises: newExercises });
  };

  const addExercise = (exercise: any) => {
    if (!plannedExercises.find(ex => ex.id === exercise.id)) {
      updateCurrentDay({ exercises: [...plannedExercises, { id: exercise.id, name: exercise.name, sets: 3, reps: '8-12', muscleGroups: exercise.focus }] });
    }
  };

  const baseLibrary = user?.workoutPreference === 'home' 
    ? EXERCISE_LIBRARY.filter(ex => (ex as any).bodyweight)
    : EXERCISE_LIBRARY;

  const filteredLibrary = baseLibrary.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFocus = activeFocus.length === 0 || ex.focus.some(f => activeFocus.includes(f));
    return matchesSearch && matchesFocus;
  });

  const suggestedExercises = activeFocus.length > 0
    ? baseLibrary.filter(ex => ex.focus.some(f => activeFocus.includes(f)) && !plannedExercises.find(p => p.id === ex.id)).slice(0, 2)
    : baseLibrary.filter(ex => !plannedExercises.find(p => p.id === ex.id)).slice(0, 2);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Auto-save logic
  useEffect(() => {
    setSaveStatus('saving');
    const timeout = setTimeout(() => {
      updateWorkoutSchedule({ mode: scheduleMode, custom: customDays }).then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }).catch(err => {
        console.error('WorkoutSplitEditor: handleSave failed:', err);
        setSaveStatus('idle');
      });
    }, 1500); // 1.5s debounce for complex objects
    return () => clearTimeout(timeout);
  }, [scheduleMode, customDays, updateWorkoutSchedule]);

  const handleClose = () => {
    // If pending save, just close, state is handled optimistically
    onClose();
  };

  const [shareStatus, setShareStatus] = useState<'idle'|'shared'>('idle');

  const getRecentPerformance = (exId: string, exName: string) => {
    if (!workoutHistory) return null;
    const sortedHistory = [...workoutHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const session of sortedHistory) {
      const loggedEx = session.exercises?.find(e => e.exerciseId === exId || e.name === exName);
      if (loggedEx && loggedEx.sets && loggedEx.sets.length > 0) {
        const completedSets = loggedEx.sets.filter(s => s.completed);
        if (completedSets.length > 0) {
          const perfStrings = completedSets.map(s => `${s.reps}x${s.weight}kg`).join(', ');
          return `[Recent: ${perfStrings}]`;
        }
      }
    }
    return null;
  };

  const handleShare = async () => {
    let summary = `My Workout Split:\n\n`;
    DAYS.forEach(dayInfo => {
      const day = customDays.find(d => d.weekday === dayInfo.index);
      if (!day) return;
      summary += `${dayInfo.label}: ${day.name}\n`;
      if (!day.isRest) {
        if (day.muscleGroups && day.muscleGroups.length > 0) {
            summary += `Focus: ${day.muscleGroups.join(', ')}\n`;
        }
        if (day.exercises && day.exercises.length > 0) {
          summary += day.exercises.map(ex => {
             const recent = getRecentPerformance(ex.id, ex.name);
             let line = `  • ${ex.name} (${ex.sets} sets x ${ex.reps})`;
             if (recent) line += ` ${recent}`;
             return line;
          }).join('\n');
          summary += '\n';
        } else {
            summary += `  • No exercises set.\n`;
        }
      }
      summary += '\n';
    });
    summary += `#WorkoutSplit`;

    const triggerShared = () => {
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2000);
    };

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Workout Split',
          text: summary.trim(),
        });
        triggerShared();
      } catch (error) {
        console.error('Error sharing:', error);
        fallbackShare(summary.trim(), triggerShared);
      }
    } else {
        fallbackShare(summary.trim(), triggerShared);
    }
  };

  const fallbackShare = async (text: string, cb: () => void) => {
      try {
        await navigator.clipboard.writeText(text);
        cb();
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("My Workout Split", 20, y);
    y += 15;

    DAYS.forEach(dayInfo => {
      const day = customDays.find(d => d.weekday === dayInfo.index);
      if (!day) return;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`${dayInfo.label}: ${day.name}`, 20, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      if (!day.isRest) {
        if (day.muscleGroups && day.muscleGroups.length > 0) {
            doc.text(`Focus: ${day.muscleGroups.join(', ')}`, 25, y);
            y += 6;
        }
        if (day.exercises && day.exercises.length > 0) {
            day.exercises.forEach(ex => {
               const recent = getRecentPerformance(ex.id, ex.name);
               let line = `• ${ex.name} (${ex.sets} sets x ${ex.reps})`;
               if (recent) line += ` ${recent}`;
               doc.text(line, 25, y);
               y += 6;
               
               // Avoid page cut-off
               if (y > 280) {
                 doc.addPage();
                 y = 20;
               }
            });
        } else {
            doc.text(`• No exercises set.`, 25, y);
            y += 6;
        }
      }
      y += 6;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    const now = new Date();
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Generated on ${now.toLocaleDateString()}`, 20, y + 10);

    doc.save('workout_split.pdf');
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground w-full absolute top-0 left-0 z-[100] pt-safe overflow-y-auto no-scrollbar">
      {/* Header */}
      <header className="px-4 py-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-20">
        <button onClick={handleClose} className="p-2 -ml-2 rounded-full hover:bg-primary/10 transition-colors text-foreground">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center flex-1">
           <h1 className="text-xl font-black tracking-tight">Edit Workout Split</h1>
           <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Default is Push • Pull • Legs</p>
        </div>
        <div className="flex items-center space-x-2">
           <span className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-1 mx-2">
              {saveStatus === 'saving' && <Loader size={12} className="animate-spin" />} 
              {saveStatus === 'saved' && 'Saved ✓'}
           </span>
           <button onClick={handleDownloadPdf} className="p-2 rounded-full text-muted hover:text-foreground transition-colors" title="Download PDF">
              <Download size={24} />
           </button>
           <button onClick={handleShare} className="p-2 rounded-full text-muted hover:text-foreground transition-colors relative" title="Share via text">
              {shareStatus === 'shared' ? <Check size={24} className="text-primary" /> : <Share2 size={24} />}
              {shareStatus === 'shared' && (
                 <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-surface-elevated text-xs py-1 px-2 rounded-lg font-bold text-nowrap select-none text-foreground z-[60]">
                     Copied!
                 </div>
              )}
           </button>
        </div>
      </header>

      <div className="px-4 space-y-6 pb-20">
        {/* Schedule Mode */}
        <div className="bg-surface-elevated/40 p-6 rounded-[2rem] border border-card-border shadow-xl">
           <div className="flex justify-between items-center mb-6">
             <div>
               <h3 className="text-lg font-black tracking-tight">Schedule Mode</h3>
               <p className="text-xs text-muted font-medium">Using default PPL schedule</p>
             </div>
             <div className="flex bg-background rounded-xl p-1 border border-card-border">
                <button 
                  onClick={() => setScheduleMode('default')}
                  className={cn("px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", scheduleMode === 'default' ? 'bg-primary text-black' : 'text-muted')}
                >Default</button>
                <button 
                  onClick={() => setScheduleMode('custom')}
                  className={cn("px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all", scheduleMode === 'custom' ? 'bg-primary text-black' : 'text-muted')}
                >Custom</button>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  setScheduleMode('default');
                  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  setCustomDays(weekDays.map((name, i) => ({
                    weekday: i,
                    name: i === 0 || i === 3 ? 'Active Recovery' : (i === 1 ? 'Push Day' : i === 2 ? 'Pull Day' : i === 4 ? 'Leg Day' : i === 5 ? 'Shoulder Day' : 'Full Body'),
                    isRest: i === 0 || i === 3,
                    muscleGroups: i === 1 ? ['Chest', 'Triceps'] : i === 2 ? ['Back', 'Biceps'] : i === 4 ? ['Legs'] : i === 5 ? ['Shoulders'] : i === 6 ? ['Full Body'] : [],
                    exercises: i === 0 || i === 3 ? [] : [
                      { id: '1', name: 'Bench Press', sets: 4, reps: '8-12', muscleGroups: ['Chest'] },
                      { id: '2', name: 'Overhead Press', sets: 3, reps: '8-12', muscleGroups: ['Shoulders'] }
                    ]
                  })));
                }}
                className="flex items-center justify-center space-x-3 bg-white/5 border border-white/5 rounded-2xl py-4 hover:bg-white/10 transition-colors">
                <RotateCcw size={18} className="text-slate-400" />
                <span className="text-sm font-black tracking-tight">Reset to PPL</span>
              </button>
              <button className="flex items-center justify-center space-x-3 bg-white/5 border border-white/5 rounded-2xl py-4 hover:bg-white/10 transition-colors">
                <Sparkles size={18} className="text-slate-400" />
                <span className="text-sm font-black tracking-tight">Beginner</span>
              </button>
           </div>
        </div>

        {/* Day Selector */}
        <div className="bg-surface-elevated p-3 rounded-[2rem] border border-card-border flex justify-between shadow-xl">
           {DAYS.map(day => {
             const dayData = customDays.find(d => d.weekday === day.index);
             return (
             <button 
               key={day.id}
               onClick={() => setSelectedDayIndex(day.index)}
               className={cn(
                 "flex flex-col items-center justify-center w-12 h-16 rounded-2xl transition-all border",
                 selectedDayIndex === day.index 
                  ? "bg-primary border-primary text-black shadow-[0_10px_20px_rgba(132,204,22,0.2)]" 
                  : "bg-background border-card-border text-muted"
               )}
             >
                <span className="text-[11px] font-black">{day.label}</span>
                <span className={cn("text-[8px] font-black uppercase tracking-tighter mt-0.5", selectedDayIndex === day.index ? 'text-black/60' : 'text-muted/60')}>
                  {dayData?.isRest ? 'Rest' : 'Train'}
                </span>
             </button>
           )})}
        </div>

        {/* Current Day Details */}
        <div className="bg-surface-elevated/40 p-6 rounded-[2.5rem] border border-card-border relative shadow-2xl">
           <div className="flex justify-between items-center mb-6">
             <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">{DAYS.find(d => d.index === selectedDayIndex)?.label.toUpperCase()}DAY</span>
             <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">{currentDay.isRest ? 'Rest Day' : 'Training'}</span>
           </div>

           <div className="flex items-center justify-between mb-4">
             <span className="text-[10px] font-black text-muted uppercase tracking-widest">Mark as Rest Day</span>
             <button 
                onClick={() => updateCurrentDay({ isRest: !currentDay.isRest })}
                className={cn("w-10 h-6 rounded-full flex items-center transition-colors px-1", currentDay.isRest ? "bg-primary" : "bg-card-border")}
             >
                <motion.div layout className={cn("w-4 h-4 rounded-full bg-foreground shadow-sm", currentDay.isRest ? "ml-auto" : "mr-auto")} />
             </button>
           </div>
           
           <div className={cn("space-y-6 transition-opacity", currentDay.isRest ? "opacity-30 pointer-events-none" : "")}>
              <div>
                <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Workout name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={workoutName}
                    onChange={(e) => updateCurrentDay({ name: e.target.value })}
                    className="w-full bg-background border border-card-border rounded-2xl py-4 px-5 text-lg font-black tracking-tight focus:border-primary/50 outline-none transition-colors"
                  />
                  <Pencil size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Focus</label>
                  <span className="text-[10px] text-muted font-medium">{activeFocus.join(' • ')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                   {FOCUS_AREAS.map(f => (
                     <button
                        key={f}
                        onClick={() => toggleFocus(f)}
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                          activeFocus.includes(f) ? "bg-primary border-primary text-black" : "bg-background border-card-border text-muted"
                        )}
                     >
                       {activeFocus.includes(f) && <Check size={10} className="inline mr-1" strokeWidth={4} />}
                       {f}
                     </button>
                   ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                   <label className="text-[10px] font-black text-muted uppercase tracking-widest">Planned Exercises</label>
                   <span className="text-[10px] text-muted font-bold">{plannedExercises.length} items</span>
                </div>
                <Reorder.Group 
                  axis="y" 
                  values={plannedExercises} 
                  onReorder={(newOrder) => updateCurrentDay({ exercises: newOrder })}
                  className="space-y-3"
                >
                   {plannedExercises.map((ex, i) => (
                     <Reorder.Item 
                       key={ex.id} 
                       value={ex}
                       className="bg-background border border-card-border rounded-2xl p-4 flex items-center group cursor-grab active:cursor-grabbing"
                     >
                        <div className="flex items-center text-muted mr-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                           <GripVertical size={18} />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-black text-muted mr-4 border border-card-border shrink-0">
                           {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-black tracking-tight truncate">{ex.name}</h4>
                           <p className="text-[10px] text-muted font-bold uppercase tracking-widest truncate">{ex.muscleGroups.join(' • ')}</p>
                        </div>
                        <div className="flex items-center space-x-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={(e) => { e.stopPropagation(); moveExerciseUp(i); }}
                             className="p-1 text-muted hover:text-foreground transition-colors"
                           >
                             <ChevronUp size={16} />
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); moveExerciseDown(i); }}
                             className="p-1 text-muted hover:text-foreground transition-colors"
                           >
                             <ChevronDown size={16} />
                           </button>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeExercise(ex.id); }}
                          className="ml-2 px-3 py-2 bg-background border border-card-border text-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-rose-500 hover:border-rose-500/30 transition-all shrink-0"
                        >
                          Remove
                        </button>
                     </Reorder.Item>
                   ))}
                </Reorder.Group>
              </div>

              <div>
                <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-4">Suggestions</label>
                <div className="grid grid-cols-2 gap-3">
                   {suggestedExercises.map(ex => (
                     <button 
                        key={ex.id}
                        onClick={() => addExercise(ex)}
                        className="bg-background border border-card-border rounded-2xl p-4 text-left hover:border-primary/30 transition-all shadow-sm"
                      >
                        <h4 className="font-black text-sm">{ex.name}</h4>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{ex.focus[0]}</p>
                     </button>
                   ))}
                </div>
              </div>

              <div className="pt-4 border-t border-card-border">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Exercise Library</label>
                   <span className="text-[10px] text-muted font-medium italic">Tap to add</span>
                </div>
                <div className="relative mb-4">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background border border-card-border rounded-xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                   {filteredLibrary.map(ex => (
                     <div key={`lib-${ex.id}`} className="bg-background border border-card-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                           <h4 className="font-black text-sm">{ex.name}</h4>
                           <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{ex.focus.join(' • ')}</p>
                        </div>
                        <button 
                          onClick={() => addExercise(ex)}
                          className={cn(
                            "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                            plannedExercises.find(p => p.id === ex.id) 
                            ? "bg-transparent border-card-border text-muted/30 cursor-not-allowed" 
                            : "bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-black active:scale-95 shadow-sm"
                          )}
                        >
                          {plannedExercises.find(p => p.id === ex.id) ? 'Added' : 'Add'}
                        </button>
                     </div>
                   ))}
                </div>
              </div>
           </div>
        </div>

        <p className="text-center text-[10px] text-muted font-bold uppercase tracking-[0.2em] py-8">Changes save instantly.</p>
      </div>
    </div>
  );
}
