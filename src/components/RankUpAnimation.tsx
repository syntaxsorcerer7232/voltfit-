import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getDynamicStrengthScore, getRank } from '../utils/community';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, X } from 'lucide-react';

export default function RankUpAnimation() {
  const { user, workoutHistory, updateUser } = useAppContext();
  const [showRankUp, setShowRankUp] = useState<{name: string, score: number} | null>(null);

  useEffect(() => {
    if (!user) return;
    const score = getDynamicStrengthScore(user.lifts, workoutHistory);
    const currentRank = getRank(score);
    
    // Check if user has this rank in unlockedRanks
    const unlockedRanks = user.unlockedRanks || [];
    
    // We only trigger if they newly unlocked a real rank (e.e. required > 0)
    // To prevent immediate unlock when importing first stats, maybe we just trigger it anyway once.
    if (!unlockedRanks.includes(currentRank.name) && currentRank.required > 0) {
       // Show the animation and trigger confetti
       setShowRankUp({ name: currentRank.name, score });
       
       confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff', '#10b981'],
          zIndex: 150
       });
       
       // Update user to save this to prevent repeated triggers
       // Since updateUser fires an async update, we don't want to loop, 
       // but wait, `user.unlockedRanks` will change and the effect will re-run.
       // That's fine because the `if` guard will now prevent it and the score wouldn't change.
       updateUser({
         unlockedRanks: [...unlockedRanks, currentRank.name]
       });
       
       const timeout = setTimeout(() => {
          setShowRankUp(null);
       }, 5000);
       
       return () => clearTimeout(timeout);
    }
  }, [user?.unlockedRanks, user?.lifts, workoutHistory, updateUser]); // Using specific user properties to prevent loops

  return (
    <AnimatePresence>
      {showRankUp && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none p-4">
          <motion.div
             initial={{ opacity: 0, scale: 0.8, y: 50 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.8, y: -50 }}
             className="bg-black/90 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center pointer-events-auto relative"
          >
             <button 
                onClick={() => setShowRankUp(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
             >
                <X size={16} />
             </button>
             <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-amber-500 to-amber-200 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                <Flame size={40} className="text-black" />
             </div>
             
             <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Rank Up!</h2>
             <p className="text-amber-500 font-bold text-xl uppercase tracking-widest mb-2">
                {showRankUp.name} Rank
             </p>
             <p className="text-slate-400 text-sm">
                You reached a total strength score of <span className="text-white font-bold">{showRankUp.score}{user?.weightUnit || 'kg'}</span>.
             </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
