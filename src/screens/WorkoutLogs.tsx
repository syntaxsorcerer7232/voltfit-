import React from 'react';
import { ChevronLeft, Calendar as CalendarIcon, Clock, Dumbbell } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../components/BottomNav';
import { useAppContext } from '../context/AppContext';

interface Props {
  onClose: () => void;
}

export default function WorkoutLogs({ onClose }: Props) {
  // In a real app we'd fetch this from the database context/state
  const { history = [] } = useAppContext() as any;

  // Since we might not have actual history data in the current state context, let's mock it for the demo
  const mockLogs = [
    {
      id: '1',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
      name: 'Push Day',
      duration: '45 min',
      exercises: ['Bench Press', 'Incline Dumbbell Press', 'Shoulder Press', 'Tricep Dips'],
      volume: '8,450 lbs'
    },
    {
      id: '2',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      name: 'Pull Day',
      duration: '52 min',
      exercises: ['Deadlift', 'Pull-Ups', 'Barbell Rows', 'Face Pulls', 'Bicep Curls'],
      volume: '11,200 lbs'
    },
    {
      id: '3',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      name: 'Leg Day',
      duration: '60 min',
      exercises: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Calf Raises'],
      volume: '15,600 lbs'
    }
  ];

  const logs = history.length > 0 ? history : mockLogs;

   return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground w-full absolute top-0 left-0 z-[100] pt-safe overflow-y-auto no-scrollbar">
      <header className="px-4 py-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-20">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-primary/10 transition-colors text-foreground">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center flex-1">
           <h1 className="text-xl font-black tracking-tight uppercase italic opacity-20">COMBAT LOGS</h1>
        </div>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </header>

      <div className="px-4 space-y-4 pb-24">
        {logs.map((log: any, index: number) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={log.id || index}
            className="bg-surface-elevated/40 p-6 rounded-[2rem] border border-card-border relative overflow-hidden shadow-lg"
          >
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-lg font-black tracking-tighter uppercase italic">{log.name}</h3>
                   <div className="flex items-center space-x-3 text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-40 italic">
                      <span className="flex items-center"><CalendarIcon size={12} className="mr-1.5" /> {log.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center"><Clock size={12} className="mr-1.5" /> {log.duration}</span>
                   </div>
                </div>
                <div className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-glow">
                  COMPLETED
                </div>
             </div>

             <div className="mt-4">
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted mb-4 block opacity-30 italic">Exercises Performed</span>
               <div className="flex flex-wrap gap-2">
                 {log.exercises.map((ex: string, i: number) => (
                   <span key={i} className="text-[11px] font-black bg-background border border-card-border text-foreground/70 px-4 py-2 rounded-xl flex items-center italic">
                     <Dumbbell size={10} className="mr-2 text-primary shadow-glow" />
                     {ex}
                   </span>
                 ))}
               </div>
             </div>

             <div className="mt-8 pt-5 border-t border-card-border/30 flex justify-between items-center">
                 <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-30 italic">Total Volume</span>
                 <span className="font-mono text-sm font-black text-primary shadow-glow">{log.volume || '---'}</span>
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
