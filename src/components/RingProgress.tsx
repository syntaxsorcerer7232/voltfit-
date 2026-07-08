import React from 'react';

interface RingProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  icon?: React.ReactNode;
  label?: string;
  subLabel?: string;
}

export default function RingProgress({
  progress,
  size = 100,
  strokeWidth = 8,
  color = '#84cc16',
  icon,
  label,
  subLabel
}: RingProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - Math.max(0, Math.min(1, progress)) * circumference;

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90 absolute top-0 left-0"
          width={size}
          height={size}
        >
          {/* Background Ring */}
          <circle
            className="text-neutral-800"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress Ring */}
          <circle
            className="transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke={color}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          {icon && <div className="mb-1" style={{ color }}>{icon}</div>}
          {label && <span className="font-bold text-sm tracking-tighter" style={{ color }}>{label}</span>}
        </div>
      </div>
      {subLabel && <span className="text-xs text-neutral-400 font-medium">{subLabel}</span>}
    </div>
  );
}
