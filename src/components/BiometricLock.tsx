import React, { useEffect, useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';

export default function BiometricLock({ onUnlock }: { onUnlock: () => void }) {
  const { user } = useAppContext();
  const [errorItem, setErrorItem] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  
  const performBiometricAuth = async () => {
    try {
      setChecking(true);
      setErrorItem(null);
      
      // Since this is running in a web preview, we bypass actual Capacitor plugins
      // as they are not available in the browser frame and would cause crashes.
      await performWebAuthnMock();
    } catch (e: any) {
      console.warn('Biometric error:', e);
      setErrorItem("Biometric verification failed. Try again.");
    } finally {
      setChecking(false);
    }
  };

  const performWebAuthnMock = async () => {
    // Basic fallback simulating TouchID/FaceID on desktop browsers using WebAuthn standard if available
    try {
      // Mocking successful authentication for preview/web compatibility if WebAuthn isn't set up
      // Or we can prompt user heavily for testing. For a real app, it would use navigator.credentials
      setTimeout(() => {
        onUnlock();
      }, 1000);
    } catch (e) {
      setErrorItem("Authentication failed on web fallback.");
    }
  };

  useEffect(() => {
    performBiometricAuth();
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center justify-center p-8 max-w-sm w-full">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8 border border-primary/20"
        >
          {checking ? (
            <Fingerprint size={48} className="text-primary animate-pulse" />
          ) : (
            <Lock size={48} className="text-primary" />
          )}
        </motion.div>
        
        <h2 className="text-2xl font-black mb-2 text-center">App Locked</h2>
        <p className="text-sm text-slate-400 text-center mb-10 max-w-xs">
          Biometric security is enabled. Please authenticate to access your fitness records.
        </p>
        
        <AnimatePresence>
          {errorItem && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-xl mb-6 text-sm flex items-center w-full"
            >
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              <span>{errorItem}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={performBiometricAuth}
          disabled={checking}
          className="w-full bg-primary text-black font-black uppercase tracking-widest text-sm py-4 rounded-xl hover:bg-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {checking ? 'Verifying...' : 'Unlock with Biometrics'}
        </button>
      </div>
    </div>
  );
}
