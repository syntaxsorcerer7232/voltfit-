import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, User, Download, Edit3, ShieldCheck, CheckCircle2, Loader, X, Camera } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { jsPDF } from 'jspdf';
import VerifyLiftModal from './VerifyLiftModal';
import ImageCropModal from './ImageCropModal';
import { cn } from './BottomNav';

interface Props {
  onClose: () => void;
}

export default function EditProfile({ onClose }: Props) {
  const { user, updateUser, showToast, theme } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  
  const [bio, setBio] = useState((user as any)?.bio || '');
  const [name, setName] = useState(user?.name || '');
  const [weight, setWeight] = useState(user?.weight || 0);
  const [height, setHeight] = useState(user?.height || 0);

  const [squat, setSquat] = useState(user?.lifts?.squat || 0);
  const [bench, setBench] = useState(user?.lifts?.bench || 0);
  const [deadlift, setDeadlift] = useState(user?.lifts?.deadlift || 0);

  // Auto-save logic
  useEffect(() => {
    if (!isEditing) return;
    
    setSaveStatus('saving');
    
    const timeout = setTimeout(() => {
        updateUser({
          name,
          bio,
          weight: Number(weight),
          height: Number(height),
          lifts: {
            ...user?.lifts,
            squat: Number(squat),
            bench: Number(bench),
            deadlift: Number(deadlift)
          }
        });
        
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000); // 1s debounce
    
    return () => clearTimeout(timeout);
  }, [name, bio, weight, height, squat, bench, deadlift, isEditing]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate type: JPG, PNG, WebP
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showToast("Invalid file type. Only JPG, PNG, and WebP are allowed.", "error");
        return;
      }

      // Validate size: under 5MB
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        showToast("File is too large. Image must be under 5MB.", "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);

      // Reset value so selection triggers even if the same file is selected subsequently
      e.target.value = '';
    }
  };

  const toggleEditing = () => {
      if (isEditing) {
          setIsEditing(false); // Explicitly close editing mode
          showToast("Profile Updated", "success");
      } else {
          setIsEditing(true);
      }
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica");

    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("VoltFit - Progress Report", 20, 20);

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("User Profile", 20, 45);
    
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Name: ${user.name || 'User'}`, 20, 55);
    doc.text(`Level: ${Math.floor((user.points || 0) / 1000) + 1} (Points: ${user.points || 0})`, 20, 65);
    doc.text(`Current Streak: ${user.streak || 0} days`, 20, 75);
    doc.text(`Current Weight: ${user.weight || 0} ${user.weightUnit || 'kg'}`, 20, 85);
    doc.text(`Current Height: ${user.height || 0} cm`, 20, 95);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Goals", 20, 115);
    
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Daily Calories: ${user.goals?.dailyCalories || 0} kcal`, 20, 125);
    doc.text(`Daily Steps: ${user.goals?.dailySteps || 0}`, 20, 135);
    doc.text(`Target Weight: ${user.goals?.targetWeight || 0} ${user.weightUnit || 'kg'}`, 20, 145);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Achievements", 20, 165);
    
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Total Badges Earned: ${user.badges?.length || 0}`, 20, 175);

    doc.save(`${user.name || 'User'}_VoltFit_Progress_Report.pdf`);
  };

  return (
    <motion.div 
      key="profile"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn("flex flex-col z-50 pt-8 px-6 pb-32 relative", theme === 'dark' ? "bg-[#0a0a0a] text-white" : "bg-white text-black")}
    >
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] opacity-20 pointer-events-none" />

      <header className="flex items-center justify-between mb-12 px-2 sticky top-0 z-20 bg-background/60 backdrop-blur-3xl py-6 border-b border-card-border shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
         <div className="flex items-center gap-4 cursor-pointer group" onClick={onClose}>
           <div className="p-3 bg-surface-elevated border border-card-border rounded-xl group-hover:scale-110 group-hover:rotate-[-5deg] transition-all shadow-xl shadow-black/20">
             <ChevronLeft size={24} strokeWidth={3} className="text-muted group-hover:text-foreground" />
           </div>
           <div className="flex flex-col">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Identity</h2>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-40 mt-2">Dossier Access</span>
           </div>
         </div>
         <div className="flex items-center gap-4">
             {isEditing && (
                 <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20 animate-in fade-in">
                    {saveStatus === 'saving' && <Loader size={12} className="animate-spin text-primary" />} 
                    {saveStatus === 'saved' && 'Synced •'}
                 </span>
             )}
             <button onClick={toggleEditing} className="text-primary bg-primary/10 border border-primary/20 rounded-2xl p-4 hover:scale-110 transition-all active:scale-95 shadow-xl shadow-primary/5">
                {isEditing ? <X size={20} strokeWidth={3} /> : <Edit3 size={20} strokeWidth={3} />}
             </button>
         </div>
      </header>


      <div className="space-y-6 pb-24">
         <div className="flex flex-col items-center mb-16 relative">
           <label className="relative cursor-pointer group">
             <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={!isEditing} />
             <div className="w-32 h-32 rounded-[2.5rem] bg-neutral-900 border-4 border-white/5 flex items-center justify-center mb-6 overflow-hidden shadow-2xl relative">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
               ) : (
                  <User size={48} className="text-muted opacity-40 group-hover:text-primary transition-colors" />
               )}
               {isEditing && (
                   <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={32} className="text-white" strokeWidth={3} />
                   </div>
               )}
             </div>
           </label>
           <div className="flex items-center gap-3">
              <div className="h-[1px] w-8 bg-primary/20" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">Active Avatar</span>
              <div className="h-[1px] w-8 bg-primary/20" />
           </div>
         </div>

         <div className="space-y-1">
           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Name</label>
           {isEditing ? (
             <input 
               type="text" 
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full bg-white/5 border border-primary/50 rounded-2xl py-4 px-6 text-lg font-black focus:outline-none transition-colors"
               placeholder="Your name"
             />
           ) : (
             <div className="w-full bg-transparent border border-white/5 rounded-2xl py-4 px-6 text-lg font-black text-white/90">
               {name || 'Anonymous'}
             </div>
           )}
         </div>

         <div className="space-y-1">
           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Bio</label>
           {isEditing ? (
             <textarea 
               value={bio}
               onChange={(e) => setBio(e.target.value)}
               rows={3}
               className="w-full bg-white/5 border border-primary/50 rounded-2xl py-4 px-6 text-lg font-black focus:outline-none transition-colors resize-none"
               placeholder="Tell us about yourself..."
             />
           ) : (
             <div className="w-full bg-transparent border border-white/5 rounded-2xl py-4 px-6 text-lg font-black min-h-[100px] text-white/90 whitespace-pre-wrap">
               {bio || 'No bio provided.'}
             </div>
           )}
         </div>

         <div className="space-y-1">
           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Weight ({user?.weightUnit || 'kg'})</label>
           {isEditing ? (
             <input 
               type="number" 
               value={weight || ''}
               onChange={(e) => setWeight(Number(e.target.value))}
               className="w-full bg-white/5 border border-primary/50 rounded-2xl py-4 px-6 text-lg font-black focus:outline-none transition-colors"
             />
           ) : (
             <div className="w-full bg-transparent border border-white/5 rounded-2xl py-4 px-6 text-lg font-black text-white/90">
               {weight || 0}
             </div>
           )}
         </div>

         <div className="space-y-1">
           <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Height (cm)</label>
           {isEditing ? (
             <input 
               type="number" 
               value={height || ''}
               onChange={(e) => setHeight(Number(e.target.value))}
               className="w-full bg-white/5 border border-primary/50 rounded-2xl py-4 px-6 text-lg font-black focus:outline-none transition-colors"
             />
           ) : (
             <div className="w-full bg-transparent border border-white/5 rounded-2xl py-4 px-6 text-lg font-black text-white/90">
               {height || 0}
             </div>
           )}
         </div>

         <div className="pt-4 pb-2">
            <h3 className="text-white font-bold text-sm">Personal Records (1RM)</h3>
            <p className="text-[10px] text-slate-500">Determines your Community Rank.</p>
         </div>

         <div className="flex gap-2">
             <div className="space-y-1 flex-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Squat</label>
                {isEditing ? (
                  <input type="number" value={squat || ''} onChange={(e) => setSquat(Number(e.target.value))} className="w-full bg-white/5 border border-primary/50 rounded-xl py-3 px-4 text-sm font-black focus:outline-none transition-colors" />
                ) : (
                  <div className="w-full bg-transparent border border-white/5 rounded-xl py-3 px-4 text-sm font-black text-white/90">{squat || 0}</div>
                )}
             </div>
             <div className="space-y-1 flex-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Bench</label>
                {isEditing ? (
                  <input type="number" value={bench || ''} onChange={(e) => setBench(Number(e.target.value))} className="w-full bg-white/5 border border-primary/50 rounded-xl py-3 px-4 text-sm font-black focus:outline-none transition-colors" />
                ) : (
                  <div className="w-full bg-transparent border border-white/5 rounded-xl py-3 px-4 text-sm font-black text-white/90">{bench || 0}</div>
                )}
             </div>
             <div className="space-y-1 flex-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Deadlift</label>
                {isEditing ? (
                  <input type="number" value={deadlift || ''} onChange={(e) => setDeadlift(Number(e.target.value))} className="w-full bg-white/5 border border-primary/50 rounded-xl py-3 px-4 text-sm font-black focus:outline-none transition-colors" />
                ) : (
                  <div className="w-full bg-transparent border border-white/5 rounded-xl py-3 px-4 text-sm font-black text-white/90">{deadlift || 0}</div>
                )}
             </div>
         </div>

         <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 mt-6">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className={user?.lifts?.verified ? 'text-primary' : 'text-slate-500'} />
                  <h4 className="text-white font-bold text-sm">Lift Verification</h4>
               </div>
               {user?.lifts?.verified ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#111] bg-primary px-2 py-1 rounded-md flex items-center gap-1">
                    Verified <CheckCircle2 size={12} />
                  </span>
               ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/10 px-2 py-1 rounded-md">
                    Unverified
                  </span>
               )}
            </div>
            
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {user?.lifts?.verified 
                ? 'Your PRs have been verified by administrators. This builds trust in the community.'
                : 'Submit video proof or log links to get a Verified Badge on your profile and advice.'}
            </p>

            {!user?.lifts?.verified && (
               <button 
                 onClick={() => setIsVerifyModalOpen(true)}
                 className="w-full bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-white/10 transition-colors"
               >
                 Request Verification
               </button>
            )}
         </div>

         <div className="pt-10 space-y-4">
           <button 
             onClick={handleDownloadReport}
             className="w-full bg-[#84cc16]/10 border border-[#84cc16]/30 text-[#84cc16] py-4 rounded-xl font-bold tracking-wider text-sm flex items-center justify-center transition-colors hover:bg-[#84cc16]/20"
           >
             <Download size={18} className="mr-2" /> Download Progress Report
           </button>
           <p className="text-xs text-slate-500 font-medium text-center leading-relaxed">
             Your profile details will be updated securely in Firestore.
           </p>
         </div>
      </div>
      <VerifyLiftModal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} />
       {imageToCrop && (
         <ImageCropModal
           isOpen={isCropModalOpen}
           onClose={() => {
             setIsCropModalOpen(false);
             setImageToCrop(null);
           }}
           imageSrc={imageToCrop}
           onCropSave={(croppedBase64) => {
             updateUser({ profilePicture: croppedBase64 });
             showToast("Profile picture updated", "success");
           }}
           theme={theme as 'dark' | 'light'}
         />
       )}
    </motion.div>
  );
}

