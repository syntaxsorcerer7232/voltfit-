import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Activity, Battery, BatteryCharging, AlertCircle, RefreshCcw, Moon, Sun, Smile, Frown, Meh, Utensils, BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAppContext, useAppLogs } from '../context/AppContext';

interface Props {
  onClose?: () => void;
}

interface AIAnalysis {
  score: number;
  status: string;
  recommendations: string[];
}

export default function Insights({ onClose }: Props) {
  const { user, workoutHistory, showToast, updateAIRecovery } = useAppContext();
  const { meals, supplementLogs } = useAppLogs();

  // 9 Points of Recovery defined in domain logic
  const [timeSinceWorkout, setTimeSinceWorkout] = useState<number>(50); // 0 = very recent, 100 = 72+ hours
  const [muscleSoreness, setMuscleSoreness] = useState<number>(50); // 0 = severe, 100 = none
  const [strengthPerformance, setStrengthPerformance] = useState<number>(50); // 0 = dropped, 100 = same/more
  const [sleepQuality, setSleepQuality] = useState<number>(50); // 0 = poor, 100 = 8h+
  const [proteinIntake, setProteinIntake] = useState<number>(50); // 0 = low, 100 = optimal
  const [energyLevels, setEnergyLevels] = useState<number>(50); // 0 = drained, 100 = normal/high
  const [restingHeartRate, setRestingHeartRate] = useState<number>(50); // 0 = elevated, 100 = normal
  const [jointFeel, setJointFeel] = useState<number>(50); // 0 = pain/discomfort, 100 = fine
  const [moodMotivation, setMoodMotivation] = useState<number>(50); // 0 = poor, 100 = motivated

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const factors = {
        timeSinceWorkout,
        muscleSoreness,
        strengthPerformance,
        sleepQuality,
        proteinIntake,
        energyLevels,
        restingHeartRate,
        jointFeel,
        moodMotivation
      };

      const response = await fetch('/api/recovery-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factors, workoutHistory, supplementLogs })
      });

      if (!response.ok) throw new Error('AI Analysis failed');
      const data = await response.json();
      setAiAnalysis(data);
      updateAIRecovery({
        score: data.score,
        status: data.status,
        recommendation: data.recommendations?.[0] || data.status
      });
      showToast("Neural Assessment Complete", "success");
    } catch (e: any) {
      console.error(e);
      showToast("Could not connect to AI advisor", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-calculation on mount
  useEffect(() => {
    // 1. Time Since Workout
    if (workoutHistory && workoutHistory.length > 0) {
      const lastWorkoutDate = new Date(workoutHistory[workoutHistory.length - 1].date);
      const diffMs = Date.now() - lastWorkoutDate.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      
      let timeSince = 50;
      if (diffHrs < 24) timeSince = (diffHrs / 24) * 33;
      else if (diffHrs < 48) timeSince = 33 + ((diffHrs - 24) / 24) * 33;
      else if (diffHrs < 72) timeSince = 66 + ((diffHrs - 48) / 24) * 34;
      else timeSince = 100;
      
      setTimeSinceWorkout(Math.min(100, Math.max(0, Math.round(timeSince))));
    }

    // 3. Strength Performance
    if (workoutHistory && workoutHistory.length > 1) {
      const recent = workoutHistory[workoutHistory.length - 1];
      const previous = [...workoutHistory].reverse().slice(1).find(w => w.name === recent.name || w.type === recent.type);
      if (previous) {
        let recentVol = 0;
        recent.exercises.forEach((ex: any) => {
          ex.sets.forEach((s: any) => { if (s.completed) recentVol += s.reps * (s.weight || 1); });
        });
        
        let prevVol = 0;
        previous.exercises.forEach((ex: any) => {
          ex.sets.forEach((s: any) => { if (s.completed) prevVol += s.reps * (s.weight || 1); });
        });

        if (prevVol > 0) {
          const ratio = recentVol / prevVol;
          if (ratio >= 1) setStrengthPerformance(100);
          else if (ratio >= 0.9) setStrengthPerformance(80);
          else if (ratio >= 0.8) setStrengthPerformance(50);
          else setStrengthPerformance(20);
        }
      }
    }

    // 5. Protein Intake & Energy levels
    if (user && user.weight) {
      const today = new Date().toISOString().split('T')[0];
      const todaysMeals = (meals || []).filter(m => m.date === today);
      const todaysProtein = todaysMeals.reduce((acc, curr) => acc + (curr.protein || 0), 0);
      const todaysCarbs = todaysMeals.reduce((acc, curr) => acc + (curr.carbs || 0), 0);
      
      const targetMin = user.weight * 1.6;
      const targetMax = user.weight * 2.2;
      
      // Auto protein based on ranges
      let proteinScore = 20;
      if (targetMin > 0) {
        if (todaysProtein >= targetMax) proteinScore = 100;
        else if (todaysProtein <= targetMin / 2) proteinScore = 20;
        else if (todaysProtein < targetMin) proteinScore = 50 + ((todaysProtein - targetMin / 2) / (targetMin / 2)) * 30; // 50-80
        else if (todaysProtein >= targetMin) proteinScore = 80 + ((todaysProtein - targetMin) / (targetMax - targetMin)) * 20; // 80-100
      }
      setProteinIntake(Math.min(100, Math.max(0, Math.round(proteinScore))));

      // Auto energy from carbs
      if (user.carbsGoal && user.carbsGoal > 0) {
        let energyScore = 50;
        const carbRatio = todaysCarbs / user.carbsGoal;
        if (carbRatio > 0.8) energyScore = 90;
        else if (carbRatio > 0.5) energyScore = 70;
        else if (carbRatio > 0.2) energyScore = 40;
        else energyScore = 20;
        setEnergyLevels(energyScore);
      }
    }
  }, [workoutHistory, meals, user]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#84cc16'; // Green (Excellent)
    if (score >= 60) return '#eab308'; // Yellow (Moderate)
    if (score >= 40) return '#f97316'; // Orange (Fair)
    return '#ef4444'; // Red (Poor)
  };

  const { recoveryScore, fatigueScore, statusColor } = useMemo(() => {
    const total = 
      timeSinceWorkout + 
      muscleSoreness + 
      strengthPerformance + 
      sleepQuality + 
      proteinIntake + 
      energyLevels + 
      restingHeartRate + 
      jointFeel + 
      moodMotivation;
    
    // Total possible is 900
    const rawScore = Math.round((total / 900) * 100);
    const recovery = rawScore;
    const fatigue = 100 - recovery;
    
    return { recoveryScore: recovery, fatigueScore: fatigue, statusColor: getScoreColor(recovery) };
  }, [
    timeSinceWorkout, muscleSoreness, strengthPerformance, sleepQuality, 
    proteinIntake, energyLevels, restingHeartRate, jointFeel, moodMotivation
  ]);

  const displayScore = aiAnalysis ? aiAnalysis.score : recoveryScore;
  const displayColor = aiAnalysis ? getScoreColor(aiAnalysis.score) : statusColor;

  const getSuggestions = (score: number) => {
    if (score >= 80) {
      return [
        "You're fully recovered and ready to push hard today.",
        "Focus on progressive overload in your compound movements.",
        "Great time to test your 1RM if scheduled."
      ];
    } else if (score >= 60) {
      return [
        "Moderate recovery detected. Maintain your regular intensity but listen to your body.",
        "Ensure you're sleeping at least 7.5-9 hours tonight.",
        "Consider extending your warm-up routine."
      ];
    } else if (score >= 40) {
      return [
        "Incomplete recovery. You should prioritize an active recovery day.",
        "Focus on foam rolling, stretching, and light cardio.",
        `Make sure you're hitting your protein (${user?.weightUnit === 'lbs' ? '0.7-1g/lb' : '1.6-2.2g/kg'}) and hydration goals.`
      ];
    } else {
      return [
        "Critical fatigue level. Take a complete rest day.",
        "Your central nervous system needs time to recover.",
        "Prioritize deep sleep and high-quality nutrition."
      ];
    }
  };

  const suggestions = getSuggestions(recoveryScore);

  const SliderField = ({ label, value, onChange, minLabel, maxLabel }: any) => (
    <div className="space-y-3 p-4 bg-surface-elevated rounded-2xl border border-card-border shadow-sm">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</label>
        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{value}%</span>
      </div>
      <input 
        type="range" 
        min="0" max="100" 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary h-2 bg-background border border-card-border rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-[8px] uppercase font-black tracking-widest text-muted opacity-40">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );

  const AutoCalculatedField = ({ label, value, minLabel, maxLabel }: any) => (
    <div className="space-y-3 p-4 bg-surface-elevated rounded-2xl border border-primary/20 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 blur-2xl -z-10" />
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 italic">
          {label} <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-primary/20">AUTO-CALC</span>
        </label>
        <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">{value}%</span>
      </div>
      <div className="w-full h-2 bg-background border border-card-border rounded-lg overflow-hidden flex p-0.5 shadow-inner">
         <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-glow" style={{ width: `${value}%` }} />
      </div>
      <div className="flex justify-between text-[8px] uppercase font-black tracking-widest text-muted opacity-40 mt-1 italic">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );

  const ActivityHeatmap = () => {
    // Calculate the dates for the last 52 weeks (364 days + today = 365)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = 365;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days + 1);
    
    // Create a map of dates with workout counts
    const activityMap = new Map<string, number>();
    if (workoutHistory) {
      workoutHistory.forEach((w: any) => {
        if (w.date) {
          const d = new Date(w.date);
          d.setHours(0,0,0,0);
          const dateStr = d.toISOString().split('T')[0];
          activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
        }
      });
    }

    // Find start day of week
    const startDayOfWeek = startDate.getDay(); // 0 is Sunday
    
    const cells = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const count = activityMap.get(dateStr) || 0;
      
      let level = 0;
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count >= 3) level = 3;

      const col = Math.floor((i + startDayOfWeek) / 7);
      const row = (i + startDayOfWeek) % 7;
      
      cells.push({ x: col, y: row, level, date: dateStr, count });
    }

    const getColor = (level: number) => {
      switch(level) {
        case 1: return '#4d7c0f'; // lime-700
        case 2: return '#84cc16'; // lime-500
        case 3: return '#a3e635'; // lime-400
        default: return 'var(--card-border)'; // Dynamic based on theme
      }
    };

    return (
      <div className="bg-surface-elevated/40 border border-card-border rounded-[2.5rem] p-8 overflow-hidden mt-6 shadow-2xl">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic mb-6">Strategy Matrix Summary</h3>
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth" ref={el => { if (el) el.scrollLeft = el.scrollWidth; }}>
          <div className="min-w-[700px] pr-4">
            <svg width="100%" height={7 * 14 + 10} viewBox={`0 0 ${53 * 14} ${7 * 14}`}>
              {cells.map((cell, i) => (
                <rect
                  key={i}
                  x={cell.x * 14}
                  y={cell.y * 14}
                  width={10}
                  height={10}
                  rx={2}
                  fill={cell.level === 0 ? 'var(--card-border)' : getColor(cell.level)}
                  className="transition-colors duration-300 hover:opacity-80"
                >
                  <title>{`${cell.date}: ${cell.count} workout${cell.count !== 1 ? 's' : ''}`}</title>
                </rect>
              ))}
            </svg>
            <div className="flex justify-between text-[8px] text-muted font-black uppercase tracking-[0.2em] mt-4 px-1 italic opacity-40">
              <span>{startDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              <span>{today.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const VolumeChart = () => {
    const getWeekLabel = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Get Monday
        d.setDate(diff);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const volumeData = useMemo(() => {
        if (!workoutHistory || workoutHistory.length === 0) return [];
        
        const weeklyMap = new Map<string, number>();
        
        workoutHistory.forEach((w: any) => {
            if (w.date) {
                const date = new Date(w.date);
                const weekLabel = getWeekLabel(date);
                
                let vol = 0;
                if (w.exercises) {
                    w.exercises.forEach((ex: any) => {
                        if (ex.sets) {
                            ex.sets.forEach((s: any) => {
                                if (s.completed && s.weight && s.reps) {
                                    vol += s.weight * s.reps;
                                }
                            });
                        }
                    });
                }
                
                if (vol > 0) {
                    weeklyMap.set(weekLabel, (weeklyMap.get(weekLabel) || 0) + vol);
                }
            }
        });
        
        const data = Array.from(weeklyMap.entries()).map(([week, volume]) => ({
            week,
            volume: volume
        }));
        
        return data.slice(-12); // Last 12 weeks
    }, [workoutHistory]);

    if (volumeData.length === 0) return null;

    return (
      <div className="bg-surface-elevated rounded-[2.5rem] border border-card-border p-8 mt-6 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic mb-10">Historical Volume Flux</h3>
         <div className="h-64 mt-4 text-[10px] font-black">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
               <XAxis dataKey="week" stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 900 }} tickLine={false} axisLine={false} />
               <YAxis stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 900 }} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
               <RechartsTooltip 
                 cursor={{ fill: 'rgba(var(--primary-rgb),0.05)' }}
                 contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--foreground)' }}
                 itemStyle={{ color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', fontSize: 10 }}
                 formatter={(value: number) => [`${value.toLocaleString()} ${user?.weightUnit || 'kg'}`, 'VOL']}
               />
               <Bar dataKey="volume" fill="var(--primary)" radius={[6, 6, 0, 0]} className="shadow-glow" />
             </BarChart>
           </ResponsiveContainer>
         </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground w-full absolute top-0 left-0 z-[100] pt-safe overflow-y-auto no-scrollbar pb-24">
      <header className="px-4 py-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-20 border-b border-card-border/50">
        {onClose && (
          <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-surface-elevated transition-colors text-muted hover:text-foreground">
            <ChevronLeft size={24} />
          </button>
        )}
        <div className="text-center flex-1">
           <h1 className="text-xl font-black tracking-tighter uppercase italic">Combat Readiness</h1>
        </div>
        <div className="w-10 text-right">
          <button onClick={() => {
            setTimeSinceWorkout(50); setMuscleSoreness(50); setStrengthPerformance(50);
            setSleepQuality(50); setProteinIntake(50); setEnergyLevels(50);
            setRestingHeartRate(50); setJointFeel(50); setMoodMotivation(50);
          }} className="p-2 hover:bg-surface-elevated rounded-full text-muted hover:text-primary transition-all active:scale-95">
            <RefreshCcw size={18} />
          </button>
        </div>
      </header>

      <div className="px-4 space-y-8 flex-1 py-6">
        
        {/* Score Header */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-elevated border border-card-border rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <Activity size={32} style={{ color: statusColor }} className="animate-pulse" />
          </div>
          
          <div className="h-56 relative flex items-center justify-center mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Score', value: displayScore, color: displayColor },
                    { name: 'Remaining', value: 100 - displayScore, color: 'var(--card-border)' },
                  ]}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius="80%"
                  outerRadius="100%"
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={0}
                >
                  {[
                    { name: 'Score', value: displayScore, color: displayColor },
                    { name: 'Remaining', value: 100 - displayScore, color: 'var(--card-border)' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
          <div className="absolute bottom-0 left-0 right-0 text-center pb-4">
              <div className="text-[10px] font-black text-muted uppercase tracking-[0.4em] mb-2 opacity-50 italic">Readiness Level</div>
              <div className="text-6xl font-black tracking-tighter italic shadow-glow" style={{ color: displayColor }}>
                {displayScore}
              </div>
            </div>
          </div>

          <button 
            onClick={runAIAnalysis}
            disabled={isAnalyzing}
            className="w-full mt-6 py-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center gap-3 group hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <Loader2 size={18} className="text-primary animate-spin" />
            ) : (
              <BrainCircuit size={18} className="text-primary group-hover:scale-125 transition-transform" />
            )}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Run Neural Assessment</span>
            {!isAnalyzing && <Sparkles size={14} className="text-primary/50" />}
          </button>

          <div className="grid grid-cols-2 gap-6 mt-6 pt-8 border-t border-card-border/50 text-center">
            <div className="flex flex-col items-center">
              <div className="text-muted text-[9px] uppercase font-black tracking-[0.2em] mb-2 flex items-center gap-1.5 opacity-40">
                <BatteryCharging size={12} className="text-primary" /> Recoil
              </div>
              <div className="text-2xl font-black italic tracking-tighter">{displayScore}%</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-muted text-[9px] uppercase font-black tracking-[0.2em] mb-2 flex items-center gap-1.5 opacity-40">
                <Battery size={12} className="text-rose-500" /> Stress
              </div>
              <div className="text-2xl font-black italic tracking-tighter">{100 - displayScore}%</div>
            </div>
          </div>
        </motion.div>

        {/* AI Analysis Result */}
        <AnimatePresence>
          {aiAnalysis && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 px-4 mb-2">
                <BrainCircuit size={18} className="text-primary shadow-glow" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">AI Neural Directive</h3>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-6 space-y-4 shadow-xl">
                 <p className="text-xs text-foreground font-bold italic leading-relaxed tracking-wider border-l-2 border-primary pl-4">
                   "{aiAnalysis.status}"
                 </p>
                 <div className="space-y-3">
                   {aiAnalysis.recommendations.map((rec, i) => (
                     <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 shadow-glow" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted/80">{rec}</span>
                     </div>
                   ))}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions (Fallback/Standard) */}
        {!aiAnalysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 px-4 mb-4">
              <AlertCircle size={18} className="text-primary shadow-glow" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">Command Briefing</h3>
            </div>

            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className="bg-surface-elevated/40 border border-card-border rounded-[1.5rem] p-5 text-xs text-muted font-black uppercase italic leading-relaxed tracking-widest shadow-lg"
              >
                {suggestion}
              </div>
            ))}
          </motion.div>
        )}

        {/* Checklist */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8 pt-8"
        >
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic px-4">Tactical Parameter Analysis</h3>
          
          <div className="space-y-5 px-1">
            <AutoCalculatedField 
              label="1. Strategy Downtime" value={timeSinceWorkout} 
              minLabel="< 24hrs" maxLabel="72+ hrs" 
            />
            <SliderField 
              label="2. Structural Strain (DOMS)" value={muscleSoreness} onChange={setMuscleSoreness} 
              minLabel="Critical" maxLabel="None" 
            />
            <AutoCalculatedField 
              label="3. Force Production" value={strengthPerformance} 
              minLabel="Recession" maxLabel="Optimized" 
            />
            
            {/* Custom Sleep Check */}
            <div className="space-y-4 p-5 bg-surface-elevated rounded-[2rem] border border-card-border shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl -z-10" />
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted italic">4. Hibernation Quality</label>
                <Moon className="text-blue-500 shadow-glow" size={18} />
              </div>
              <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-40 mb-6 px-1 italic">Optimal cell regeneration achieved? (7.5 - 9h window)</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setSleepQuality(100)}
                  className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sleepQuality >= 80 ? 'bg-primary text-black shadow-glow' : 'bg-background text-muted border border-card-border shadow-inner'} flex items-center justify-center gap-2 italic active:scale-95`}
                >
                  <Sun size={14} className={sleepQuality >= 80 ? 'text-black' : 'text-primary'} /> Optimal
                </button>
                <button 
                  onClick={() => setSleepQuality(20)}
                  className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sleepQuality <= 40 ? 'bg-rose-500 text-white shadow-glow' : 'bg-background text-muted border border-card-border shadow-inner'} flex items-center justify-center gap-2 italic active:scale-95`}
                >
                  <Moon size={14} className={sleepQuality <= 40 ? 'text-white' : 'text-rose-500'} /> Deficient
                </button>
              </div>
            </div>

            {/* Custom Mood Check */}
            <div className="space-y-4 p-6 bg-surface-elevated rounded-[2rem] border border-card-border shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl -z-10" />
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted italic">5. Morale & Drive</label>
                <span className="text-[10px] font-black text-primary uppercase shadow-glow italic">{moodMotivation}%</span>
              </div>
              <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-40 mb-6 px-1 italic">Bio-rhythmic assessent of motivational flux:</p>
              <div className="flex justify-between px-2">
                <button onClick={() => setMoodMotivation(10)} className={`p-5 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${moodMotivation <= 25 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30 shadow-glow' : 'bg-background text-muted/30 border border-card-border shadow-inner'}`}>
                  <Frown size={28} />
                </button>
                <button onClick={() => setMoodMotivation(50)} className={`p-5 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${moodMotivation > 25 && moodMotivation < 75 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30 shadow-glow' : 'bg-background text-muted/30 border border-card-border shadow-inner'}`}>
                  <Meh size={28} />
                </button>
                <button onClick={() => setMoodMotivation(100)} className={`p-5 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${moodMotivation >= 75 ? 'bg-primary/10 text-primary border border-primary/30 shadow-glow' : 'bg-background text-muted/30 border border-card-border shadow-inner'}`}>
                  <Smile size={28} />
                </button>
              </div>
            </div>
            
            <AutoCalculatedField 
              label="6. Amino Load (Protein)" value={proteinIntake} 
              minLabel="Deficient" maxLabel="Target" 
            />
            <AutoCalculatedField 
              label="7. Glycogen Flux" value={energyLevels} 
              minLabel="Drained" maxLabel="Optimized" 
            />
            <SliderField 
              label="8. Static Pulse (RHR)" value={restingHeartRate} onChange={setRestingHeartRate} 
              minLabel="Elevated" maxLabel="Steady" 
            />
            <SliderField 
              label="9. Connective Integrity" value={jointFeel} onChange={setJointFeel} 
              minLabel="Alert" maxLabel="Nominal" 
            />
          </div>
        </motion.div>

        <ActivityHeatmap />
        
        <VolumeChart />

      </div>
    </div>
  );
}
