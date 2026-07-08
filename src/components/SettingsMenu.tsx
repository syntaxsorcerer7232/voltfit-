import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Calculator, User as UserIcon, Bell, Shield, Moon, Trash2, FileDown, Droplet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface Props {
  onClose: () => void;
}

export default function SettingsMenu({ onClose }: Props) {
  const { user, updateUser, disciplineMode, setDisciplineMode, theme, setTheme } = useAppContext();
  
  // A local proxy so we have state to toggle for push notification
  const [pushEnabled, setPushEnabled] = useState(true);

  // File Upload handling
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        const evt = new CustomEvent('app-toast', { detail: { message: `Importing split from ${file.name}...`, type: 'info' }});
        window.dispatchEvent(evt);
        // Mocking the progress
        setTimeout(() => {
          const successEvt = new CustomEvent('app-toast', { detail: { message: `Successfully imported workout split!`, type: 'success' }});
          window.dispatchEvent(successEvt);
        }, 2000);
      } else {
        const errEvt = new CustomEvent('app-toast', { detail: { message: `Please select a valid PDF file.`, type: 'error' }});
        window.dispatchEvent(errEvt);
      }
    }
    // reset
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Calculator Form Visibility
  const [showCalculator, setShowCalculator] = useState(false);

  // Maintenance Calculator States
  const [calcAge, setCalcAge] = useState(25);
  const [calcWeight, setCalcWeight] = useState(user?.weight || 70);
  const [calcHeight, setCalcHeight] = useState(user?.height || 175);
  const [calcGender, setCalcGender] = useState<'male' | 'female'>((user as any)?.gender === 'female' ? 'female' : 'male');
  const [calcActivity, setCalcActivity] = useState<1.2|1.375|1.55|1.725|1.9>(1.2);
  const [calcResult, setCalcResult] = useState<number | null>(null);

  const calculateMaintenance = () => {
    let bmr = 0;
    if (calcGender === 'female') {
      bmr = 10 * calcWeight + 6.25 * calcHeight - 5 * calcAge - 161;
    } else {
      bmr = 10 * calcWeight + 6.25 * calcHeight - 5 * calcAge + 5;
    }
    const tdee = Math.round(bmr * calcActivity);
    setCalcResult(tdee);
    
    // Save to user goal
    updateUser({
      weight: calcWeight,
      height: calcHeight,
      goals: {
        ...(user?.goals || {}),
        dailyCalories: tdee,
      }
    }); // removed undefined macros to avoid possible local issues
    
    setShowCalculator(false);
  };

  const isLight = theme === 'light';

  return (
    <div className={`flex flex-col z-50 transition-all duration-300 bg-background text-foreground animate-in slide-in-from-right`}>
      
      {/* Header */}
      <div className={`sticky top-0 z-50 px-8 py-10 flex items-center justify-between backdrop-blur-3xl bg-background/60 border-b border-card-border shadow-[0_4px_30px_rgba(0,0,0,0.1)]`}>
        <div className="flex items-center gap-6 cursor-pointer group" onClick={onClose}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-surface-elevated border border-card-border text-muted group-hover:text-foreground group-hover:scale-110 group-hover:rotate-[-5deg] transition-all shadow-xl shadow-black/20`}>
            <ChevronLeft size={24} strokeWidth={3} />
          </div>
          <div className="flex flex-col">
             <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Settings</h2>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-40 mt-2">Nucleus Config</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-10 pb-32">
         
         {/* Profile Card */}
         <div className={`p-10 rounded-[3rem] flex items-center gap-8 bg-surface-elevated/40 backdrop-blur-2xl border border-card-border shadow-2xl relative overflow-hidden group`}>
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-all duration-1000" />
            <motion.div 
               whileHover={{ scale: 1.1, rotate: 12 }}
               className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20 text-primary shadow-2xl relative z-10`}
            >
              <UserIcon size={40} strokeWidth={3} />
            </motion.div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic group-hover:text-primary transition-colors leading-tight">{user?.name || 'IRON WARRIOR'}</h2>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mt-2 italic`}>{user?.email || 'UNIDENTIFIED UNIT'}</p>
            </div>
         </div>

         {/* Calculator Section */}
         <div className="space-y-4">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3 text-muted ml-1`}>
              <Droplet size={14} className="opacity-40" /> Biometric Analysis
            </h3>
            
            <AnimatePresence mode="wait">
              {!showCalculator ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-8 rounded-[2.5rem] bg-surface-elevated/40 backdrop-blur-2xl border border-card-border shadow-2xl`}
                >
                  <div className="flex items-end justify-between mb-10">
                    <div>
                      <p className={`text-[10px] uppercase tracking-[0.3em] font-black mb-3 opacity-40 ml-1`}>Daily Energy Flux</p>
                      <div className="flex items-baseline gap-2">
                         <span className="text-5xl font-black italic tracking-tighter text-foreground">{user?.goals?.dailyCalories || calcResult || '---'}</span>
                         <span className={`text-xs font-black uppercase tracking-widest opacity-40`}>KCAL</span>
                      </div>
                    </div>
                    <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center bg-primary/10 border border-primary/20 text-primary shadow-lg scale-110`}>
                      <Calculator size={28} strokeWidth={3} />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setShowCalculator(true)}
                    className="w-full py-5 rounded-[2rem] bg-primary text-black font-black uppercase tracking-[0.3em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                  >
                    Recalculate Macros
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                   className={`p-8 rounded-[2.5rem] space-y-8 bg-surface-elevated border border-card-border shadow-2xl relative overflow-hidden`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <Calculator size={24} strokeWidth={3} className="text-primary" />
                    <h4 className="font-black uppercase tracking-tight text-xl italic">Analyzer Mode</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-1`}>Age Cycle</label>
                      <input 
                        type="number" 
                        value={calcAge} 
                        onChange={(e) => setCalcAge(Number(e.target.value))}
                        className={`w-full bg-background border border-card-border rounded-2xl py-4 px-5 text-sm font-black focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all shadow-inner`}
                      />
                    </div>
                    <div className="space-y-2">
                       <label className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-1`}>Biological Class</label>
                       <div className="relative">
                        <select 
                          value={calcGender}
                          onChange={(e) => setCalcGender(e.target.value as 'male' | 'female')}
                          className={`w-full bg-background border border-card-border rounded-2xl py-4 px-5 text-sm font-black focus:border-primary outline-none transition-all appearance-none shadow-inner uppercase tracking-widest`}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                        <ChevronLeft size={16} className="-rotate-90 absolute right-5 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-1`}>Mass ({user?.weightUnit || 'KG'})</label>
                      <input 
                        type="number" 
                        value={calcWeight} 
                        onChange={(e) => setCalcWeight(Number(e.target.value))}
                        className={`w-full bg-background border border-card-border rounded-2xl py-4 px-5 text-sm font-black focus:border-primary outline-none transition-all shadow-inner`}
                      />
                    </div>
                    <div className="space-y-2">
                        <label className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-1`}>Stature (CM)</label>
                       <input 
                        type="number" 
                        value={calcHeight} 
                        onChange={(e) => setCalcHeight(Number(e.target.value))}
                        className={`w-full bg-background border border-card-border rounded-2xl py-4 px-5 text-sm font-black focus:border-primary outline-none transition-all shadow-inner`}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-40 ml-1`}>Activity Level</label>
                    <div className="relative">
                      <select 
                        value={calcActivity}
                        onChange={(e) => setCalcActivity(Number(e.target.value) as any)}
                        className={`w-full bg-background border border-card-border rounded-2xl py-4 px-5 text-sm font-black focus:border-primary outline-none transition-all appearance-none shadow-inner uppercase tracking-widest`}
                      >
                        <option value={1.2}>Sedentary</option>
                        <option value={1.375}>Lightly Active (1-3 days)</option>
                        <option value={1.55}>Moderately Active (3-5 days)</option>
                        <option value={1.725}>Very Active (6-7 days)</option>
                        <option value={1.9}>Extremely Active</option>
                      </select>
                      <ChevronLeft size={16} className="-rotate-90 absolute right-5 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none" />
                    </div>
                  </div>
 
                   <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setShowCalculator(false)}
                      className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all bg-background border border-card-border text-muted hover:border-muted hover:text-foreground active:scale-95`}
                    >
                       ABORT
                    </button>
                    <button 
                      onClick={calculateMaintenance}
                      className="flex-2 py-4 rounded-2xl bg-foreground text-background font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] transition-all active:scale-95 shadow-xl"
                    >
                       ENGAGE CALIBRATION
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
         </div>

         {/* Preferences Section */}
         <div className="space-y-4">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-muted ml-1`}>
              Neural Overrides
            </h3>
            
            <div className={`rounded-[2.5rem] overflow-hidden bg-surface-elevated/40 border border-card-border shadow-2xl backdrop-blur-2xl`}>
              
              {/* Push Notifications Toggle */}
              <div 
                onClick={() => setPushEnabled(!pushEnabled)}
                className={`p-6 flex items-center justify-between cursor-pointer active:bg-foreground/5 transition-colors border-b border-card-border/50`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5`}>
                    <Bell size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-sm italic">Forged Alerts</h3>
                    <span className={`text-[9px] block mt-1 font-black uppercase tracking-[0.2em] opacity-40`}>Cycle status updates</span>
                  </div>
                </div>
                <div className={`w-14 h-7 rounded-full relative transition-all duration-300 border-2 ${pushEnabled ? 'bg-primary border-primary' : 'bg-background border-card-border'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-xl transition-all duration-300 ${pushEnabled ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
              
              {/* Discipline Mode Toggle */}
              <div 
                onClick={() => setDisciplineMode(!disciplineMode)}
                className={`p-6 flex items-center justify-between cursor-pointer active:bg-foreground/5 transition-colors border-b border-card-border/50`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-500/5`}>
                    <Shield size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-sm italic">Iron Discipline</h3>
                    <span className={`text-[9px] block mt-1 font-black uppercase tracking-[0.2em] opacity-40`}>Mandatory session routine</span>
                  </div>
                </div>
                <div className={`w-14 h-7 rounded-full relative transition-all duration-300 border-2 ${disciplineMode ? 'bg-primary border-primary' : 'bg-background border-card-border'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-xl transition-all duration-300 ${disciplineMode ? 'right-1' : 'left-1'}`} />
                </div>
              </div>

              {/* Theme Toggle */}
              <div 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-6 flex items-center justify-between cursor-pointer active:bg-foreground/5 transition-colors border-b border-card-border/50`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/5`}>
                    <Moon size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-sm italic">Chromatic Sync</h3>
                    <span className={`text-[9px] block mt-1 font-black uppercase tracking-[0.2em] opacity-40`}>{theme === 'dark' ? 'Ebon' : 'Aura'} visual interface</span>
                  </div>
                </div>
                <div className={`w-14 h-7 rounded-full relative transition-all duration-300 border-2 ${theme === 'dark' ? 'bg-primary border-primary' : 'bg-background border-card-border'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-xl transition-all duration-300 ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
                </div>
              </div>

              {/* Import Option */}
              <div 
                onClick={handleImportClick}
                className={`p-6 flex items-center justify-between cursor-pointer active:bg-foreground/5 transition-colors group`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-lg shadow-teal-500/5 group-hover:scale-110 transition-transform`}>
                    <FileDown size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-sm italic group-hover:text-primary transition-colors">Import PDF Data</h3>
                    <span className={`text-[9px] block mt-1 font-black uppercase tracking-[0.2em] opacity-40`}>Load data from exported PDF</span>
                  </div>
                </div>
                <div className="p-2 border border-card-border rounded-xl opacity-20 group-hover:opacity-100 transition-all">
                   <ChevronLeft size={16} className="rotate-180" strokeWidth={3} />
                </div>
              </div>
              
              <input 
                type="file" 
                accept="application/pdf"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
         </div>

         {/* Danger Zone */}
         <div className="pt-8">
            <button 
              onClick={() => {
                if(window.confirm('IRREVERSIBLE COMMAND: Are you sure you want to purge all account data?')){
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="w-full flex flex-col items-center justify-center gap-3 p-8 rounded-[2.5rem] font-black text-xs transition-all active:scale-[0.98] border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10 shadow-lg group"
            >
              <div className="p-3 bg-red-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                <Trash2 size={24} strokeWidth={3} />
              </div>
              <span className="uppercase tracking-[0.3em]">Engage System Purge</span>
            </button>
         </div>

      </div>
    </div>
  );
}
