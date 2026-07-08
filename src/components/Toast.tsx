import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from './BottomNav';

export const Toast: React.FC = () => {
  const { toast, hideToast, showToast, theme } = useAppContext();

  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.message) {
        showToast(detail.message, detail.type || 'info');
      }
    };
    window.addEventListener('app-toast', handleCustomToast);
    return () => window.removeEventListener('app-toast', handleCustomToast);
  }, [showToast]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className={cn(
            "fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border",
            theme === 'dark' ? "bg-neutral-900/90 border-white/10" : "bg-white/90 border-black/5"
          )}
        >
          {toast.type === 'success' && <CheckCircle className="text-green-500 w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="text-blue-500 w-5 h-5 flex-shrink-0" />}
          
          <span className={cn(
             "text-sm font-bold tracking-tight",
             theme === 'dark' ? "text-white" : "text-black"
          )}>
            {toast.message}
          </span>
          
          <button 
            onClick={hideToast}
            className={cn(
              "p-1 rounded-full hover:bg-black/10 transition-colors ml-2 flex-shrink-0",
              theme === 'dark' ? "hover:bg-white/10" : "hover:bg-black/5"
            )}
          >
            <X className={theme === 'dark' ? "text-white/50" : "text-black/50"} size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
