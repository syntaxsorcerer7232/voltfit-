import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Share2, Award, Flame, Activity } from 'lucide-react';
import { useAppContext, useAppLogs } from '../context/AppContext';
import html2canvas from 'html2canvas';

interface Props {
  onClose: () => void;
}

export default function ShareSummaryModal({ onClose }: Props) {
  const { user, streak } = useAppContext();
  const { dailySteps } = useAppLogs();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      setIsSharing(true);
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // High resolution
        backgroundColor: '#000000',
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSharing(false);
          return;
        }

        const file = new File([blob], 'my-fitness-progress.png', { type: 'image/png' });
        const text = `I just hit ${dailySteps} steps and earned ${user?.points || 0} points on VoltFit! 💪🔥`;

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'My Fitness Progress',
              text,
              files: [file],
            });
          } catch (err) {
            console.log('Share canceled or failed:', err);
          }
        } else if (navigator.share) {
          // Fallback to text share
          try {
            await navigator.share({
              title: 'My Fitness Progress',
              text: text + ' Check out VoltFit!',
            });
          } catch (err) {
            console.log('Text share canceled or failed:', err);
          }
        } else {
          // Final fallback: Download the image!
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = 'my-fitness-progress.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(objectUrl);
          alert("Image downloaded to your device!");
        }
        setIsSharing(false);
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image', error);
      setIsSharing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm p-safe"
    >
      <div className="flex justify-between items-center p-4">
         <h2 className="text-xl font-bold">Share Progress</h2>
         <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
           <X size={20} />
         </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
        
        {/* The Card to Screenshot */}
        <div 
          ref={cardRef} 
          className="w-full max-w-sm aspect-[4/5] bg-gradient-to-br from-neutral-900 to-black border border-white/10 rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-2xl"
        >
           {/* Background Deco */}
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
           <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full"></div>

           <div className="relative z-10 flex flex-col h-full">
             {/* Header */}
             <div className="flex items-center space-x-3 mb-8 border-b border-white/5 pb-6">
                <div className="w-14 h-14 rounded-full bg-neutral-800 border-2 border-primary/50 flex items-center justify-center overflow-hidden shrink-0">
                  {user?.profilePicture ? <img src={user.profilePicture} alt="User" /> : <span className="text-xl font-bold">{user?.name?.charAt(0) || 'U'}</span>}
                </div>
                <div>
                   <h3 className="text-2xl font-black bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                     {user?.name || 'Athlete'}
                   </h3>
                   <p className="text-xs text-neutral-400 font-mono tracking-widest uppercase">VoltFit</p>
                </div>
             </div>

             {/* Stats Grid */}
             <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-center border border-white/5">
                   <Activity className="text-[#06b6d4] mb-2" size={24} />
                   <div className="text-3xl font-black">{dailySteps}</div>
                   <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Steps Today</div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-center border border-white/5">
                   <Award className="text-[#f59e0b] mb-2" size={24} />
                   <div className="text-3xl font-black">{user?.points || 0}</div>
                   <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Total Points</div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-center border border-white/5 col-span-2">
                   <div className="flex items-center justify-between">
                     <div>
                       <Flame className="text-[#ef4444] mb-2" size={24} />
                       <div className="text-3xl font-black">{streak || 0} Days</div>
                       <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Current Streak</div>
                     </div>
                     {user?.badges && user.badges.length > 0 && (
                        <div className="text-right">
                          <div className="text-3xl font-black">{user.badges.length}</div>
                          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Badges Earned</div>
                        </div>
                     )}
                   </div>
                </div>
             </div>

             {/* Footer Branding */}
             <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-[0.2em]">Build your legacy // VoltFit</p>
             </div>
           </div>
        </div>

        {/* Share Action */}
        <button 
          onClick={handleShare}
          disabled={isSharing}
          className="mt-10 w-full max-w-sm py-4 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(132,204,22,0.3)] disabled:opacity-50"
        >
          {isSharing ? 'Generating Image...' : (
            <>
              Share to Story <Share2 size={18} />
            </>
          )}
        </button>

      </div>
    </motion.div>
  );
}
