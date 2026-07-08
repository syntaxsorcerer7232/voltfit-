import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  date: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export default function DietCalendarModal({ date, onSelect, onClose }: Props) {
  const [currentDate, setCurrentDate] = useState(date);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-sm glass-card rounded-3xl p-6 border border-neutral-800">
         <div className="flex justify-between items-center mb-6">
           <div className="flex items-center space-x-2">
             <button onClick={prevMonth} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 transition-colors"><ChevronLeft size={18}/></button>
             <h2 className="text-sm font-bold w-24 text-center">{monthNames[month]} {year}</h2>
             <button onClick={nextMonth} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 transition-colors"><ChevronRight size={18}/></button>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-500"><X size={20} /></button>
         </div>

         <div className="grid grid-cols-7 gap-2 text-center mb-4">
           {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
             <div key={i} className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{d}</div>
           ))}
         </div>

         <div className="grid grid-cols-7 gap-2">
           {blanks.map(b => <div key={`blank-${b}`} />)}
           {days.map(d => {
             const dayDate = new Date(year, month, d);
             const isSelected = dayDate.toDateString() === date.toDateString();
             const isToday = dayDate.toDateString() === new Date().toDateString();
             
             return (
               <button 
                 key={d} 
                 onClick={() => { onSelect(dayDate); onClose(); }} 
                 className={`h-10 w-full flex items-center justify-center rounded-xl mx-auto text-sm font-bold transition-colors ${isSelected ? "bg-[#84cc16] text-black shadow-[0_0_10px_rgba(132,204,22,0.4)]" : isToday ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
               >
                 {d}
               </button>
             );
           })}
         </div>
      </motion.div>
    </div>
  );
}
