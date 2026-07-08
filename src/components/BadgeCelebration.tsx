import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Award, Sparkles } from 'lucide-react';
import { BadgeDef } from '../utils/gamification';
import { useAppContext } from '../context/AppContext';

export default function BadgeCelebration() {
  const { recentBadges, clearRecentBadges } = useAppContext();
  const [currentBadge, setCurrentBadge] = useState<BadgeDef | null>(null);

  useEffect(() => {
    if (recentBadges.length > 0 && !currentBadge) {
      setCurrentBadge(recentBadges[0]);
    }
  }, [recentBadges, currentBadge]);

  const handleClose = () => {
    if (recentBadges.length > 1) {
      clearRecentBadges(currentBadge?.id);
      setCurrentBadge(recentBadges[1]);
    } else {
      setCurrentBadge(null);
      clearRecentBadges(currentBadge?.id);
    }
  };

  useEffect(() => {
    if (currentBadge) {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentBadge]);

  return (
    <AnimatePresence>
      {currentBadge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -50 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-0 pointer-events-none"
        >
          {/* Confetti / Particle effect container could go here */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={handleClose} />
          
          <div className="bg-neutral-900 border border-[#84cc16]/30 rounded-[2.5rem] p-8 max-w-sm w-full relative pointer-events-auto overflow-hidden shadow-[0_0_50px_rgba(132,204,22,0.15)] flex flex-col items-center text-center">
            
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#84cc16]/20 rounded-full blur-[3rem] pointer-events-none" />

            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={16} className="text-slate-400" />
            </button>

            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#84cc16] to-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-neutral-900 z-10 relative">
                {currentBadge.icon}
              </div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 border border-[#84cc16]/30 rounded-full border-dashed"
              />
              <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={24} />
              <Sparkles className="absolute -bottom-2 -left-2 text-yellow-500 animate-pulse delay-75" size={20} />
            </div>

            <span className="text-[#84cc16] font-black uppercase tracking-widest text-xs mb-2">Achievement Unlocked!</span>
            <h3 className="text-2xl font-black italic tracking-tighter mb-2">{currentBadge.title}</h3>
            <p className="text-sm text-neutral-400 mb-6 font-medium px-4">{currentBadge.description}</p>

            <div className="bg-black/50 border border-white/5 py-3 px-6 rounded-2xl flex items-center space-x-3 w-full justify-center">
               <Award className="text-[#84cc16]" size={18} />
               <span className="font-bold text-slate-300">+{currentBadge.pointsReward} Points</span>
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
