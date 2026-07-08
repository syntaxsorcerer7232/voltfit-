import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './BottomNav';

export default function SyncStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setIsSyncing(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setIsSyncing(true);
      // Simulate sync duration or wait for Firestore to sync
      setTimeout(() => {
        setIsSyncing(false);
      }, 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(isOffline || isSyncing) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-safe-top inset-x-0 z-[150] flex justify-center pointer-events-none mt-2 px-4"
        >
          <div className={cn(
            "flex items-center px-4 py-2 rounded-full shadow-lg backdrop-blur-md border text-xs font-black uppercase tracking-widest pointer-events-auto",
            isOffline 
              ? "bg-rose-500/10 border-rose-500/20 text-rose-500" 
              : "bg-[#84cc16]/10 border-[#84cc16]/20 text-[#84cc16]"
          )}>
            {isOffline ? (
              <>
                <WifiOff size={14} className="mr-2" />
                Offline Mode Active
              </>
            ) : (
              <>
                <RefreshCw size={14} className="mr-2 animate-spin" />
                Syncing Changes...
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
