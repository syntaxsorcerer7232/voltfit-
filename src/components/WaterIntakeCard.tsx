import React from 'react';
import { Droplets } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext, useAppLogs } from '../context/AppContext';

export default React.memo(function WaterIntakeCard() {
    const { user, addWater } = useAppContext();
    const { waterIntake } = useAppLogs();
    const waterGoal = user.waterIntakeGoal || 2000;
    
    // Calculate today's water
    const today = new Date().toISOString().split('T')[0];
    const todayWater = waterIntake.filter(w => w.date === today).reduce((acc, log) => acc + log.amountMl, 0);

    const progressPercentage = Math.min(100, (todayWater / waterGoal) * 100);

    return (
        <div className="glass-card p-6 rounded-3xl flex flex-col relative overflow-hidden group">
            {/* Ambient Background glow */}
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 z-10 relative">
              <Droplets size={16} className="mr-1 text-secondary" /> Hydration
            </div>
            
            <div className="text-3xl font-extrabold mb-1 z-10 relative">
              {(todayWater / 1000).toFixed(1)} <span className="text-xs text-slate-500 font-bold">/ {(waterGoal/1000).toFixed(1)} L</span>
            </div>

            {/* Wave-Pulse Progress Animation */}
            <div className="w-full h-8 bg-surface-elevated rounded-xl my-4 relative overflow-hidden ring-1 ring-card-border flex shrink-0 shadow-inner">
              <motion.div 
                 className="absolute top-0 left-0 h-full bg-gradient-to-r from-secondary to-secondary/80 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                 initial={{ width: 0 }} 
                 animate={{ width: `${progressPercentage}%` }}
                 transition={{ duration: 1, ease: "easeOut" }}
              />
              {/* Pulse effect over the progress bar */}
              <motion.div 
                 className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                 animate={{ left: ['-20%', '120%'] }}
                 transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-[10px] font-black text-white mix-blend-overlay uppercase tracking-widest">{Math.round(progressPercentage)}% CAPACITY</span>
              </div>
            </div>

            {/* Quick adds */}
            <div className="grid grid-cols-3 gap-2 mt-auto z-10 relative">
              {[
                { icon: '+250', ml: 250 },
                { icon: '+500', ml: 500 },
                { icon: '+750', ml: 750 }
              ].map(w => (
                <button 
                  key={w.ml}
                  onClick={() => addWater(w.ml)}
                  className="bg-surface-elevated hover:bg-secondary/10 border border-card-border hover:border-secondary/30 rounded-xl py-2.5 px-1 text-[10px] font-black text-muted hover:text-secondary uppercase tracking-widest flex justify-center transition-all active:scale-95 shadow-sm"
                >
                   {w.icon}
                </button>
              ))}
            </div>
        </div>
    );
});
