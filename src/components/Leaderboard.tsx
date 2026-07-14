import React, { useEffect, useState } from 'react';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, getAggregateFromServer, count } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Trophy, Medal, Award, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const RankRow = React.memo(({ l, isMe, index }: { l: any, isMe: boolean, index: number }) => {
    let icon = <span className="w-5 text-center text-slate-600 font-mono text-[9px]">{index + 1}</span>;
    if (index === 0) icon = <Trophy size={14} className="text-amber-500 flex-shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />;
    if (index === 1) icon = <Medal size={14} className="text-slate-300 flex-shrink-0" />;
    if (index === 2) icon = <Award size={14} className="text-amber-700 flex-shrink-0" />;

    return (
        <div className={`flex items-center justify-between p-3 rounded-2xl border gap-2 min-w-0 transition-all duration-300 ${isMe ? 'bg-primary/10 border-primary/25 shadow-lg shadow-primary/5' : 'bg-surface-elevated border-card-border hover:bg-primary/5'}`}>
            <div className="flex items-center min-w-0 flex-1 pr-2">
                <div className="flex items-center">
                    {icon}
                    <div className="ml-3 w-9 h-9 rounded-full border border-card-border overflow-hidden bg-surface-elevated flex items-center justify-center flex-shrink-0 shadow-inner">
                        {l.profilePicture ? (
                            <img src={l.profilePicture} alt={l.name || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                            <span className="text-[10px] font-black text-primary">{(l.name || 'A').charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                </div>
                <span className={`font-black ml-3 text-sm truncate flex-1 uppercase tracking-tight ${isMe ? 'text-primary' : 'text-foreground'}`}>{l.name || (isMe ? 'User' : 'Anonymous')}</span>
                {isMe && <span className="ml-2 text-[8px] flex-shrink-0 bg-primary text-black px-2 py-0.5 rounded font-black tracking-widest shadow-sm">YOU</span>}
            </div>
            <span className="text-xs font-black font-mono flex-shrink-0 text-primary shadow-glow italic tracking-tighter">{(l.points || 0).toLocaleString()} <span className="text-[8px] opacity-60">PTS</span></span>
        </div>
    );
});

export default React.memo(function Leaderboard({ currentUserId }: { currentUserId: string }) {
    const { user } = useAppContext();
    const [leadersData, setLeadersData] = useState<(Partial<UserProfile> & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalUsers, setTotalUsers] = useState<number | null>(null);

    useEffect(() => {
        if (!isFirebaseConfigured || !currentUserId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'public_profiles'), 
            orderBy('points', 'desc')
        );

        const fetchStats = async () => {
            try {
                const snapshot = await getAggregateFromServer(q, {
                    userCount: count()
                });
                if (snapshot && snapshot.data()) {
                    setTotalUsers(snapshot.data().userCount);
                }
            } catch (err) {
                console.warn("Aggregation failing, falling back to client-side count:", err);
            }
        };
        fetchStats();

        const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
            const data = snap.docs.map(d => {
                const docData = d.data();
                return {
                    id: d.id,
                    name: docData.name,
                    points: docData.points,
                    profilePicture: docData.profilePicture
                } as any;
            });
            setLeadersData(data);
            setLoading(false);
        }, (error) => {
            console.error("Leaderboard snapshot error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUserId]);

    const leaders = React.useMemo(() => {
        const uniqueUsers = new Map<string, any>();
        
        leadersData.forEach(u => {
            if (u.id) uniqueUsers.set(u.id, u);
        });

        if (user && currentUserId) {
            uniqueUsers.set(currentUserId, {
                id: currentUserId,
                name: user.name || 'You',
                points: user.points || 0,
                profilePicture: user.profilePicture
            });
        }

        const list = Array.from(uniqueUsers.values());
        const filtered = list.filter(u => u.points !== undefined && u.points >= 0);

        return filtered.sort((a, b) => (b.points || 0) - (a.points || 0));
    }, [leadersData, user?.points, user?.name, user?.profilePicture, currentUserId]);

    if (loading) {
       return <div className="text-center text-[10px] text-slate-600 py-8 font-black uppercase tracking-[0.2em] italic">Synchronizing Ranking...</div>;
    }

    return (
        <div className="glass-card rounded-3xl p-6 border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
                    <Trophy size={14} className="mr-2 text-primary" />
                    World Class Elite
                </div>
                {totalUsers !== null && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted tracking-widest bg-surface-elevated px-2.5 py-1 rounded-full border border-card-border shadow-sm">
                        <Users size={10} className="text-primary" />
                        {totalUsers} Members
                    </div>
                )}
            </div>

            <div className="space-y-3 max-h-[440px] overflow-y-auto no-scrollbar pr-1 -mx-1 px-1">
               {leaders.map((l, i) => (
                   <RankRow key={l.id || `rank-${i}`} l={l} index={i} isMe={l.id === (user?.id || currentUserId)} />
               ))}
               
               {leaders.length === 0 && (
                   <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center py-8 italic opacity-50">Empty arena...</p>
               )}
            </div>
        </div>
    );
});
