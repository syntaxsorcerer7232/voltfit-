import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, CheckCircle2, Video, FileText } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function VerifyLiftModal({ isOpen, onClose }: Props) {
  const { user, updateUser } = useAppContext();
  const [method, setMethod] = useState<'video' | 'log' | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!method || !fileUrl) return;

    setIsSubmitting(true);
    
    // Mock API call to some admin queue
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      // Mock instant approval for the prototype
      updateUser({
        ...user!,
        lifts: {
          ...user?.lifts,
          verified: true
        }
      });
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setMethod(null);
        setFileUrl('');
      }, 2000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           className="relative w-full max-w-sm bg-[#111] rounded-[2rem] p-6 border border-[#222] shadow-2xl relative z-10"
        >
          <button 
             onClick={onClose}
             className="absolute top-4 right-4 bg-white/5 p-2 rounded-full text-slate-400 hover:text-white transition-colors"
          >
             <X size={18} />
          </button>

          <div className="mb-6">
             <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={24} className="text-primary" />
             </div>
             <h2 className="text-xl font-black text-white">Verify Your PRs</h2>
             <p className="text-sm text-slate-400 mt-1 leading-relaxed">
               Get the <span className="text-primary font-bold">Verified Lift Badge</span> to establish trust in the community.
             </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                 <button
                   type="button"
                   onClick={() => setMethod('video')}
                   className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                     method === 'video' ? 'bg-primary/10 border-primary text-primary' : 'bg-[#1a1a1a] border-[#333] text-slate-400'
                   }`}
                 >
                   <Video size={24} />
                   <span className="text-xs font-bold uppercase tracking-widest">Video</span>
                 </button>
                 <button
                   type="button"
                   onClick={() => setMethod('log')}
                   className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                     method === 'log' ? 'bg-primary/10 border-primary text-primary' : 'bg-[#1a1a1a] border-[#333] text-slate-400'
                   }`}
                 >
                   <FileText size={24} />
                   <span className="text-xs font-bold uppercase tracking-widest">App Log</span>
                 </button>
              </div>

              {method && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">
                       {method === 'video' ? 'Video Link (YouTube/Insta)' : 'Workout Log ID Link'}
                    </label>
                    <input 
                       type="text"
                       required
                       value={fileUrl}
                       onChange={(e) => setFileUrl(e.target.value)}
                       placeholder="https://..."
                       className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  
                  <button 
                     type="submit"
                     disabled={isSubmitting || !fileUrl}
                     className="w-full bg-primary text-black font-black uppercase tracking-widest py-3 rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                     ) : (
                        <>Submit for Review <Upload size={16} /></>
                     )}
                  </button>
                </motion.div>
              )}
            </form>
          ) : (
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="py-10 flex flex-col items-center text-center space-y-4"
            >
               <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-green-500" />
               </div>
               <div>
                 <h3 className="text-white font-black text-xl mb-2">Submitted!</h3>
                 <p className="text-sm text-slate-400 px-4">Your lifts are now verified and the badge has been awarded.</p>
               </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
