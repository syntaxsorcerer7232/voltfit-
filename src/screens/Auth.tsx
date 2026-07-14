import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  browserPopupRedirectResolver 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import AuthError from '../components/AuthError';

const MAX_FAILED_ATTEMPTS = 5;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { setOnboardingCompleted } = useAppContext();

  // Helper to get today's date string
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  
  // Helper to get email doc ID
  const getEmailDocId = (email: string) => btoa(email.toLowerCase()).replace(/=/g, '');

  const checkThrottling = async (email: string) => {
    const docId = getEmailDocId(email);
    const throttleRef = doc(db, 'login_throttling', docId);
    const snap = await getDoc(throttleRef);
    
    if (snap.exists()) {
      const data = snap.data();
      const today = getTodayStr();
      
      if (data.date === today && data.attempts >= MAX_FAILED_ATTEMPTS) {
        return { blocked: true, attempts: data.attempts };
      }
      
      // If different day, reset
      if (data.date !== today) {
        await deleteDoc(throttleRef);
      }
    }
    return { blocked: false };
  };

  const recordFailure = async (email: string) => {
    const docId = getEmailDocId(email);
    const throttleRef = doc(db, 'login_throttling', docId);
    const snap = await getDoc(throttleRef);
    const today = getTodayStr();

    if (snap.exists()) {
      const data = snap.data();
      if (data.date === today) {
        await updateDoc(throttleRef, {
          attempts: data.attempts + 1,
          lastAttempt: new Date().toISOString()
        });
      } else {
        await setDoc(throttleRef, {
          attempts: 1,
          date: today,
          lastAttempt: new Date().toISOString()
        });
      }
    } else {
      await setDoc(throttleRef, {
        attempts: 1,
        date: today,
        lastAttempt: new Date().toISOString()
      });
    }
  };

  const resetFailure = async (email: string) => {
    const docId = getEmailDocId(email);
    const throttleRef = doc(db, 'login_throttling', docId);
    await deleteDoc(throttleRef);
  };

  const [isInIframe] = useState(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  });

  const clearError = () => setError('');

  React.useEffect(() => {
    if (!isFirebaseConfigured) {
      setGoogleLoading(false);
      return;
    }
    const checkRedirect = async () => {
      try {
        setGoogleLoading(true);
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // Successfully signed in via redirect!
        }
      } catch (err: any) {
        console.error("Google Redirect Result Error:", err);
        // Do not block the interface with transient redirect result errors
      } finally {
        setGoogleLoading(false);
      }
    };
    checkRedirect();
  }, []);

  const handleGoogleAuth = async () => {
    if (!isFirebaseConfigured) {
      setError('Authentication is unavailable because Firebase is not configured. Please add your VITE_FIREBASE_API_KEY in the environment settings.');
      return;
    }
    clearError();
    setGoogleLoading(true);
    
    // Safety timeout to reset loading if firebase hangs
    const timeout = setTimeout(() => {
      setGoogleLoading(false);
      setError('Auth request timed out. Please try again.');
    }, 15000);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      clearTimeout(timeout);
      // App.tsx will detect the auth change and handle the transition
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.code === 'auth/popup-closed-by-user') {
        setGoogleLoading(false);
        return;
      }
      console.error("Google Auth Error:", err);
      
      let msg = err.message || 'Google sign-in failed';
      if (err.code === 'auth/popup-blocked') {
        // Fallback: try signInWithRedirect!
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr: any) {
          console.error("Google Redirect Auth Error:", redirectErr);
          msg = "The sign-in popup was blocked by your browser. Please click the 'Open in new tab' button at the top right of the preview window to sign in.";
        }
      } else if (err.code === 'auth/network-request-failed') {
        msg = "Authentication failed due to iframe or cookie restrictions. Please click the 'Open in new tab' button at the top right of the preview window to sign in.";
      }
      
      setError(msg);
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      setError('Authentication is unavailable because Firebase is not configured.');
      return;
    }
    if (!email || !password) {
      setError('Please fill in all email and password fields');
      return;
    }
    clearError();
    setLoading(true);

    const timeout = setTimeout(() => {
      setLoading(false);
      setError('Connection timed out. Check your network.');
    }, 12000);

    try {
      if (isLogin) {
        // Check Throttling
        const throttleStatus = await checkThrottling(email);
        if (throttleStatus.blocked) {
          throw { code: 'too-many-failed-attempts', message: `Too many failed attempts. You have reached the daily limit of ${MAX_FAILED_ATTEMPTS}. Please try again tomorrow.` };
        }

        await signInWithEmailAndPassword(auth, email, password);
        await resetFailure(email);
        clearTimeout(timeout);
      } else {
        if (password.length < 6) {
          throw { code: 'auth/weak-password' };
        }
        await createUserWithEmailAndPassword(auth, email, password);
        clearTimeout(timeout);
        setOnboardingCompleted(false);
      }
    } catch (err: any) {
      clearTimeout(timeout);
      console.error("Auth error:", err);
      
      // Handle throttling recording
      if (isLogin && (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential')) {
        await recordFailure(email);
      }

      let msg = err.message || 'Authentication failed';
      
      if (err.code === 'too-many-failed-attempts') {
        msg = err.message;
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = "Authentication method not enabled. Please enable 'Email/Password' or 'Google' in your Firebase console.";
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "This account already exists. Try signing in instead.";
      } else if (err.code === 'auth/weak-password' || err.message === 'auth/weak-password') {
        msg = "Security constraint: Password must be at least 6 characters.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "The email format provided is invalid.";
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = "Identity check failed: Invalid email or password.";
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = "System error: Domain not authorized for authentication.";
      } else if (err.code === 'auth/network-request-failed') {
        msg = "Transmission failure: Check your internet connection.";
      } else if (err.code === 'auth/too-many-requests') {
        msg = "Access blocked: Too many attempts. Please wait a few minutes.";
      }
      
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-(--color-background) text-(--color-foreground) w-full max-w-md mx-auto relative shader-bg justify-center p-6">
      <div className="absolute top-10 w-full text-center left-0 px-6">
         <h1 className="text-3xl font-extrabold tracking-tighter">VoltFit</h1>
         <p className="text-slate-400 mt-2 text-sm font-medium">Log in to track your progress & earn badges.</p>
         {isInIframe && (
           <div className="mt-3 mx-auto max-w-xs p-2.5 bg-[#84cc16]/10 border border-[#84cc16]/20 rounded-xl text-[11px] text-[#a3e635] text-center font-semibold">
             💡 Running in preview: Click "Open in new tab" at top-right for Google Sign-In
           </div>
         )}
         {!isFirebaseConfigured && (
           <div className="mt-3 mx-auto max-w-xs p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200 text-center">
             <p className="font-bold mb-1 uppercase tracking-wider">⚠️ System Standalone Mode</p>
             Firebase is not configured. Authentication and cloud features are disabled. Please set <code className="bg-amber-900/40 px-1 rounded">VITE_FIREBASE_API_KEY</code> to enable.
           </div>
         )}
      </div>

      <div className="glass-card rounded-3xl p-6 mt-20 relative z-10 border border-[#2a2a2a] shadow-2xl">
         <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence>
               {!isLogin && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                   <div className="relative">
                      <UserPlus className="absolute left-3 top-3 text-slate-500" size={18} />
                      <input 
                         type="text" 
                         value={name}
                         onChange={e => setName(e.target.value)}
                         placeholder="Full Name" 
                         className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#84cc16] transition-colors text-sm text-white"
                         required={!isLogin}
                      />
                   </div>
                 </motion.div>
               )}
            </AnimatePresence>

            <div className="relative">
               <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
               <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address" 
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#84cc16] transition-colors text-sm text-white"
                  required
               />
            </div>
            
            <div className="relative">
               <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
               <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password" 
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#84cc16] transition-colors text-sm text-white"
                  required
               />
            </div>

            <AuthError error={error} onClear={clearError} />
            
            <button 
               type="submit" 
               disabled={loading || googleLoading}
               className="w-full bg-[#84cc16] hover:bg-[#65a30d] text-black font-black py-4 rounded-xl flex items-center justify-center tracking-wider text-sm transition-transform active:scale-95 shadow-[0_0_20px_rgba(132,204,22,0.3)] disabled:opacity-50"
            >
               {loading ? 'PROCESSING...' : (
                 <span className="flex items-center">
                   {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
                   <ArrowRight size={16} className="ml-2" />
                 </span>
               )}
            </button>

            <div className="relative flex items-center justify-center py-2">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2a2a2a]"></div>
               </div>
               <span className="relative px-4 bg-background text-[10px] font-bold text-slate-500 uppercase tracking-widest">OR</span>
            </div>

            <button 
               type="button"
               disabled={loading || googleLoading}
               onClick={handleGoogleAuth}
               className="w-full bg-white hover:bg-neutral-100 text-black font-black py-4 rounded-xl flex items-center justify-center tracking-wider text-sm transition-transform active:scale-95 shadow-lg disabled:opacity-50"
            >
               {googleLoading ? (
                 <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    CONNECTING...
                 </span>
               ) : (
                 <>
                   <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.13l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                   </svg>
                   {isLogin ? 'GOOGLE SIGN IN' : 'GOOGLE SIGN UP'}
                 </>
               )}
            </button>
         </form>

         <div className="text-center mt-6">
            <button onClick={() => setIsLogin(!isLogin)} type="button" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
               {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </button>
         </div>
      </div>
    </div>
  );
}
