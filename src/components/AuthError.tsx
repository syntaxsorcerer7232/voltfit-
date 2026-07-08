import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, XCircle, WifiOff, ShieldAlert } from 'lucide-react';

interface AuthErrorProps {
  error: string;
  onClear?: () => void;
}

export default function AuthError({ error, onClear }: AuthErrorProps) {
  if (!error) return null;

  const getErrorIcon = (msg: string) => {
    const lowercaseError = msg.toLowerCase();
    if (lowercaseError.includes('network') || lowercaseError.includes('internet')) {
      return <WifiOff className="text-amber-500" size={18} />;
    }
    if (lowercaseError.includes('not authorized') || lowercaseError.includes('domain')) {
      return <ShieldAlert className="text-rose-500" size={18} />;
    }
    return <AlertCircle className="text-rose-500" size={18} />;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative group overflow-hidden"
      >
        <div className="bg-rose-500/10 border border-rose-500/20 backdrop-blur-md rounded-xl p-4 flex items-start space-x-3 shadow-lg">
          <div className="mt-0.5 shrink-0">
            {getErrorIcon(error)}
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-black uppercase tracking-widest text-rose-500 mb-1">
               System Alert
            </p>
            <p className="text-xs font-bold text-slate-200 leading-relaxed">
              {error}
            </p>
          </div>
          {onClear && (
            <button 
              onClick={onClear}
              className="p-1 hover:bg-white/5 rounded-full transition-colors self-start -mt-1 -mr-1"
            >
              <XCircle size={14} className="text-slate-500 group-hover:text-slate-300" />
            </button>
          )}
        </div>
        
        {/* Subtle decorative glow */}
        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-rose-500/20 blur-2xl rounded-full pointer-events-none" />
      </motion.div>
    </AnimatePresence>
  );
}
