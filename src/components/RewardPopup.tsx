import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, TrendingUp } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function RewardPopup() {
  const { recentRewards, clearRecentRewards } = useAppContext();
  const [currentReward, setCurrentReward] = useState<{ points: number, reason: string, id: string } | null>(null);

  useEffect(() => {
    if (recentRewards.length > 0 && !currentReward) {
      setCurrentReward(recentRewards[0]);
    }
  }, [recentRewards, currentReward]);

  const handleClose = () => {
    if (recentRewards.length > 1) {
      const nextId = recentRewards[1].id;
      clearRecentRewards(currentReward?.id);
      // Wait for next cycle to pick up the next one or set it directly if we want immediate
      setCurrentReward(null); 
    } else {
      clearRecentRewards(currentReward?.id);
      setCurrentReward(null);
    }
  };

  useEffect(() => {
    if (currentReward) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentReward]);

  return (
    <AnimatePresence>
      {currentReward && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
            className="bg-black/80 backdrop-blur-xl border-2 border-primary/50 px-6 py-4 rounded-3xl shadow-[0_0_40px_rgba(132,204,22,0.4)] flex flex-col items-center min-w-[200px]"
          >
            <motion.div 
               animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
               transition={{ duration: 0.5 }}
               className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-2 shadow-[0_0_20px_#84cc16]"
            >
               <Zap size={24} className="text-black" fill="currentColor" />
            </motion.div>
            
            <div className="flex flex-col items-center">
              <span className="text-primary font-black text-2xl tracking-tighter italic">+{currentReward.points} PTS</span>
              <span className="text-[10px] text-white/70 font-black uppercase tracking-widest mt-1 flex items-center">
                <TrendingUp size={10} className="mr-1" />
                {currentReward.reason}
              </span>
            </div>

            {/* "First Blood" Vibe Text */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mt-2 text-[8px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black tracking-widest border border-primary/30"
            >
              LEVELING UP
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
