import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, Save, Trash2, Edit3, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CustomFood } from '../types';
import { cn } from './BottomNav';

interface Props {
  onClose: () => void;
}

export default function CustomFoodsMenu({ onClose }: Props) {
  const { user, updateUser, theme } = useAppContext();
  const customFoods = user?.customFoods || [];
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('0');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fats, setFats] = useState('0');
  const [portion, setPortion] = useState('100g'); // Default portion

  const handleSave = () => {
    if (!name.trim()) return;
    
    const newFood: CustomFood = {
      id: editingId || `custom_${Date.now()}`,
      name: name.trim(),
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fats: parseInt(fats) || 0,
      portion: portion.trim() || '1 serving',
    };

    let updatedFoods = [...customFoods];
    if (editingId) {
      updatedFoods = updatedFoods.map(f => f.id === editingId ? newFood : f);
    } else {
      updatedFoods.push(newFood);
    }

    updateUser({ customFoods: updatedFoods });
    
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setCalories('0');
    setProtein('0');
    setCarbs('0');
    setFats('0');
    setPortion('100g');
    setEditingId(null);
  };

  const startEdit = (food: CustomFood) => {
    setName(food.name);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFats(food.fats.toString());
    setPortion(food.portion);
    setEditingId(food.id);
    setShowForm(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedFoods = customFoods.filter(f => f.id !== id);
    updateUser({ customFoods: updatedFoods });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn("z-50 flex flex-col pb-32 border-x border-card-border shadow-2xl animate-in slide-in-from-right duration-300", theme === 'dark' ? "bg-background" : "bg-background")}
    >
      <div className={cn("sticky top-0 z-50 px-8 py-10 border-b border-card-border flex justify-between items-center backdrop-blur-3xl bg-background/60 shadow-[0_4px_30px_rgba(0,0,0,0.1)]")}>
        <div className="flex items-center gap-6 cursor-pointer group" onClick={onClose}>
          <div className="p-3 bg-surface-elevated border border-card-border rounded-2xl group-hover:scale-110 group-hover:rotate-[-5deg] transition-all shadow-xl shadow-black/20">
            <ChevronLeft size={24} strokeWidth={3} className="text-muted group-hover:text-foreground transition-colors" />
          </div>
          <div className="flex flex-col">
             <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Custom Blueprints</h2>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-40 mt-2">Nutritional Archives</span>
          </div>
        </div>
        {!showForm && (
          <button 
             onClick={() => setShowForm(true)} 
             className="bg-primary text-black px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/10"
          >
            <Plus size={16} strokeWidth={3} /> Establish New
          </button>
        )}
      </div>

      <div className="p-8">
        {showForm ? (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
             <div className="flex justify-between items-end pb-6 border-b border-card-border/50">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em] opacity-40 mb-1">Establishment Protocol</span>
                  <h3 className="font-black italic text-2xl uppercase tracking-tighter">{editingId ? 'Data Recalibration' : 'New Blueprint Entry'}</h3>
               </div>
               <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted border border-card-border p-3 rounded-2xl hover:text-foreground active:scale-90 transition-all shadow-inner">
                 <X size={20} strokeWidth={3} />
               </button>
             </div>
             
             <div className="space-y-10">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-1 opacity-60">Designation / Name</label>
                   <input 
                     type="text" 
                     value={name} 
                     onChange={e => setName(e.target.value)} 
                     placeholder="e.g., Homemade Sustenance-01" 
                     className="w-full bg-surface-elevated border border-card-border rounded-[1.5rem] px-6 py-5 text-sm font-black italic focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all shadow-inner placeholder:text-muted/20" 
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-1 opacity-60">Volume Segment</label>
                       <input 
                         type="text" 
                         value={portion} 
                         onChange={e => setPortion(e.target.value)} 
                         placeholder="e.g., 100G UNIT" 
                         className="w-full bg-surface-elevated border border-card-border rounded-[1.5rem] px-6 py-5 text-sm font-black italic focus:border-primary focus:outline-none transition-all shadow-inner" 
                       />
                   </div>
                   <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary ml-1">Energy Flux (KCAL)</label>
                       <input 
                         type="number" 
                         value={calories} 
                         onChange={e => setCalories(e.target.value)} 
                         className="w-full bg-primary/5 border border-primary/20 text-primary rounded-[1.5rem] px-6 py-5 text-xl font-black italic focus:border-primary focus:outline-none transition-all shadow-xl shadow-primary/5" 
                       />
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-background/50 p-6 rounded-[2.5rem] border border-card-border shadow-inner">
                   <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted text-center block opacity-50">Protein (g)</label>
                      <input 
                        type="number" 
                        value={protein} 
                        onChange={e => setProtein(e.target.value)} 
                        className="w-full bg-surface-elevated/50 border border-card-border rounded-2xl px-2 py-5 text-base font-black italic text-center focus:border-orange-500 focus:outline-none transition-all shadow-sm" 
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted text-center block opacity-50">Carbs (g)</label>
                      <input 
                        type="number" 
                        value={carbs} 
                        onChange={e => setCarbs(e.target.value)} 
                        className="w-full bg-surface-elevated/50 border border-card-border rounded-2xl px-2 py-5 text-base font-black italic text-center focus:border-blue-500 focus:outline-none transition-all shadow-sm" 
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted text-center block opacity-50">Fats (g)</label>
                      <input 
                        type="number" 
                        value={fats} 
                        onChange={e => setFats(e.target.value)} 
                        className="w-full bg-surface-elevated/50 border border-card-border rounded-2xl px-2 py-5 text-base font-black italic text-center focus:border-amber-500 focus:outline-none transition-all shadow-sm" 
                      />
                   </div>
                </div>
             </div>

             <button 
                onClick={handleSave}
                disabled={!name.trim()}
                className="w-full mt-10 py-6 bg-foreground text-background font-black uppercase tracking-[0.4em] text-xs rounded-[2rem] flex items-center justify-center disabled:opacity-30 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
             >
                <Save size={20} strokeWidth={3} className="mr-3" />
                Commit Blueprint
             </button>
          </div>
        ) : (
          <div className="space-y-4">
             {customFoods.length === 0 ? (
                <div className="text-center py-24 bg-surface-elevated/20 rounded-[3rem] border border-dashed border-card-border relative overflow-hidden group shadow-inner">
                   <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-[80px]" />
                   <p className="text-[10px] text-muted font-black uppercase tracking-[0.4em] mb-12 opacity-30 italic px-8">The database is silent.<br/>No custom blueprints archived.</p>
                   <button 
                     onClick={() => setShowForm(true)} 
                     className="bg-primary text-black font-black uppercase tracking-[0.2em] text-[10px] px-10 py-5 rounded-[2rem] hover:scale-110 active:scale-95 transition-all shadow-xl shadow-primary/10 relative z-10"
                   >
                     Initiate First Entry
                   </button>
                </div>
             ) : (
                <div className="grid grid-cols-1 gap-5">
                   {customFoods.map(food => (
                      <div 
                         key={food.id} 
                         onClick={() => startEdit(food)} 
                         className="bg-surface-elevated/40 backdrop-blur-2xl border border-card-border rounded-[2rem] p-6 flex justify-between items-center cursor-pointer hover:border-primary/40 hover:-translate-y-1.5 transition-all group shadow-xl"
                      >
                         <div className="flex-1 min-w-0">
                            <h4 className="font-black italic text-xl uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">{food.name}</h4>
                            <div className="flex gap-4 items-center mt-2">
                               <div className="text-[9px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-lg italic">
                                  {food.calories} KCAL
                               </div>
                               <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted opacity-60">
                                  {food.portion} UNIT
                               </div>
                            </div>
                            <div className="flex gap-3 text-[9px] font-black uppercase tracking-[0.1em] text-muted/40 mt-4 border-t border-card-border/50 pt-3">
                               <span>P: {food.protein}G</span>
                               <span>•</span>
                               <span>C: {food.carbs}G</span>
                               <span>•</span>
                               <span>F: {food.fats}G</span>
                            </div>
                         </div>
                         <div className="pl-6 border-l border-card-border/50">
                           <button 
                             onClick={(e) => handleDelete(food.id, e)} 
                             className="p-3.5 bg-background shadow-inner text-muted/40 hover:text-red-500 hover:bg-red-500/10 border border-card-border rounded-2xl transition-all active:scale-90"
                           >
                              <Trash2 size={18} strokeWidth={3} />
                           </button>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
