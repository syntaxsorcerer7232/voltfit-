import React from 'react';
import { BADGES } from '../utils/gamification';
import { Trophy, Flame, Activity, Sunrise, Lock, Dumbbell } from 'lucide-react';
import { cn } from './BottomNav';

const IconMap: Record<string, React.ElementType> = {
  first_workout: Dumbbell,
  streak_master: Flame,
  steps_10k: Activity,
  early_bird: Sunrise,
};

interface BadgeGridProps {
  earnedBadges: string[];
}

export default function BadgeGrid({ earnedBadges = [] }: BadgeGridProps) {
  const allBadges = Object.values(BADGES);

  return (
    <div className="glass-card rounded-3xl p-6 border border-[#2a2a2a] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Achievements</h3>
        <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-widest">
          {earnedBadges.length} Earned
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 relative z-10">
        {allBadges.map((badge) => {
          const isEarned = earnedBadges.includes(badge.id);
          const IconComponent = IconMap[badge.id] || Trophy;

          return (
            <div 
              key={badge.id}
              title={badge.description}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center aspect-square",
                isEarned 
                  ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(132,204,22,0.15)]" 
                  : "border-[#2a2a2a] bg-[#1a1a1a] opacity-60 grayscale"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex flex-col items-center justify-center mb-2 shrink-0 transition-transform",
                isEarned ? "bg-primary/20 text-primary scale-110" : "bg-neutral-800 text-neutral-500"
              )}>
                {isEarned ? <IconComponent size={20} strokeWidth={2.5} /> : <Lock size={16} />}
              </div>
              <span className={cn(
                "text-[9px] font-bold leading-tight uppercase tracking-widest mt-auto",
                isEarned ? "text-white" : "text-neutral-500"
              )}>
                {badge.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
