import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { ChevronRight, Droplets, Dumbbell, Flame, Apple, ArrowRight, ChevronLeft, ShieldCheck, FlaskConical } from 'lucide-react';
import { cn } from '../components/BottomNav';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function Onboarding() {
  const { user, updateUser, setOnboardingCompleted } = useAppContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    gender: 'male',
    dateOfBirth: '',
    mobile: '',
    bodyType: 'mesomorph',
    height: '' as number | '',
    weight: '' as number | '',
    workoutFrequency: '3-4x',
    goal: 'maintain',
    goalSpeed: 'slow',
    allergies: [] as string[],
    dietPreference: 'non-vegetarian',
    workoutPreference: 'gym',
    isNatural: true,
    supplementNames: [] as string[],
    supplements: [] as any[],
  });

  const allergens = ['Peanuts', 'Dairy', 'Gluten', 'Soy', 'Shellfish', 'Eggs'];
  const commonSupps = ['Creatine', 'Whey Protein', 'Pre-Workout', 'BCAA', 'Multivitamin', 'Omega-3', 'Casein', 'Beta-Alanine', 'Citrulline'];
  const timings = ['Morning', 'Pre-workout', 'Post-workout', 'With Meal', 'Before Bed'];

  const submitOnboarding = async (data: any) => {
    setLoading(true);
    try {
      const authUser = auth.currentUser;
      if (authUser) {
         const finalUser = {
           ...user,
           ...data,
           email: authUser.email || '',
           points: 0,
           badges: [],
           onboardingCompleted: true
         };
         const { doc, writeBatch } = await import('firebase/firestore');
         const batch = writeBatch(db);
         
         const userRef = doc(db, 'users', authUser.uid);
         batch.set(userRef, finalUser);
         
         const publicDef = doc(db, 'public_profiles', authUser.uid);
         batch.set(publicDef, {
             name: finalUser.name || 'Anonymous',
             points: finalUser.points || 0,
             updatedAt: Date.now()
         }, { merge: true });
         
         await batch.commit();
         
         updateUser(finalUser as any);
      } else {
         updateUser(data as any);
      }
      setOnboardingCompleted(true);
    } catch (e: any) {
       console.error('Error saving user data', e);
       alert('Failed to save profile. ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 12 && formData.supplementNames.length === 0) {
      submitOnboarding(formData);
      return;
    }
    if (step < 13) setStep(step + 1);
    else {
      submitOnboarding(formData);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">What's your name?</h2>
            <input
              type="text"
              className="w-full bg-surface-elevated border-b-2 border-card-border focus:border-primary text-xl py-4 px-2 outline-none transition-all font-bold placeholder:text-muted/30 italic text-foreground"
              placeholder="YOUR CALLSIGN"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm px-2">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">Select Gender</h2>
            <div className="grid grid-cols-2 gap-4">
              {['male', 'female', 'other'].map(g => (
                <button
                  key={g}
                  className={cn("py-6 rounded-2xl border text-base font-black uppercase tracking-widest transition-all shadow-md active:scale-95", formData.gender === g ? 'bg-primary text-black border-primary shadow-glow' : 'bg-surface-elevated border-card-border text-muted hover:text-foreground')}
                  onClick={() => setFormData({ ...formData, gender: g })}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">Date of Birth</h2>
            <input
              type="date"
              className="w-full bg-surface-elevated border border-card-border rounded-2xl focus:border-primary text-xl py-4 px-4 outline-none font-bold shadow-inner text-foreground"
              value={formData.dateOfBirth}
              onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">Contact Intel</h2>
            <input
              type="tel"
              className="w-full bg-surface-elevated border-b-2 border-card-border focus:border-primary text-xl py-4 px-2 outline-none font-bold placeholder:text-muted/30 italic text-foreground"
              placeholder="MOBILE FREQUENCY"
              value={formData.mobile}
              onChange={e => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm px-2">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">Body Type</h2>
            <div className="space-y-4">
              {[
                { id: 'ectomorph', label: 'Ectomorph', desc: 'Lean, long, difficulty building muscle' },
                { id: 'mesomorph', label: 'Mesomorph', desc: 'Muscular, high metabolism, responsive' },
                { id: 'endomorph', label: 'Endomorph', desc: 'Higher body fat, stores fat easily' }
              ].map(b => (
                <button
                  key={b.id}
                  className={cn("w-full text-left p-5 rounded-2xl border transition-all active:scale-[0.98] shadow-md", formData.bodyType === b.id ? 'bg-primary/10 border-primary shadow-glow' : 'bg-surface-elevated border-card-border')}
                  onClick={() => setFormData({ ...formData, bodyType: b.id })}
                >
                  <div className={cn("font-black text-sm uppercase tracking-widest italic transition-colors", formData.bodyType === b.id ? 'text-primary' : 'text-foreground')}>{b.label}</div>
                  <div className="text-muted text-[10px] uppercase font-black tracking-widest mt-1 opacity-50 italic">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm px-4">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">Biometrics</h2>
            <div className="space-y-8 pt-4">
              <div className="relative group">
                <label className="flex justify-between text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 italic opacity-60 group-focus-within:text-primary transition-colors">
                  <span>Height Transmission (cm)</span>
                </label>
                <input type="number" min="100" max="250" placeholder="E.G. 175" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full bg-surface-elevated border-b-2 border-card-border focus:border-primary text-2xl py-2 px-1 outline-none font-black italic transition-all shadow-inner text-foreground" />
              </div>
              <div className="relative group">
                <label className="flex justify-between text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 italic opacity-60 group-focus-within:text-secondary transition-colors">
                  <span>Weight Magnitude ({user?.weightUnit || 'KG'})</span>
                </label>
                <input type="number" min="30" max="200" placeholder="E.G. 70" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full bg-surface-elevated border-b-2 border-card-border focus:border-secondary text-2xl py-2 px-1 outline-none font-black italic transition-all shadow-inner text-foreground" />
              </div>
              <div>
                <label className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-4 block px-1 italic opacity-40">Frequency Protocol</label>
                <div className="flex gap-3">
                  {['1-2x', '3-4x', 'daily'].map(f => (
                    <button key={f} className={cn("flex-1 py-3.5 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-90 shadow-md italic", formData.workoutFrequency === f ? 'bg-primary text-black border-primary shadow-glow' : 'bg-surface-elevated border-card-border text-muted')} onClick={() => setFormData({...formData, workoutFrequency: f})}>{f}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm px-2">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">Ultimate Goal</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'lose', icon: Flame, c: 'text-orange-500' },
                { id: 'maintain', icon: Droplets, c: 'text-secondary' },
                { id: 'gain', icon: Dumbbell, c: 'text-primary' }
              ].map(g => {
                const Icon = g.icon;
                return (
                <button
                  key={g.id}
                  className={cn("p-5 rounded-2xl border flex flex-col items-center transition-all active:scale-95 shadow-md", formData.goal === g.id ? 'bg-surface-elevated border-primary ring-1 ring-primary shadow-glow' : 'bg-surface-elevated border-card-border')}
                  onClick={() => setFormData({ ...formData, goal: g.id })}
                >
                  <Icon size={28} className={cn("mb-3", formData.goal === g.id ? g.c : 'text-muted opacity-40')} />
                  <span className="capitalize font-black text-[10px] tracking-widest italic">{g.id}</span>
                </button>
              )})}
            </div>
            {formData.goal !== 'maintain' && (
              <div className="flex p-1.5 bg-surface-elevated border border-card-border rounded-xl mt-4 shadow-inner">
                {['slow', 'fast'].map(s => (
                  <button key={s} className={cn("flex-1 py-3 rounded-lg capitalize font-black text-[10px] tracking-[0.2em] transition-all italic", formData.goalSpeed === s ? 'bg-foreground text-background shadow-lg' : 'text-muted opacity-50')} onClick={() => setFormData({...formData, goalSpeed: s})}>{s.toUpperCase()}</button>
                ))}
              </div>
            )}
          </div>
        );
      case 8:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm px-2">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">Bio-Hazard Recon</h2>
            <div className="flex flex-wrap gap-3">
              {allergens.map(a => {
                const selected = formData.allergies.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => {
                       const newA = selected ? formData.allergies.filter(x => x !== a) : [...formData.allergies, a];
                       setFormData({ ...formData, allergies: newA });
                    }}
                    className={cn("px-5 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 shadow-md italic", selected ? 'bg-red-500 text-white border-red-500 shadow-glow' : 'bg-surface-elevated border-card-border text-muted')}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 9:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm px-2">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">Energy Protocol</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={cn("py-8 rounded-2xl border flex flex-col items-center transition-all active:scale-95 shadow-lg", formData.dietPreference === 'vegetarian' ? 'bg-primary/5 border-primary shadow-glow' : 'bg-surface-elevated border-card-border')}
                onClick={() => setFormData({ ...formData, dietPreference: 'vegetarian' })}
              >
                <Apple size={32} className={cn("mb-4", formData.dietPreference === 'vegetarian' ? 'text-primary' : 'text-muted opacity-40')} />
                <span className="font-black uppercase tracking-widest italic text-xs">Botanical</span>
              </button>
              <button
                className={cn("py-8 rounded-2xl border flex flex-col items-center transition-all active:scale-95 shadow-lg", formData.dietPreference === 'non-vegetarian' ? 'bg-red-500/5 border-red-500 shadow-glow' : 'bg-surface-elevated border-card-border')}
                onClick={() => setFormData({ ...formData, dietPreference: 'non-vegetarian' })}
              >
                <Flame size={32} className={cn("mb-4", formData.dietPreference === 'non-vegetarian' ? 'text-red-500' : 'text-muted opacity-40')} />
                <span className="font-black uppercase tracking-widest italic text-xs">Biological</span>
              </button>
            </div>
          </div>
        );
      case 10:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm px-2">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">Arena Selection</h2>
            <div className="flex flex-col gap-4">
              {['gym', 'home', 'both'].map(w => (
                <button
                  key={w}
                  className={cn("p-5 rounded-2xl border flex items-center transition-all active:scale-[0.98] shadow-md", formData.workoutPreference === w ? 'bg-primary text-black border-primary shadow-glow' : 'bg-surface-elevated border-card-border text-muted hover:text-foreground')}
                  onClick={() => setFormData({ ...formData, workoutPreference: w })}
                >
                  <Dumbbell className="mr-4" size={24} />
                  <span className="font-black text-sm uppercase tracking-widest italic">{w} Command</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 11:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm px-2 text-center">
            <div className="flex justify-center mb-4">
               <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <ShieldCheck size={40} className="text-primary" />
               </div>
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">Natural Integrity</h2>
            <p className="text-muted text-[10px] uppercase font-black tracking-widest leading-relaxed opacity-50 mb-4 italic">
              VoltFit is strictly for natural, drug-free athletes. By continuing, you confirm your commitment to natural bodybuilding.
            </p>
            <div className="flex flex-col gap-4">
              <button
                className={cn("p-6 rounded-2xl border flex items-center justify-center transition-all active:scale-[0.98] shadow-md", formData.isNatural ? 'bg-primary text-black border-primary shadow-glow' : 'bg-surface-elevated border-card-border')}
                onClick={() => setFormData({ ...formData, isNatural: true })}
              >
                <span className="font-black text-sm uppercase tracking-[0.2em] italic">I AM A NATURAL ATHLETE</span>
              </button>
              <button
                className={cn("p-4 rounded-xl border flex items-center justify-center transition-all opacity-40 grayscale grayscale-100", !formData.isNatural ? 'bg-red-500 text-white border-red-500' : 'bg-surface-elevated border-card-border text-muted')}
                onClick={() => {
                  alert("VoltFit is optimized for natural biological limits. Enhanced athletes may find the recovery and programming metrics inaccurate.");
                  setFormData({ ...formData, isNatural: false });
                }}
              >
                <span className="font-black text-[10px] uppercase tracking-widest italic">Not Natural / Enhanced</span>
              </button>
            </div>
          </div>
        );
      case 12:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm px-2">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">Current Stack</h2>
            <p className="text-muted text-[10px] uppercase font-black tracking-widest opacity-50 mb-2 italic">
              Select any supplements you are currently using for precise AI tracking.
            </p>
            <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto no-scrollbar p-1">
              {commonSupps.map(s => {
                const selected = formData.supplementNames.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => {
                       const newS = selected ? formData.supplementNames.filter(x => x !== s) : [...formData.supplementNames, s];
                       setFormData({ ...formData, supplementNames: newS });
                    }}
                    className={cn("px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 shadow-sm italic", selected ? 'bg-primary text-black border-primary shadow-glow' : 'bg-surface-elevated border-card-border text-muted')}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-2">
               <input 
                 type="text" 
                 placeholder="CUSTOM SUPPLEMENT" 
                 className="flex-1 bg-surface-elevated border border-card-border rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all italic text-foreground"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     const val = (e.target as HTMLInputElement).value.trim();
                     if (val && !formData.supplementNames.includes(val)) {
                       setFormData({ ...formData, supplementNames: [...formData.supplementNames, val] });
                       (e.target as HTMLInputElement).value = '';
                     }
                   }
                 }}
               />
            </div>
          </div>
        );
      case 13:
        return (
          <div className="flex flex-col space-y-6 w-full max-w-sm px-2">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase grayscale brightness-200">Stack Intel</h2>
            <p className="text-muted text-[10px] uppercase font-black tracking-widest opacity-50 mb-2 italic text-center">
              Define the protocols for your selected supplements.
            </p>
            <div className="flex flex-col gap-6 max-h-[50vh] overflow-y-auto no-scrollbar pr-2">
              {formData.supplementNames.map((name: string) => {
                const existing = formData.supplements.find(s => s.name === name) || { id: Math.random().toString(36).substr(2, 9), name, dosage: '5g', timing: 'Morning', frequency: 'Daily' };
                return (
                  <div key={name} className="p-4 rounded-2xl bg-surface-elevated border border-card-border space-y-4">
                    <div className="flex items-center gap-2">
                      <FlaskConical size={16} className="text-primary" />
                      <span className="font-black text-sm uppercase italic tracking-tight">{name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted opacity-50 ml-1">Dosage</label>
                        <input 
                          type="text" 
                          value={existing.dosage}
                          placeholder="e.g. 5g"
                          onChange={(e) => {
                            const newSupps = formData.supplements.filter(s => s.name !== name);
                            newSupps.push({ ...existing, dosage: e.target.value });
                            setFormData({ ...formData, supplements: newSupps });
                          }}
                          className="w-full bg-black/20 border border-card-border rounded-xl px-3 py-2 text-[10px] font-bold uppercase outline-none focus:border-primary/50 text-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted opacity-50 ml-1">Timing</label>
                        <select 
                          value={existing.timing}
                          onChange={(e) => {
                            const newSupps = formData.supplements.filter(s => s.name !== name);
                            newSupps.push({ ...existing, timing: e.target.value });
                            setFormData({ ...formData, supplements: newSupps });
                          }}
                          className="w-full bg-black/20 border border-card-border rounded-xl px-3 py-2 text-[10px] font-bold uppercase outline-none focus:border-primary/50 text-foreground appearance-none"
                        >
                          {timings.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white w-full relative max-w-md mx-auto">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-neutral-900">
        <motion.div
           className="h-full bg-primary"
           initial={{ width: 0 }}
           animate={{ width: `${(step / 13) * 100}%` }}
           transition={{ ease: "easeInOut" }}
        />
      </div>

      {step > 1 && (
        <button 
          onClick={() => setStep(step - 1)}
          className="absolute top-6 left-6 p-2 bg-neutral-900 rounded-full hover:bg-neutral-800 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full flex justify-center"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6">
        <button
          onClick={handleNext}
          disabled={loading || (step === 1 && !formData.name) || (step === 3 && !formData.dateOfBirth) || (step === 6 && (!formData.height || !formData.weight))}
          className="w-full py-4 bg-primary text-black font-extrabold text-lg rounded-xl flex items-center justify-center disabled:opacity-50 transition-opacity disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'SAVING...' : (step === 10 ? 'Complete Set Up' : (step === 4 && !formData.mobile ? 'Skip' : 'Next'))}
          <ArrowRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}
