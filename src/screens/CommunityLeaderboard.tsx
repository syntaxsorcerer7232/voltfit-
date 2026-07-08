import React, { useState } from 'react';
import { Trophy, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function CommunityLeaderboard() {
  const { user, leaderboard: leaderboardData } = useAppContext();
  const [activeTab, setActiveTab] = useState('Reputation');
  
  const loading = leaderboardData.length === 0;

  const leaders = React.useMemo(() => {
      const uniqueUsers = new Map<string, any>();
      
      // Load global synced users
      leaderboardData.forEach(u => {
          const id = u.id;
          if (id) {
              uniqueUsers.set(id, { ...u, id });
          }
      });

      // Overlay/Add current user from local state to ensure it's always included and up-to-date
      const currentId = user?.id;
      if (currentId) {
          uniqueUsers.set(currentId, {
            ...user,
            id: currentId
          });
      }

      const list = Array.from(uniqueUsers.values()).filter(u => u && u.id && (u.points || 0) >= 0);

      // Re-sort
      return list.sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [leaderboardData, user?.points, user?.id, user?.name, user?.profilePicture]);

  return (
    <div className="p-4 md:p-8 pb-32 max-w-4xl mx-auto space-y-10">
       <div className="fixed top-1/3 left-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
       
       <div className="text-center pt-8">
           <div className="inline-flex items-center justify-center p-6 bg-amber-500/10 rounded-[2.5rem] mb-6 shadow-2xl shadow-amber-500/5 border border-amber-500/20 relative group">
              <div className="absolute inset-0 bg-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Trophy size={48} className="text-amber-500 relative z-10" />
           </div>
            <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter italic">Hall of Fame</h2>
            <div className="flex items-center justify-center gap-3 mt-3">
               <div className="h-px w-8 bg-card-border" />
               <p className="text-[10px] md:text-sm text-muted uppercase font-black tracking-widest opacity-60">Legends of the Community</p>
               <div className="h-px w-8 bg-card-border" />
            </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {['Reputation', 'Most Helpful', 'Best Mentor', 'Fastest Growing'].map(opt => (
                <button 
                  key={opt} 
                  onClick={() => setActiveTab(opt)}
                  className={`whitespace-nowrap px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 border ${
                    activeTab === opt 
                     ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20 scale-105' 
                     : 'bg-surface-elevated/50 text-muted hover:text-foreground border-card-border backdrop-blur-md'
                  }`}
                >
                   {opt}
                </button>
            ))}
        </div>

       <div className="bg-surface-elevated/40 backdrop-blur-2xl rounded-[2.5rem] p-4 border border-card-border shadow-2xl">
           {loading ? (
             <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-muted text-[10px] font-black uppercase tracking-widest opacity-60">Gilding the scroll...</p>
             </div>
           ) : leaders.length === 0 ? (
             <div className="p-12 text-center text-muted text-[10px] font-black uppercase tracking-widest italic opacity-40 italic">Empty Hall... Be the first to grace these walls.</div>
           ) : (
             <div className="space-y-1">
               {leaders.map((leader, i) => {
                   const isMe = leader.id === user?.id;
                   return (
                     <div key={leader.id} className={`flex items-center gap-4 p-5 md:p-7 hover:bg-surface-elevated/80 rounded-[2rem] transition-all relative overflow-hidden group ${isMe ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}>
                         {i < 3 && <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 pointer-events-none -translate-y-1/2 translate-x-1/2 ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-300' : 'bg-amber-700'}`} />}
                         
                         <div className="flex flex-col items-center justify-center w-10 relative">
                             <span className={`text-2xl font-black italic tracking-tighter ${i === 0 ? 'text-amber-500 scale-125' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-800' : 'text-muted/60'}`}>
                               #{i + 1}
                             </span>
                         </div>
                         
                          <div className="relative flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                             {leader.profilePicture ? (
                                <img 
                                  src={leader.profilePicture} 
                                  className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 z-10 relative object-cover shadow-2xl ${i === 0 ? 'border-amber-500' : i === 1 ? 'border-slate-500' : i === 2 ? 'border-amber-900' : 'border-card-border'}`} 
                                  alt={leader.name} 
                                  referrerPolicy="no-referrer" 
                                />
                             ) : (
                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 z-10 relative bg-surface-elevated flex items-center justify-center text-primary font-black text-xl md:text-2xl ${i === 0 ? 'border-amber-500' : i === 1 ? 'border-card-border' : i === 2 ? 'border-amber-900' : 'border-card-border'}`}>
                                    {leader.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                             )}
                             {i < 3 && (
                               <div className="absolute -top-2 -right-2 w-7 h-7 bg-background border border-card-border rounded-full flex items-center justify-center z-20 shadow-xl">
                                  <span className="text-xs">{i === 0 ? '👑' : i === 1 ? '🥈' : '🥉'}</span>
                               </div>
                             )}
                          </div>
                         
                         <div className="flex-1 min-w-0 pr-2">
                             <h4 className={`font-black text-base md:text-xl leading-tight flex items-center gap-2 w-full overflow-hidden transition-colors ${isMe ? 'text-primary' : 'text-foreground group-hover:text-amber-500'}`}>
                               <span className="truncate uppercase italic tracking-tighter">{leader.name || 'Anonymous User'}</span>
                               {isMe && <span className="text-[8px] md:text-[10px] bg-primary text-black px-1.5 py-0.5 rounded-lg ml-2 font-black flex-shrink-0 animate-pulse">YOU</span>}
                               {leader.badges && leader.badges.length > 0 && <ShieldCheck size={16} className="text-primary flex-shrink-0" />}
                             </h4>
                             <div className="flex items-center gap-3 mt-2 overflow-hidden">
                                 <span className="text-[8px] md:text-[10px] text-muted uppercase font-black tracking-[0.2em] flex-shrink-0 bg-surface-elevated px-2 py-0.5 rounded-md">[{leader.strengthRank || 'Beginner'}]</span>
                                 <div className="h-px bg-card-border flex-1" />
                             </div>
                         </div>
                         
                         <div className="flex flex-col items-end pl-2">
                             <span className="text-foreground font-black text-xl md:text-3xl italic tracking-tighter group-hover:scale-110 transition-transform">{(leader.points || 0).toLocaleString()}</span>
                             <span className="text-[8px] md:text-[10px] text-muted uppercase font-black tracking-[0.3em] mt-1 opacity-60">XP Units</span>
                         </div>
                     </div>
                   );
               })}
             </div>
           )}
       </div>

    </div>
  );
}
