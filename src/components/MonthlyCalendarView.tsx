import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, XCircle, Battery } from 'lucide-react';

import DayDetailsModal from './DayDetailsModal';

export default React.memo(function MonthlyCalendarView() {
  const { workoutHistory, workoutSchedule } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const today = new Date();
  today.setHours(0,0,0,0);

  const getDayStatus = (dayValue: number) => {
    const dayDate = new Date(year, month, dayValue);
    
    // We check if history item starts with this date OR check local dates
    const historyItem = workoutHistory.find(h => {
        if (!h.date) return false;
        const hDate = new Date(h.date);
        return hDate.getFullYear() === year && hDate.getMonth() === month && hDate.getDate() === dayValue;
    });
    
    const isCompleted = historyItem?.completed;

    const weekday = dayDate.getDay();
    let isRest = false;

    if (workoutSchedule.mode === 'custom' && workoutSchedule.custom.length > 0) {
       const planned = workoutSchedule.custom.find((c: any) => c.weekday === weekday);
       isRest = planned ? planned.isRest : false;
    } else {
       isRest = (weekday === 0 || weekday === 3);
    }

    const isPast = dayDate < today;
    const isTodayFlag = dayDate.getTime() === today.getTime();

    if (isCompleted) return { status: 'completed', isToday: isTodayFlag };
    if (isPast && !isRest) return { status: 'missed', isToday: isTodayFlag };
    if (isRest) return { status: 'rest', isToday: isTodayFlag };
    return { status: 'planned', isToday: isTodayFlag }; // Future train day or today
  };

  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="glass-card rounded-2xl p-4 border border-neutral-800 mt-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg text-white">{monthNames[month]} {year}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">
             <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">
             <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-3">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-xs font-bold text-neutral-500 uppercase">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
         {blanks.map(b => (
            <div key={`blank-${b}`} className="min-h-[48px]"></div>
         ))}
         {days.map(d => {
            const { status, isToday } = getDayStatus(d);
            
            let bgClass = "bg-neutral-900/50";
            let borderClass = "border-transparent";
            let textClass = "text-neutral-400";
            let Icon = null;

            if (isToday) borderClass = "border-primary/50 shadow-[0_0_10px_rgba(132,204,22,0.15)]";

            if (status === 'completed') {
               bgClass = "bg-primary/20";
               textClass = "text-primary";
               Icon = <CheckCircle2 size={14} strokeWidth={2.5} className="text-primary mt-1" />;
            } else if (status === 'missed') {
               bgClass = "bg-red-500/10";
               textClass = "text-red-500/70";
               Icon = <XCircle size={14} className="text-red-500 mt-1" />;
            } else if (status === 'rest') {
               bgClass = "bg-neutral-800/30";
               textClass = "text-neutral-600";
               Icon = <Battery size={14} className="text-neutral-600 mt-1" />;
            } else if (status === 'planned') {
               bgClass = "bg-neutral-800/60";
               textClass = "text-neutral-400";
               Icon = <Circle size={12} className="text-neutral-500 mt-1" />;
            }

            return (
               <div 
                 key={d} 
                 onClick={() => setSelectedDay(new Date(year, month, d))}
                 className={`h-14 w-full rounded-xl border ${borderClass} ${bgClass} flex flex-col items-center justify-center relative transition-all cursor-pointer hover:bg-neutral-800`}
               >
                 <span className={`text-xs font-bold ${textClass} ${isToday ? 'font-black scale-110 text-white' : ''} leading-none`}>{d}</span>
                 {Icon && <div className="mt-1">{Icon}</div>}
               </div>
            )
         })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 mt-5 pt-4 border-t border-neutral-800 text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
         <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-primary" strokeWidth={2.5} /> Done</div>
         <div className="flex items-center gap-1.5"><Battery size={12} className="text-neutral-600" /> Rest</div>
         <div className="flex items-center gap-1.5"><XCircle size={12} className="text-red-500" /> Missed</div>
      </div>
      
      {selectedDay && (
        <DayDetailsModal date={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
});
