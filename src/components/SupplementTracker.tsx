import React, { useState } from 'react';
import { useAppContext, useAppLogs } from '../context/AppContext';
import { FlaskConical, Plus, Clock, Trash2, CheckCircle2, X, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SupplementTracker() {
  const { user, updateUser, addSupplementLog, removeSupplementLog, currentDateStr } = useAppContext();
  const { supplementLogs } = useAppLogs();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newSup, setNewSup] = useState({
    name: '',
    dosage: '',
    timing: 'Anytime'
  });

  const todayLogs = supplementLogs?.filter(log => log.date === currentDateStr) || [];
  const supplementStack = user.supplements || [];

  const handleLog = (sup: any) => {
    addSupplementLog({
      supplementId: sup.id,
      name: sup.name,
      dosage: sup.dosage,
    });
  };

  const handleAddSupplement = () => {
    if (!newSup.name || !newSup.dosage) return;
    
    const supplement = {
      id: Math.random().toString(36).substr(2, 9),
      ...newSup,
      frequency: 'Daily'
    };

    updateUser({
      supplements: [...(user.supplements || []), supplement]
    });

    setNewSup({ name: '', dosage: '', timing: 'Anytime' });
    setShowAddForm(false);
  };

  const handleRemoveFromStack = (id: string) => {
    updateUser({
      supplements: (user.supplements || []).filter(s => s.id !== id)
    });
  };

  return (
    <div className="px-0 pb-6">
      <div className="bg-surface-elevated rounded-[2.5rem] border border-card-border overflow-hidden shadow-sm">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-6 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <FlaskConical size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-black italic uppercase tracking-tighter text-foreground">Supplement Stack</h3>
              <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-60">
                {todayLogs.length} logged today
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            <Plus size={20} className="text-muted" />
          </motion.div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 space-y-4"
            >
              <div className="h-px bg-card-border" />
              
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-60">Your Protocol</span>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded-lg transition-all"
                >
                  <PlusCircle size={14} /> {showAddForm ? 'Cancel' : 'Define New'}
                </button>
              </div>

              {showAddForm && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3"
                >
                  <input 
                    type="text" 
                    placeholder="Supplement Name (e.g. Creatine)" 
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50"
                    value={newSup.name}
                    onChange={e => setNewSup({...newSup, name: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Dosage (e.g. 5g)" 
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50"
                    value={newSup.dosage}
                    onChange={e => setNewSup({...newSup, dosage: e.target.value})}
                  />
                  <select 
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 text-muted"
                    value={newSup.timing}
                    onChange={e => setNewSup({...newSup, timing: e.target.value})}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Pre-workout">Pre-workout</option>
                    <option value="Intra-workout">Intra-workout</option>
                    <option value="Post-workout">Post-workout</option>
                    <option value="Evening">Evening</option>
                    <option value="Before Bed">Before Bed</option>
                    <option value="With Meal">With Meal</option>
                    <option value="Anytime">Anytime</option>
                  </select>
                  <button 
                    onClick={handleAddSupplement}
                    disabled={!newSup.name || !newSup.dosage}
                    className="w-full bg-primary text-black font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-glow disabled:opacity-50"
                  >
                    Register Supplement
                  </button>
                </motion.div>
              )}

              {supplementStack.length === 0 && !showAddForm ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted italic">No supplements in your stack yet.</p>
                  <p className="text-[10px] text-muted uppercase tracking-widest mt-1 opacity-50">Add them to track your recovery boosts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supplementStack.map((sup: any) => {
                    const isLogged = todayLogs.some(log => log.supplementId === sup.id);
                    return (
                      <div 
                        key={sup.id}
                        className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                            isLogged ? 'bg-primary/20 border-primary/40' : 'bg-white/5 border-white/10'
                          )}>
                            {isLogged ? <CheckCircle2 size={18} className="text-primary" /> : <Clock size={18} className="text-white/20" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-bold text-foreground">{sup.name}</div>
                            </div>
                            <div className="text-[10px] text-muted font-medium flex items-center gap-2">
                              <span>{sup.dosage}</span>
                              <span className="w-1 h-1 bg-white/20 rounded-full" />
                              <span className="italic">{sup.timing}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleLog(sup)}
                          disabled={isLogged}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            isLogged 
                              ? 'bg-primary/10 text-primary/40 cursor-default' 
                              : 'bg-primary text-black hover:scale-105 active:scale-95 shadow-glow'
                          )}
                        >
                          {isLogged ? 'LOGGED' : 'LOG'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {todayLogs.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted mb-3 opacity-60">Today's Intake</div>
                  <div className="space-y-2">
                    {todayLogs.map(log => (
                      <div key={log.id} className="flex items-center justify-between text-[11px] text-muted py-1 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground/80">{log.name}</span>
                          <span className="opacity-40 italic">{log.dosage}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[9px] opacity-40">
                            {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button 
                            onClick={() => removeSupplementLog(log.id)}
                            className="text-red-500/40 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
