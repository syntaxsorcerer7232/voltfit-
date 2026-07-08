import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, X, Edit3, Loader } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface Props {
  onClose: () => void;
}

export default function BodyStats({ onClose }: Props) {
  const { user, updateUser } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);

  // Local state for edits
  const [weight, setWeight] = useState(user?.weight || 0);
  const [targetWeight, setTargetWeight] = useState(user?.goals?.targetWeight || 0);
  const [height, setHeight] = useState(user?.height || 0);
  
  const [bodyType, setBodyType] = useState((user as any)?.bodyType || 'Mesomorph');
  const [maintenanceCalories, setMaintenanceCalories] = useState((user as any)?.maintenanceCalories || 2500);
  const [calorieGoal, setCalorieGoal] = useState(user?.goals?.dailyCalories || 2000);
  const [proteinGoal, setProteinGoal] = useState((user as any)?.macros?.protein || 150);
  const [carbsGoal, setCarbsGoal] = useState((user as any)?.macros?.carbs || 200);
  const [fatsGoal, setFatsGoal] = useState((user as any)?.macros?.fats || 65);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Auto-save logic
  useEffect(() => {
    if (!isEditing) return;
    
    setSaveStatus('saving');
    
    const timeout = setTimeout(() => {
        updateUser({
          weight: Number(weight) || 0,
          height: Number(height) || 0,
          ...(bodyType && { bodyType }),
          ...(maintenanceCalories && { maintenanceCalories: Number(maintenanceCalories) }),
          macros: {
            protein: Number(proteinGoal) || 0,
            carbs: Number(carbsGoal) || 0,
            fats: Number(fatsGoal) || 0,
          },
          goals: {
            ...(user?.goals || {}),
            targetWeight: Number(targetWeight) || 0,
            dailyCalories: Number(calorieGoal) || 0,
          }
        } as any);
        
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000); // 1s debounce
    
    return () => clearTimeout(timeout);
  }, [weight, targetWeight, height, bodyType, maintenanceCalories, calorieGoal, proteinGoal, carbsGoal, fatsGoal, isEditing]);

  const toggleEditing = () => {
      if (isEditing) {
          setIsEditing(false); // Explicitly close editing mode
      } else {
          setIsEditing(true);
      }
  };

  return (
    <motion.div 
      key="stats"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col bg-[#0a0a0a] z-50 pt-8 px-6 pb-24"
    >
      <header className="flex items-center justify-between mb-10 px-2 sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-xl py-4 border-b border-white/5">
         <div className="flex items-center gap-4 cursor-pointer group" onClick={onClose}>
           <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl group-hover:scale-110 active:scale-95 transition-all shadow-lg">
             <ChevronLeft size={22} strokeWidth={3} className="text-muted group-hover:text-foreground" />
           </div>
           <div className="flex flex-col">
              <h2 className="text-xl font-black italic tracking-tighter uppercase leading-none text-white">Body Stats</h2>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Biometric Snapshot</span>
           </div>
         </div>
         <div className="flex items-center gap-4">
             {isEditing && (
                 <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20 animate-in fade-in">
                    {saveStatus === 'saving' && <Loader size={12} className="animate-spin text-primary" />} 
                    {saveStatus === 'saved' && 'Synced •'}
                 </span>
             )}
             <button onClick={toggleEditing} className="text-primary bg-primary/10 border border-primary/20 rounded-2xl p-3 hover:scale-110 transition-all active:scale-90 shadow-lg shadow-primary/5" title={isEditing ? "View Mode" : "Edit Mode"}>
               {isEditing ? <X size={20} strokeWidth={3} /> : <Edit3 size={20} strokeWidth={3} />}
             </button>
         </div>
      </header>
      
     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
         <div className="grid grid-cols-2 gap-6">
           <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2 opacity-50 italic">Height (cm)</label>
             {isEditing ? (
               <input 
                 type="number"
                 value={height || ''}
                 onChange={(e) => setHeight(Number(e.target.value))}
                 className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-5 px-6 text-xl font-black focus:border-primary/50 focus:outline-none transition-all shadow-inner italic"
               />
             ) : (
               <div className="w-full bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-[1.5rem] py-5 px-6 text-2xl font-black text-white italic shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                 {height || 0}
                 <span className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest opacity-30">CM</span>
               </div>
             )}
           </div>
           
           <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2 opacity-50 italic">Weight ({user?.weightUnit || 'kg'})</label>
             {isEditing ? (
               <input 
                 type="number"
                 value={weight || ''}
                 onChange={(e) => setWeight(Number(e.target.value))}
                 className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-5 px-6 text-xl font-black focus:border-primary/50 focus:outline-none transition-all shadow-inner italic text-primary"
               />
             ) : (
               <div className="w-full bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-[1.5rem] py-5 px-6 text-2xl font-black text-primary italic shadow-2xl relative overflow-hidden group">
                  <div className="absolute bottom-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                 {weight || 0}
                 <span className="text-[10px] font-black uppercase text-primary/40 ml-2 tracking-widest">{user?.weightUnit?.toUpperCase() || 'KG'}</span>
               </div>
             )}
           </div>
         </div>

         <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Target Weight ({user?.weightUnit || 'kg'})</label>
           {isEditing ? (
             <input 
               type="number"
               value={targetWeight || ''}
               onChange={(e) => setTargetWeight(Number(e.target.value))}
               className="w-full bg-white/5 border border-primary/50 rounded-2xl py-4 px-6 text-lg font-black focus:outline-none transition-colors"
             />
           ) : (
             <div className="w-full bg-transparent border border-white/5 rounded-2xl py-4 px-6 text-lg font-black text-white/90">
               {targetWeight || 0}
             </div>
           )}
         </div>

         <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Body Type</label>
           {isEditing ? (
             <input 
               type="text"
               value={bodyType || ''}
               onChange={(e) => setBodyType(e.target.value)}
               className="w-full bg-white/5 border border-primary/50 rounded-2xl py-4 px-6 text-lg font-black focus:outline-none transition-colors"
               placeholder="Ectomorph, Mesomorph, Endomorph"
             />
           ) : (
             <div className="w-full bg-transparent border border-white/5 rounded-2xl py-4 px-6 text-lg font-black text-white/90">
               {bodyType || 'Not specified'}
             </div>
           )}
         </div>
         
         <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Maintenance Calories (kcal)</label>
           {isEditing ? (
             <input 
               type="number"
               value={maintenanceCalories || ''}
               onChange={(e) => setMaintenanceCalories(Number(e.target.value))}
               className="w-full bg-white/5 border border-primary/50 rounded-2xl py-4 px-6 text-lg font-black focus:outline-none transition-colors"
             />
           ) : (
             <div className="w-full bg-transparent border border-white/5 rounded-2xl py-4 px-6 text-lg font-black text-white/90">
               {maintenanceCalories || 0}
             </div>
           )}
         </div>
         
         <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Calorie Goal (kcal/day)</label>
           {isEditing ? (
             <input 
               type="number"
               value={calorieGoal || ''}
               onChange={(e) => setCalorieGoal(Number(e.target.value))}
               className="w-full bg-white/5 border border-primary/50 rounded-2xl py-4 px-6 text-lg font-black focus:outline-none transition-colors text-primary"
             />
           ) : (
             <div className="w-full bg-transparent border border-white/5 rounded-2xl py-4 px-6 text-lg font-black text-primary">
               {calorieGoal || 0}
             </div>
           )}
         </div>

         <div className="pt-2">
           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4 mb-2 block">Macro Goals (g/day)</label>
           <div className="grid grid-cols-3 gap-3">
             <div className="space-y-2">
               <label className="text-[9px] font-bold text-blue-400 uppercase tracking-widest ml-1">Protein</label>
               {isEditing ? (
                 <input 
                   type="number"
                   value={proteinGoal || ''}
                   onChange={(e) => setProteinGoal(Number(e.target.value))}
                   className="w-full bg-white/5 border border-blue-500/50 rounded-xl py-3 px-3 text-sm font-black focus:outline-none transition-colors text-center"
                 />
               ) : (
                 <div className="w-full bg-transparent border border-white/5 rounded-xl py-3 px-3 text-sm font-black text-center text-white/90">
                   {proteinGoal || 0}
                 </div>
               )}
             </div>
             
             <div className="space-y-2">
               <label className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest ml-1">Carbs</label>
               {isEditing ? (
                 <input 
                   type="number"
                   value={carbsGoal || ''}
                   onChange={(e) => setCarbsGoal(Number(e.target.value))}
                   className="w-full bg-white/5 border border-yellow-500/50 rounded-xl py-3 px-3 text-sm font-black focus:outline-none transition-colors text-center"
                 />
               ) : (
                 <div className="w-full bg-transparent border border-white/5 rounded-xl py-3 px-3 text-sm font-black text-center text-white/90">
                   {carbsGoal || 0}
                 </div>
               )}
             </div>
             
             <div className="space-y-2">
               <label className="text-[9px] font-bold text-red-400 uppercase tracking-widest ml-1">Fats</label>
               {isEditing ? (
                 <input 
                   type="number"
                   value={fatsGoal || ''}
                   onChange={(e) => setFatsGoal(Number(e.target.value))}
                   className="w-full bg-white/5 border border-red-500/50 rounded-xl py-3 px-3 text-sm font-black focus:outline-none transition-colors text-center"
                 />
               ) : (
                 <div className="w-full bg-transparent border border-white/5 rounded-xl py-3 px-3 text-sm font-black text-center text-white/90">
                   {fatsGoal || 0}
                 </div>
               )}
             </div>
           </div>
         </div>
         
      </div>
    </motion.div>
  );
}
