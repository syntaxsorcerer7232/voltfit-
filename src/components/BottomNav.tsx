import React from 'react';
import { Home, Dumbbell, Utensils, Menu, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onSwipeUp?: (direction?: 'up' | 'left' | 'right') => void;
}

export default function BottomNav({ currentTab, setCurrentTab, onSwipeUp }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Dash' },
    { id: 'workouts', icon: Dumbbell, label: 'Train' },
    { id: 'diet', icon: Utensils, label: 'Diet' },
    { id: 'community', icon: Activity, label: 'Social' },
    { id: 'more', icon: Menu, label: 'More' },
  ];

  const handleDragEnd = (e: any, info: any) => {
    const swipeThreshold = 50;
    const { offset, velocity } = info;

    if (offset.y < -swipeThreshold || velocity.y < -500) {
      onSwipeUp?.('up');
    } else if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
      const dir = offset.x > 0 ? 'right' : 'left';
      onSwipeUp?.(dir);
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="w-full h-16 glass-card rounded-2xl flex items-center justify-around px-4 cursor-grab active:cursor-grabbing relative"
    >
      {/* Selection Capsule (Floating above) */}
      <div className="absolute inset-0 px-4 pointer-events-none">
        <div className="relative w-full h-full">
          <AnimatePresence>
            {tabs.map((tab, idx) => {
              if (currentTab !== tab.id) return null;
              return (
                <motion.div
                  key="capsule"
                  layoutId="active-nav-capsule"
                  className="absolute top-2 h-1 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.6)]"
                  style={{
                    left: `${(idx * 20) + 5}%`,
                    width: '10%',
                  }}
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[3.5rem] h-full transition-all duration-300 relative rounded-xl z-10",
              isActive ? "text-primary" : "text-slate-500 hover:text-foreground/80"
            )}
          >
            <Icon size={22} className={cn("transition-transform duration-300", isActive && "scale-110")} />
            <span className={cn(
              "text-[9px] mt-1 font-black uppercase tracking-widest transition-all duration-300",
              isActive ? "opacity-100" : "opacity-60"
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}
