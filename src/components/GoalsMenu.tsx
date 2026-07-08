import React from 'react';
import { ChevronLeft, Edit3, Droplet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface Props {
  onClose: () => void;
}

export default function GoalsMenu({ onClose }: Props) {
  const { user } = useAppContext();
  
  const maintainCalories = user?.maintainCalories || 0;
  const calorieGoal = user?.calorieGoal || 0;
  const proteinGoal = user?.proteinGoal || 0;
  const carbsGoal = user?.carbsGoal || 0;
  const fatsGoal = user?.fatsGoal || 0;

  const goalTypeMap: Record<string, string> = {
    'lose': 'Lose Weight',
    'maintain': 'Maintain Weight',
    'gain': 'Gain Weight',
  };
  
  const goalTypeDisplay = user?.goal ? goalTypeMap[user.goal] : 'Not set';
  const waterLiters = ((user?.waterIntakeGoal || 3000) / 1000).toFixed(1);

  return (
    <div className="flex flex-col bg-background z-50 pt-8 px-6 pb-32 border-x border-card-border animate-in slide-in-from-right duration-300 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px] opacity-20 pointer-events-none" />
      
      <header className="flex items-center justify-between mb-10 px-2 sticky top-0 z-20 bg-background/60 backdrop-blur-3xl py-6 border-b border-card-border shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
         <div className="flex items-center gap-4 cursor-pointer group" onClick={onClose}>
           <div className="p-3 bg-surface-elevated border border-card-border rounded-xl group-hover:scale-110 group-hover:rotate-[-5deg] transition-all shadow-xl shadow-black/20">
             <ChevronLeft size={24} strokeWidth={3} className="text-muted group-hover:text-foreground" />
           </div>
           <div className="flex flex-col">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Goals</h2>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-40 mt-2">Strategic Targets</span>
           </div>
         </div>
         <button className="text-primary bg-primary/10 border border-primary/20 rounded-2xl p-4 hover:scale-110 transition-all active:scale-95 shadow-xl shadow-primary/5">
           <Edit3 size={20} strokeWidth={3} />
         </button>
      </header>
      
      <div className="space-y-6">
         {/* Main Box */}
         <div className="bg-surface-elevated/40 backdrop-blur-2xl rounded-[2.5rem] p-10 flex flex-col items-center justify-center border border-card-border shadow-2xl relative overflow-hidden group pt-16">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] opacity-30"></div>
           <div className="w-20 h-20 bg-primary/20 text-primary flex items-center justify-center rounded-[2rem] border border-primary/30 mb-6 text-4xl font-black italic shadow-xl group-hover:scale-110 transition-transform">
             {user?.goal === 'lose' ? '-' : user?.goal === 'gain' ? '+' : '='}
           </div>
           <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">{goalTypeDisplay}</h3>
           <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em] opacity-40">Primary Goal Selected</p>
         </div>

         {/* Goal Type Box - Simple variant */}
         <div className="bg-surface-elevated/30 border border-card-border rounded-3xl p-5 flex items-center justify-between shadow-sm px-8">
           <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Strategy</span>
           <span className="text-sm font-black uppercase tracking-widest italic">{goalTypeDisplay}</span>
         </div>

         {/* Calories Box */}
         <div className="bg-surface-elevated shadow-2xl rounded-[2.5rem] border border-card-border overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1 opacity-50">Maintenance Calories</span>
                  <span className="font-black italic text-xl tracking-tighter text-muted/60">{maintainCalories} KCAL</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Target Intake</span>
                  <span className="font-black italic text-3xl tracking-tighter text-primary">{calorieGoal} KCAL</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-background rounded-full overflow-hidden shadow-inner">
                 <div className="h-full bg-primary shadow-[0_0_15px_rgba(132,204,22,0.4)]" style={{ width: '85%' }} />
              </div>
            </div>
         </div>

         {/* Complete Nutrition Goals Box */}
         <div className="bg-surface-elevated/40 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-card-border shadow-2xl space-y-12">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase italic tracking-[0.2em]">Macronutrient Protocol</h3>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
           </div>
           
           <div className="space-y-12">
             {/* MACRONUTRIENTS */}
             <div className="space-y-10">
               <div>
                 <div className="flex justify-between items-end mb-4">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-40 mb-1">Fuel Density</span>
                     <span className="text-2xl font-black italic tracking-tighter">Calories</span>
                   </div>
                   <span className="text-2xl font-black italic tracking-tighter text-primary">{calorieGoal} kcal</span>
                 </div>
                 <div className="h-1 w-full bg-background rounded-full" />
               </div>

               <div className="space-y-2">
                 <div className="flex justify-between items-end mb-3">
                    <span className="text-sm font-black uppercase italic tracking-tighter">Protein</span>
                    <span className="text-sm font-black italic tracking-tighter text-orange-500">{proteinGoal} g</span>
                 </div>
                 <div className="w-full bg-background h-2.5 rounded-full overflow-hidden shadow-inner p-0.5 border border-card-border">
                   <div className="bg-orange-500 h-full rounded-full shadow-[0_0_10px_rgba(255,107,0,0.3)] transition-all duration-1000" style={{ width: '60%' }}></div>
                 </div>
               </div>

               <div className="space-y-2">
                 <div className="flex justify-between items-end mb-3">
                    <span className="text-sm font-black uppercase italic tracking-tighter">Carbohydrates</span>
                    <span className="text-sm font-black italic tracking-tighter text-blue-500">{carbsGoal} g</span>
                 </div>
                 <div className="w-full bg-background h-2.5 rounded-full overflow-hidden shadow-inner p-0.5 border border-card-border">
                   <div className="bg-blue-500 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000" style={{ width: '45%' }}></div>
                 </div>
               </div>

               <div className="space-y-1">
                 <div className="bg-background/40 p-6 rounded-[2rem] border border-card-border shadow-inner">
                   <div className="flex justify-between items-end mb-4">
                     <span className="text-sm font-black uppercase italic tracking-tighter">Fiber</span>
                     <span className="text-sm font-black italic tracking-tighter text-primary">25 g</span>
                   </div>
                   <div className="w-full bg-background h-2 rounded-full overflow-hidden mb-4 shadow-inner">
                     <div className="bg-primary h-full rounded-full" style={{ width: '60%' }}></div>
                   </div>
                   <p className="text-[9px] text-muted font-black uppercase tracking-[0.2em] opacity-40 leading-relaxed italic">Critical for digestive endurance & molecular health</p>
                 </div>
               </div>

               <div className="space-y-2">
                 <div className="flex justify-between items-end mb-3">
                    <span className="text-sm font-black uppercase italic tracking-tighter">Liquid Lipids (Fats)</span>
                    <span className="text-sm font-black italic tracking-tighter text-amber-500">{fatsGoal} g</span>
                 </div>
                 <div className="w-full bg-background h-2.5 rounded-full overflow-hidden shadow-inner p-0.5 border border-card-border">
                   <div className="bg-amber-500 h-full rounded-full shadow-[0_0_10px_rgba(234,179,8,0.3)] transition-all duration-1000" style={{ width: '25%' }}></div>
                 </div>
               </div>
             </div>

             {/* Sections with Headers */}
             {[
               { title: 'Fat Breakdown', items: [
                 { label: 'Saturated', val: '20 g' },
                 { label: 'Monounsaturated', val: '25 g' },
                 { label: 'Polyunsaturated', val: '20 g' },
                 { label: 'Trans Fat', val: '< 2 g', danger: true }
               ]},
               { title: 'Essential Minerals', items: [
                 { label: 'Cholesterol', val: '< 300 mg' },
                 { label: 'Sodium', val: '< 2300 mg' },
                 { label: 'Potassium', val: '3500 mg' }
               ]},
               { title: 'Micronutrient Array', items: [
                 { label: 'Vitamin A', val: '900 mcg' },
                 { label: 'Vitamin C', val: '90 mg' },
                 { label: 'Calcium', val: '1200 mg' },
                 { label: 'Iron', val: '18 mg' }
               ]}
             ].map(sec => (
               <div key={sec.title} className="pt-2">
                 <h4 className="text-[9px] text-muted font-black uppercase tracking-[0.4em] mb-6 opacity-30 border-b border-card-border pb-3">{sec.title}</h4>
                 <div className="space-y-4">
                   {sec.items.map(item => (
                     <div key={item.label} className="flex justify-between items-center group">
                       <span className="text-muted text-xs font-black uppercase tracking-widest group-hover:text-foreground transition-colors group-hover:translate-x-1 duration-300">{item.label}</span>
                       <span className={`text-xs font-black tracking-widest ${item.danger ? 'text-red-500' : 'text-foreground opacity-80'}`}>{item.val}</span>
                     </div>
                   ))}
                 </div>
               </div>
             ))}

           </div>
         </div>

         {/* Water Intake Goal */}
         <div className="bg-surface-elevated/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-card-border flex items-center space-x-6 shadow-2xl">
           <div className="w-16 h-16 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-[1.5rem] border border-blue-500/20 shadow-xl shadow-blue-500/10 shrink-0">
             <Droplet fill="currentColor" size={32} strokeWidth={3} className="animate-pulse" />
           </div>
           <div>
             <div className="text-[10px] text-muted font-black uppercase tracking-[0.3em] mb-1 opacity-50">Hydration Threshold</div>
             <div className="flex items-baseline space-x-3">
               <span className="text-3xl font-black italic tracking-tighter text-foreground">{user?.waterIntakeGoal || 3000} ML</span>
               <span className="text-xs font-black text-muted opacity-40 uppercase tracking-widest italic">{waterLiters}L</span>
             </div>
           </div>
         </div>

         {/* Sector Wisdom */}
         <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-8 backdrop-blur-xl shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="flex gap-4 relative z-10">
              <div className="text-primary font-black uppercase tracking-[0.2em] italic text-xs shrink-0 pt-1">ADVICE //</div>
              <p className="text-xs text-foreground/70 font-medium leading-relaxed italic">
                Daily calorie goals are dynamic flux points. Adjust biometric data weekly to maintain precision execution. Strength requires calibration.
              </p>
            </div>
         </div>

      </div>
    </div>
  );
}
