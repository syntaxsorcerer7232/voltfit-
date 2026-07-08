import React, { useState, useEffect } from 'react';
import { ChevronLeft, X, Edit3, Loader, Bell, BellOff, Clock, Droplets } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { scheduleWaterReminders } from '../utils/notifications';

interface Props {
  onClose: () => void;
}

export default function PreferencesMenu({ onClose }: Props) {
  const { user, updateUser } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [diet, setDiet] = useState(user?.dietPreference || '');
  const [workoutLoc, setWorkoutLoc] = useState(user?.workoutPreference || '');
  const [workoutFreq, setWorkoutFreq] = useState(user?.workoutFrequency || '');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(user?.weightUnit || 'kg');
  
  const [remindersEnabled, setRemindersEnabled] = useState(user?.customReminders?.enabled ?? false);
  const [reminderTime, setReminderTime] = useState(user?.customReminders?.time || '17:00');
  const [reminderDays, setReminderDays] = useState<number[]>(user?.customReminders?.days || []);

  const [waterRemindersEnabled, setWaterRemindersEnabled] = useState(user?.waterReminders?.enabled ?? false);
  const [waterInterval, setWaterInterval] = useState(user?.waterReminders?.intervalMinutes || 120);
  const [waterStart, setWaterStart] = useState(user?.waterReminders?.startTime || '08:00');
  const [waterEnd, setWaterEnd] = useState(user?.waterReminders?.endTime || '22:00');

  const toggleDay = (dayIndex: number) => {
    if (reminderDays.includes(dayIndex)) {
      setReminderDays(reminderDays.filter(d => d !== dayIndex));
    } else {
      setReminderDays([...reminderDays, dayIndex]);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (!isEditing) return;
    
    setSaveStatus('saving');
    
    const timeout = setTimeout(async () => {
        updateUser({
          dietPreference: diet as any,
          workoutPreference: workoutLoc as any,
          workoutFrequency: workoutFreq as any,
          weightUnit: weightUnit,
          customReminders: {
            enabled: remindersEnabled,
            time: reminderTime,
            days: reminderDays
          },
          waterReminders: {
            enabled: waterRemindersEnabled,
            intervalMinutes: waterInterval,
            startTime: waterStart,
            endTime: waterEnd
          }
        });

        // Trigger notification scheduling
        await scheduleWaterReminders(waterRemindersEnabled, waterInterval, waterStart, waterEnd);
        
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000); // 1s debounce
    
    return () => clearTimeout(timeout);
  }, [diet, workoutLoc, workoutFreq, weightUnit, remindersEnabled, reminderTime, reminderDays, waterRemindersEnabled, waterInterval, waterStart, waterEnd, isEditing]);

  const toggleEditing = () => {
      if (isEditing) {
          setIsEditing(false); // Explicitly close editing mode
      } else {
          setIsEditing(true);
      }
  };

  return (
    <div className="flex flex-col bg-background z-50 pt-8 px-6 pb-32 border-x border-card-border animate-in slide-in-from-right duration-300 relative overflow-hidden">
      {/* Ambience */}
      <div className="absolute top-0 left-0 w-[60%] h-[60%] bg-primary/5 rounded-full blur-[180px] opacity-20 pointer-events-none" />

      <header className="flex items-center justify-between mb-10 px-2 sticky top-0 z-20 bg-background/60 backdrop-blur-3xl py-6 border-b border-card-border shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
         <div className="flex items-center gap-4 cursor-pointer group" onClick={onClose}>
           <div className="p-3 bg-surface-elevated border border-card-border rounded-xl group-hover:scale-110 group-hover:rotate-[-5deg] transition-all shadow-xl shadow-black/20">
             <ChevronLeft size={24} strokeWidth={3} className="text-muted group-hover:text-foreground" />
           </div>
           <div className="flex flex-col">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Preferences</h2>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-40 mt-2">Personal Calibration</span>
           </div>
         </div>
         <div className="flex items-center gap-4">
             {isEditing && (
                 <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20 animate-in fade-in">
                    {saveStatus === 'saving' && <Loader size={12} className="animate-spin" />} 
                    {saveStatus === 'saved' && 'Synced •'}
                 </span>
             )}
             <button onClick={toggleEditing} className="text-primary bg-primary/10 border border-primary/20 rounded-2xl p-4 hover:scale-110 transition-all active:scale-95 shadow-xl shadow-primary/5">
                {isEditing ? <X size={20} strokeWidth={3} /> : <Edit3 size={20} strokeWidth={3} />}
             </button>
         </div>
      </header>

      <div className="space-y-8">
         <div className="space-y-3">
           <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] ml-1 opacity-50">Nutritional Path</label>
           {isEditing ? (
             <div className="relative">
               <select 
                 value={diet}
                 onChange={(e) => setDiet(e.target.value)}
                 className="w-full bg-background border border-card-border rounded-[1.5rem] py-5 px-6 text-sm font-black uppercase tracking-widest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none shadow-inner"
               >
                 <option value="">Select Diet</option>
                 <option value="vegetarian">Vegetarian</option>
                 <option value="non-vegetarian">Non-Vegetarian</option>
                 <option value="eggitarian">Eggitarian</option>
               </select>
               <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <ChevronLeft size={16} className="-rotate-90" />
               </div>
             </div>
           ) : (
             <div className="w-full bg-surface-elevated/50 border border-card-border rounded-[1.5rem] py-5 px-6 text-sm font-black text-foreground uppercase tracking-widest italic shadow-sm">
               {diet || 'Neutral Execution'}
             </div>
           )}
         </div>

         <div className="space-y-3">
           <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] ml-1 opacity-50">Battle Ground</label>
           {isEditing ? (
             <div className="relative">
               <select 
                 value={workoutLoc}
                 onChange={(e) => setWorkoutLoc(e.target.value)}
                 className="w-full bg-background border border-card-border rounded-[1.5rem] py-5 px-6 text-sm font-black uppercase tracking-widest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none shadow-inner"
               >
                 <option value="">Select Location</option>
                 <option value="gym">The Iron Forge (Gym)</option>
                 <option value="home">The Domain (Home)</option>
                 <option value="both">Hybrid Protocol</option>
               </select>
               <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <ChevronLeft size={16} className="-rotate-90" />
               </div>
             </div>
           ) : (
             <div className="w-full bg-surface-elevated/50 border border-card-border rounded-[1.5rem] py-5 px-6 text-sm font-black text-foreground uppercase tracking-widest italic shadow-sm">
               {workoutLoc || 'Location Unknown'}
             </div>
           )}
         </div>

         <div className="space-y-3">
           <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] ml-1 opacity-50">Frequency Scale</label>
           {isEditing ? (
             <div className="relative">
               <select 
                 value={workoutFreq}
                 onChange={(e) => setWorkoutFreq(e.target.value)}
                 className="w-full bg-background border border-card-border rounded-[1.5rem] py-5 px-6 text-sm font-black uppercase tracking-widest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all appearance-none shadow-inner"
               >
                 <option value="">Select Frequency</option>
                 <option value="daily">Level: Maximum (Daily)</option>
                 <option value="moderately">Level: Moderate</option>
                 <option value="low">Level: Maintenance</option>
               </select>
               <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <ChevronLeft size={16} className="-rotate-90" />
               </div>
             </div>
           ) : (
             <div className="w-full bg-surface-elevated/50 border border-card-border rounded-[1.5rem] py-5 px-6 text-sm font-black text-foreground uppercase tracking-widest italic shadow-sm">
               {workoutFreq || 'Undetermined'}
             </div>
           )}
         </div>

         <div className="space-y-3">
           <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] ml-1 opacity-50">Mass Metrics</label>
           {isEditing ? (
             <div className="flex bg-background border border-card-border rounded-[1.5rem] p-1.5 shadow-inner">
               <button 
                 onClick={() => setWeightUnit('kg')}
                 className={`flex-1 py-3.5 text-xs font-black rounded-xl transition-all ${weightUnit === 'kg' ? 'bg-foreground text-background shadow-lg' : 'text-muted'}`}
               >
                 METRIC (KG)
               </button>
               <button 
                 onClick={() => setWeightUnit('lbs')}
                 className={`flex-1 py-3.5 text-xs font-black rounded-xl transition-all ${weightUnit === 'lbs' ? 'bg-foreground text-background shadow-lg' : 'text-muted'}`}
               >
                 IMPERIAL (LBS)
               </button>
             </div>
           ) : (
             <div className="w-full bg-surface-elevated/50 border border-card-border rounded-[1.5rem] py-5 px-6 text-sm font-black text-foreground uppercase tracking-widest italic shadow-sm">
               {weightUnit}
             </div>
           )}
         </div>

         <div className="space-y-6 pt-6 border-t border-card-border">
            <div className="flex items-center justify-between ml-1">
               <label className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] italic">Workout Reminders</label>
               {isEditing && (
                 <button 
                   onClick={() => setRemindersEnabled(!remindersEnabled)}
                   className={`p-3 rounded-2xl transition-all shadow-md ${remindersEnabled ? 'text-primary bg-primary/10 border border-primary/20 scale-110' : 'text-muted bg-background border border-card-border'}`}
                 >
                   {remindersEnabled ? <Bell size={18} strokeWidth={3} /> : <BellOff size={18} strokeWidth={3} />}
                 </button>
               )}
            </div>

            {(!isEditing && !remindersEnabled) ? (
              <div className="w-full bg-surface-elevated/20 border border-card-border rounded-[1.5rem] py-5 px-6 text-[10px] font-black text-muted uppercase tracking-widest opacity-40 text-center">
                Reminders Off
              </div>
            ) : (isEditing && !remindersEnabled) ? (
              <div className="w-full bg-background border border-dashed border-card-border rounded-[1.5rem] py-6 px-6 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-center cursor-pointer hover:border-primary/40 hover:text-primary transition-all opacity-60" onClick={() => setRemindersEnabled(true)}>
                ACTIVATE REMINDERS
              </div>
            ) : (
              <div className="bg-surface-elevated/50 backdrop-blur-xl border border-primary/20 text-foreground rounded-[2rem] p-6 space-y-6 shadow-xl">
                <div className="flex flex-col space-y-3">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 opacity-60">Reminder Time</label>
                  {isEditing ? (
                    <div className="relative">
                      <Clock size={16} strokeWidth={3} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted opacity-40" />
                      <input 
                        type="time" 
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full bg-background border border-card-border rounded-xl py-4 pl-14 pr-6 text-base font-black italic focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="text-2xl font-black italic tracking-tighter ml-1">{reminderTime}</div>
                  )}
                </div>

                <div className="flex flex-col space-y-3">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 opacity-60">Active Days</label>
                  <div className="flex justify-between gap-1.5 overflow-x-auto no-scrollbar pb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                      const isActive = reminderDays.includes(i);
                      return isEditing ? (
                        <button
                          key={i}
                          onClick={() => toggleDay(i)}
                          className={`min-w-[44px] h-11 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
                            isActive ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-background text-muted border border-card-border hover:border-muted'
                          }`}
                        >
                          {day}
                        </button>
                      ) : (
                        <div
                          key={i}
                          className={`min-w-[44px] h-11 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
                            isActive ? 'bg-primary/20 text-primary border border-primary/30 shadow-inner' : 'bg-background/20 text-muted opacity-20 border border-card-border'
                          }`}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
         </div>

         <div className="space-y-6 pt-6 border-t border-card-border">
            <div className="flex items-center justify-between ml-1">
               <label className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] italic">Water Log Alerts</label>
               {isEditing && (
                 <button 
                   onClick={() => setWaterRemindersEnabled(!waterRemindersEnabled)}
                   className={`p-3 rounded-2xl transition-all shadow-md ${waterRemindersEnabled ? 'text-sky-500 bg-sky-500/10 border border-sky-500/20 scale-110' : 'text-muted bg-background border border-card-border'}`}
                 >
                   {waterRemindersEnabled ? <Bell size={18} strokeWidth={3} /> : <BellOff size={18} strokeWidth={3} />}
                 </button>
               )}
            </div>

            {(!isEditing && !waterRemindersEnabled) ? (
              <div className="w-full bg-surface-elevated/20 border border-card-border rounded-[1.5rem] py-5 px-6 text-[10px] font-black text-muted uppercase tracking-widest opacity-40 text-center">
                Hydration Alerts Offline
              </div>
            ) : (isEditing && !waterRemindersEnabled) ? (
              <div className="w-full bg-background border border-dashed border-card-border rounded-[1.5rem] py-6 px-6 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-center cursor-pointer hover:border-sky-500/40 hover:text-sky-500 transition-all opacity-60" onClick={() => setWaterRemindersEnabled(true)}>
                ACTIVATE HYDRATION SYNC
              </div>
            ) : (
              <div className="bg-surface-elevated/50 backdrop-blur-xl border border-sky-500/20 text-foreground rounded-[2rem] p-6 space-y-8 shadow-xl">
                <div className="flex flex-col space-y-4">
                   <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 opacity-60">Cycle Interval</label>
                   {isEditing ? (
                     <div className="grid grid-cols-4 gap-2">
                        {[60, 120, 180, 240].map(mins => (
                           <button
                             key={mins}
                             onClick={() => setWaterInterval(mins)}
                             className={`py-4 rounded-xl text-[10px] font-black transition-all ${waterInterval === mins ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' : 'bg-background text-muted border border-card-border'}`}
                           >
                              {mins >= 60 ? `${mins/60}H` : `${mins}M`}
                           </button>
                        ))}
                     </div>
                   ) : (
                     <div className="text-xl font-black italic tracking-tighter flex items-center gap-3 text-sky-500">
                        <Droplets size={20} className="animate-pulse" /> Every {waterInterval >= 60 ? `${waterInterval/60} Hours` : `${waterInterval} Minutes`}
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-6 pb-2">
                   <div className="flex flex-col space-y-3">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 opacity-60">Alert Start</label>
                      {isEditing ? (
                         <input 
                           type="time" 
                           value={waterStart}
                           onChange={(e) => setWaterStart(e.target.value)}
                           className="w-full bg-background border border-card-border rounded-xl py-4 px-4 text-xs font-black focus:outline-none focus:border-sky-500/50 transition-all shadow-inner"
                         />
                      ) : (
                         <div className="text-lg font-black italic tracking-tighter ml-1">{waterStart}</div>
                      )}
                   </div>
                   <div className="flex flex-col space-y-3">
                      <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 opacity-60">Alert Rest</label>
                      {isEditing ? (
                         <input 
                           type="time" 
                           value={waterEnd}
                           onChange={(e) => setWaterEnd(e.target.value)}
                           className="w-full bg-background border border-card-border rounded-xl py-4 px-4 text-xs font-black focus:outline-none focus:border-sky-500/50 transition-all shadow-inner"
                         />
                      ) : (
                         <div className="text-lg font-black italic tracking-tighter ml-1">{waterEnd}</div>
                      )}
                   </div>
                </div>
              </div>
            )}
         </div>

      </div>
    </div>
  );
}
