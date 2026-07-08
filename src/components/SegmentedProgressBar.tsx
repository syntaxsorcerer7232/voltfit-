import React from 'react';
import { motion } from 'motion/react';
import { cn } from './BottomNav';

interface SegmentedProgressBarProps {
  value: number; // 0 to 100
  onChange: (value: number) => void;
  segments?: number;
  color?: string;
  activeColor?: string;
}

const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = ({
  value,
  onChange,
  segments = 20,
  color = 'bg-neutral-800',
  activeColor = 'bg-[#00D1FF]'
}) => {
  return (
    <div className="relative h-6 flex items-end gap-1 px-1 group/segmented">
      {Array.from({ length: segments }).map((_, i) => {
        const threshold = (i / segments) * 100;
        const isActive = value > threshold;
        return (
          <motion.div
            key={i}
            initial={false}
            animate={{ 
              height: isActive ? `${25 + (i * (75/segments) * 1.5)}%` : '15%',
              opacity: isActive ? 1 : 0.2
            }}
            className={cn(
              "flex-1 rounded-sm transition-all duration-300",
              isActive ? activeColor + " shadow-[0_0_8px_rgba(0,209,255,0.4)]" : color
            )}
            onClick={() => onChange(Math.round(((i + 1) / segments) * 100))}
            onMouseEnter={(e) => {
               if (e.buttons === 1) onChange(Math.round(((i + 1) / segments) * 100));
            }}
          />
        );
      })}
      
      {/* Hidden Range Input for Accessibility & Continuous Control */}
      <input 
        type="range" 
        min="0" max="100" 
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
    </div>
  );
};

export default SegmentedProgressBar;
