import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, Sparkles, Brain, FlaskConical, ShieldCheck, Plus, X as CloseIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AITrainerChat } from './AITrainerChat';
import { SCIENTIFIC_TIPS } from '../data/scientificTips';
import { useAppContext } from '../context/AppContext';
import { DynamicExerciseImage } from './DynamicExerciseImage';

export default function AIRecommendations({ activeFocus }: { activeFocus: string[] }) {
  const { user, updateUser, workoutHistory } = useAppContext();
  const [showChat, setShowChat] = useState(false);
  const [tip, setTip] = useState(SCIENTIFIC_TIPS[0]);
  const [showSupplementInput, setShowSupplementInput] = useState(false);
  const [newSupplement, setNewSupplement] = useState('');
  const [recommendations, setRecommendations] = useState<{name: string, reason: string}[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  useEffect(() => {
    const randomTip = SCIENTIFIC_TIPS[Math.floor(Math.random() * SCIENTIFIC_TIPS.length)];
    setTip(randomTip);
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!activeFocus || activeFocus.length === 0) return;
      setIsLoadingRecs(true);
      try {
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activeFocus, workoutHistory }),
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setRecommendations(data);
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      } finally {
        setIsLoadingRecs(false);
      }
    };

    fetchRecommendations();
  }, [activeFocus, workoutHistory?.length]);

  const handleAddSupplement = () => {
    if (!newSupplement.trim()) return;
    const currentSups = user.supplements || [];
    if (!currentSups.some(s => s.name === newSupplement.trim())) {
      updateUser({ 
        supplements: [
          ...currentSups, 
          { 
            id: Date.now().toString(), 
            name: newSupplement.trim(), 
            dosage: 'Standard', 
            timing: 'Morning', 
            frequency: 'Daily' 
          }
        ] 
      });
    }
    setNewSupplement('');
  };

  const removeSupplement = (supId: string) => {
    updateUser({ supplements: (user.supplements || []).filter(s => s.id !== supId) });
  };

  return (
    <>
      <div 
        className="group relative overflow-hidden rounded-[32px] border border-primary/20 bg-neutral-900/40 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-primary/50"
      >
        {/* Sci-Fi Corner Accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-primary/30 rounded-tl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-primary/30 rounded-br-lg" />

        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-black border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(132,204,22,0.1)] group-hover:border-primary/40 transition-all">
                   <Bot size={28} className="text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#84cc16]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 font-mono">Neural Advisor</span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                    <ShieldCheck size={10} className="text-primary" />
                    <span className="text-[8px] font-black text-primary uppercase tracking-tighter">Natural Only</span>
                  </div>
                </div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">VoltFit Core AI</h3>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 font-mono text-[9px] text-white/20 uppercase tracking-widest">
              <div className="flex gap-1">
                {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-primary/30 rounded-full" />)}
              </div>
              <span>Integrity: 100%</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Recommendations Section */}
            {activeFocus && activeFocus.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-1">Tactical Suggestions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isLoadingRecs ? (
                    <div className="col-span-full py-8 flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
                      <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
                      <span className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-black">Generating Protocol...</span>
                    </div>
                  ) : (
                    recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-[2rem] p-5 group/card hover:bg-white/[0.08] transition-all">
                        <DynamicExerciseImage alt={rec.name} className="w-full h-32 object-cover rounded-2xl mb-4 border border-white/10" />
                        <h5 className="text-white font-black uppercase italic tracking-tight text-sm mb-1 group-hover/card:text-primary transition-colors">{rec.name}</h5>
                        <p className="text-white/40 text-[10px] leading-relaxed font-medium uppercase tracking-wider">{rec.reason}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Scientific Tip Section */}
            <div className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:border-primary/10 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    {tip.category === 'Supplements' ? <FlaskConical size={14} className="text-primary" /> : <Brain size={14} className="text-primary" />}
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{tip.category}: {tip.topic}</span>
                </div>
              </div>
              <p className="text-sm text-white/70 font-medium leading-relaxed italic">
                "{tip.content}"
              </p>
            </div>

            {/* Supplements Tracker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Active Stack</span>
                <button 
                  onClick={() => setShowSupplementInput(!showSupplementInput)}
                  className="p-1 hover:text-primary transition-colors text-white/20"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(user.supplements || []).length === 0 ? (
                  <p className="text-[10px] text-white/20 italic uppercase tracking-wider">No supplements logged</p>
                ) : (
                  (user.supplements || []).map(sup => (
                    <div key={sup.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 group/sup">
                      <span className="text-[10px] font-bold text-white/60">{sup.name}</span>
                      <button 
                        onClick={() => removeSupplement(sup.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                      >
                        <CloseIcon size={10} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <AnimatePresence>
                {showSupplementInput && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2"
                  >
                    <input 
                      type="text"
                      value={newSupplement}
                      onChange={(e) => setNewSupplement(e.target.value)}
                      placeholder="e.g. Creatine"
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSupplement()}
                    />
                    <button 
                      onClick={handleAddSupplement}
                      className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase hover:bg-primary hover:text-black transition-all"
                    >
                      Add
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-0.5 w-12 bg-gradient-to-r from-primary/50 to-transparent rounded-full" />
                <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] font-mono">Natural Protocol Alpha</span>
              </div>

              <button 
                onClick={() => setShowChat(true)}
                className="flex items-center gap-3 px-6 py-2.5 rounded-xl bg-primary text-black font-black text-[11px] uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)]"
              >
                <span>Engage AI</span>
                <MessageSquare size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Stream Decoration */}
        <div className="absolute bottom-4 left-8 opacity-10 font-mono text-[7px] text-primary uppercase tracking-[0.5em]">
          DRUG-FREE CERTIFIED // AUTH: {user.name?.slice(0, 8).toUpperCase() || 'ANON'}
        </div>
      </div>

      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full h-full relative"
            >
              <AITrainerChat 
                initialMuscle={activeFocus[0]} 
                onClose={() => setShowChat(false)} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
