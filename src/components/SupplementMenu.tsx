import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, FlaskConical, Plus, Trash2, Save, Clock, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from './BottomNav';
import { Supplement } from '../types';

interface Props {
  onClose: () => void;
}

const TIMING_OPTIONS = ['Morning', 'Pre-workout', 'Post-workout', 'With Meal', 'Before Bed'];
const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'As Needed'];

export default function SupplementMenu({ onClose }: Props) {
  const { user, updateUser, showToast, theme } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newSup, setNewSup] = useState<Partial<Supplement>>({
    name: '',
    dosage: '',
    timing: 'Morning',
    frequency: 'Daily'
  });

  const supplements = user.supplements || [];

  const addSupplement = () => {
    if (!newSup.name) return;
    const sup: Supplement = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSup.name,
      dosage: newSup.dosage || '5g',
      timing: newSup.timing || 'Morning',
      frequency: newSup.frequency || 'Daily'
    };
    
    updateUser({
      supplements: [...supplements, sup]
    });
    
    setIsAdding(false);
    setNewSup({ name: '', dosage: '', timing: 'Morning', frequency: 'Daily' });
    showToast("Supplement added to stack", "success");
  };

  const removeSupplement = (id: string) => {
    updateUser({
      supplements: supplements.filter(s => s.id !== id)
    });
    showToast("Supplement removed", "info");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn("flex flex-col z-50 pt-8 px-6 pb-32 relative min-h-screen", theme === 'dark' ? "bg-[#0a0a0a] text-white" : "bg-white text-black")}
    >
      <header className="flex items-center justify-between mb-8 sticky top-0 z-20 bg-background/60 backdrop-blur-3xl py-6 border-b border-card-border shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
         <div className="flex items-center gap-4 cursor-pointer group" onClick={onClose}>
           <div className="p-3 bg-surface-elevated border border-card-border rounded-xl group-hover:scale-110 group-hover:rotate-[-5deg] transition-all shadow-xl shadow-black/20">
             <ChevronLeft size={24} strokeWidth={3} className="text-muted group-hover:text-foreground" />
           </div>
           <div className="flex flex-col">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Bio-Stack</h2>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-40 mt-2">Supplement Protocols</span>
           </div>
         </div>
      </header>

      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Info size={20} className="text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase italic text-primary mb-1">Recovery Influence</h4>
            <p className="text-[10px] text-muted font-medium uppercase tracking-wider leading-relaxed">
              Your supplement protocols directly influence the AI's recovery rate calculations. Consistent logging of protein and creatine provides recovery boosts.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-60">Active Stack</h3>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"
          >
            <Plus size={14} strokeWidth={3} /> Add New
          </button>
        </div>

        <div className="space-y-4">
          {supplements.length === 0 && !isAdding && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-[2rem] bg-surface-elevated border border-card-border flex items-center justify-center mx-auto text-muted opacity-20">
                <FlaskConical size={32} />
              </div>
              <p className="text-muted text-[10px] uppercase font-black tracking-widest opacity-40 italic">
                No active protocols detected
              </p>
            </div>
          )}

          <AnimatePresence>
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-6 rounded-[2.5rem] bg-surface-elevated border border-primary/30 space-y-5 shadow-2xl"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Supplement Name</label>
                  <input 
                    type="text"
                    value={newSup.name}
                    onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                    className="w-full bg-black/20 border border-card-border rounded-2xl py-3 px-4 text-sm font-bold uppercase outline-none focus:border-primary/50 text-foreground"
                    placeholder="e.g. Creatine Monohydrate"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Dosage</label>
                    <input 
                      type="text"
                      value={newSup.dosage}
                      onChange={(e) => setNewSup({ ...newSup, dosage: e.target.value })}
                      className="w-full bg-black/20 border border-card-border rounded-xl py-3 px-4 text-[10px] font-bold uppercase outline-none focus:border-primary/50 text-foreground"
                      placeholder="e.g. 5g"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Timing</label>
                    <select 
                      value={newSup.timing}
                      onChange={(e) => setNewSup({ ...newSup, timing: e.target.value })}
                      className="w-full bg-black/20 border border-card-border rounded-xl py-3 px-4 text-[10px] font-bold uppercase outline-none focus:border-primary/50 text-foreground appearance-none"
                    >
                      {TIMING_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={addSupplement}
                    className="flex-1 py-3 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest shadow-glow"
                  >
                    Deploy Protocol
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {supplements.map((sup) => (
              <div 
                key={sup.id}
                className="p-5 rounded-[2.2rem] bg-surface-elevated/50 border border-card-border flex items-center justify-between group hover:bg-surface-elevated hover:border-primary/20 transition-all shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <FlaskConical size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-black italic uppercase tracking-tight text-foreground">{sup.name}</h4>
                    <div className="flex items-center gap-3 mt-1 opacity-50">
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{sup.timing}</span>
                      </div>
                      <span className="w-1 h-1 bg-muted rounded-full" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{sup.dosage}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeSupplement(sup.id)}
                  className="p-3 text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
