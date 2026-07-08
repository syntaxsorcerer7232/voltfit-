import React from 'react';
import { MessageSquareDashed } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionText, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-[#1a1a1a] rounded-[2.5rem] border border-[#2a2a2a] my-4 max-w-md mx-auto">
      <div className="bg-primary/10 p-5 rounded-full mb-5 text-primary shadow-[0_0_30px_rgba(var(--color-primary),0.2)]">
        {icon || <MessageSquareDashed size={40} />}
      </div>
      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">{title}</h3>
      <p className="text-sm text-slate-400 mb-8 max-w-xs leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="bg-primary text-black font-black uppercase tracking-widest py-3 px-8 rounded-xl hover:bg-primary/90 transition-all active:scale-95 text-xs shadow-lg shadow-primary/20"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
