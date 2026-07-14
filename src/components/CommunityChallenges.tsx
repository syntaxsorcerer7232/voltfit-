import React, { useState } from 'react';
import { Target, Users, Plus, X, MoreHorizontal, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  arrayUnion, 
  arrayRemove, 
  orderBy
} from 'firebase/firestore';
import { useAppContext, useAppLogs } from '../context/AppContext';

export default function CommunityChallenges() {
   const { user, challenges } = useAppContext();
   const { dailySteps } = useAppLogs();
   const [isCreating, setIsCreating] = useState(false);
   const [newTitle, setNewTitle] = useState('');
   const [newDesc, setNewDesc] = useState('');
   const [newMetricName, setNewMetricName] = useState('');
   const [newGoal, setNewGoal] = useState('10000');
   
   const [isDeleteMode, setIsDeleteMode] = useState(false);
   const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
   const [expandedChallenges, setExpandedChallenges] = useState<string[]>([]);

   const [syncModal, setSyncModal] = useState<{ challengeId: string, title: string, metricName: string, currentProgress: number } | null>(null);
   const [syncValue, setSyncValue] = useState<string>('');
   const [alertMessage, setAlertMessage] = useState<string | null>(null);
   
   const currentUserId = user?.userId || user?.id || auth.currentUser?.uid || 'anonymous';
   const currentUserName = user?.name || 'Anonymous';

   const toggleJoin = async (challengeId: string) => {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return;

      const isJoined = challenge.joinedUsers?.includes(currentUserId);
      const challengeRef = doc(db, 'challenges', challengeId);

      try {
        if (isJoined) {
          await updateDoc(challengeRef, {
            joinedUsers: arrayRemove(currentUserId),
            friends: challenge.friends.filter((f: any) => f.userId !== currentUserId),
            participants: Math.max(0, (challenge.participants || 0) - 1)
          });
        } else {
          await updateDoc(challengeRef, {
            joinedUsers: arrayUnion(currentUserId),
            friends: arrayUnion({ name: currentUserName, progress: 0, userId: currentUserId, lastSyncedAt: null }),
            participants: (challenge.participants || 0) + 1
          });
        }
      } catch (err) {
        console.error("Error joining challenge:", err);
      }
   };

   const handleCreate = async (e: React.FormEvent) => {
       e.preventDefault();
       if (!newTitle.trim()) return;
       
       const newChallenge = {
           title: newTitle,
           description: newDesc,
           participants: 1,
           type: 'custom',
           metricName: newMetricName.trim() || 'Units',
           goal: parseInt(newGoal) || 100,
           friends: [{ name: currentUserName, progress: 0, userId: currentUserId, lastSyncedAt: null }],
           joinedUsers: [currentUserId],
           createdAt: new Date().toISOString()
       };
       
       try {
         await addDoc(collection(db, 'challenges'), newChallenge);
         setIsCreating(false);
         setNewTitle('');
         setNewDesc('');
         setNewMetricName('');
         setNewGoal('10000');
       } catch (err) {
         console.error("Error creating challenge:", err);
       }
   };

   const toggleSelection = (id: string) => {
       setSelectedChallenges(prev => 
           prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
       );
   };

   const toggleExpand = (id: string) => {
       setExpandedChallenges(prev => 
           prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
       );
   };

   const handleDeleteSelected = async () => {
       for (const id of selectedChallenges) {
           try {
               await deleteDoc(doc(db, 'challenges', id));
           } catch (err) {
               console.error("Error deleting challenge:", err);
           }
       }
       setSelectedChallenges([]);
       setIsDeleteMode(false);
   };

   const handleSyncClick = (c: any, myFriendEntry: any) => {
       const todayStr = new Date().toISOString().split('T')[0];
       if (myFriendEntry?.lastSyncedAt === todayStr) {
           setAlertMessage("You have already synced this challenge today! Come back tomorrow.");
           return;
       }
       setSyncModal({
           challengeId: c.id,
           title: c.title,
           metricName: c.metricName || 'Units',
           currentProgress: myFriendEntry?.progress || 0
       });
       setSyncValue('');
   };

   const confirmSync = async () => {
       if (!syncModal) return;
       const addedValue = parseInt(syncValue);
       if (isNaN(addedValue) || addedValue <= 0) {
           setAlertMessage("Please enter a valid number.");
           return;
       }

       const challenge = challenges.find(c => c.id === syncModal.challengeId);
       if (!challenge) return;

       const todayStr = new Date().toISOString().split('T')[0];
       const challengeRef = doc(db, 'challenges', challenge.id);
       const updatedFriends = challenge.friends.map((f: any) => 
           f.userId === currentUserId ? { ...f, progress: f.progress + addedValue, lastSyncedAt: todayStr } : f
       );

       try {
           await updateDoc(challengeRef, { friends: updatedFriends });
           setSyncModal(null);
           setAlertMessage("Successfully synced! Progress updated.");
       } catch (err) {
           console.error("Error syncing progress", err);
       }
   };

   return (
       <div className="glass-card rounded-3xl p-6 border-white/5 shadow-xl">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
                 <Target size={14} className="mr-2 text-primary" />
                 Global Challenges
             </div>
             <div className="flex items-center gap-2">
                 {isDeleteMode && selectedChallenges.length > 0 && (
                     <button 
                        onClick={handleDeleteSelected}
                        className="h-8 px-3 flex items-center justify-center bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500 hover:bg-rose-500/20 transition-all active:scale-90 text-[10px] font-black uppercase tracking-widest"
                     >
                         <Trash2 size={12} className="mr-1" />
                         Remove
                     </button>
                 )}
                 <button 
                    onClick={() => setIsCreating(true)}
                    className="w-8 h-8 flex items-center justify-center bg-surface-elevated border border-card-border rounded-full text-primary hover:bg-primary/10 transition-all active:scale-90"
                    title="Create challenge"
                 >
                    <Plus size={16} />
                 </button>
                 <button 
                    onClick={() => {
                        setIsDeleteMode(!isDeleteMode);
                        setSelectedChallenges([]);
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-surface-elevated border border-card-border rounded-full text-muted hover:text-foreground transition-all active:scale-90"
                 >
                    <MoreHorizontal size={16} />
                 </button>
             </div>
           </div>

           {isCreating && (
               <form onSubmit={handleCreate} className="bg-surface-elevated rounded-2xl p-6 border border-primary/20 mb-6 animate-in fade-in slide-in-from-top-2 shadow-2xl">
                   <div className="flex justify-between items-center mb-6">
                       <h4 className="font-black text-sm text-primary uppercase tracking-tight">New Global Challenge</h4>
                       <button type="button" onClick={() => setIsCreating(false)} className="text-muted hover:text-foreground transition-colors p-1">
                           <X size={18} strokeWidth={3} />
                       </button>
                   </div>
                   <input
                       type="text"
                       placeholder="Challenge Title"
                       value={newTitle}
                       onChange={(e) => setNewTitle(e.target.value)}
                       className="w-full bg-neutral-800 text-sm text-slate-200 rounded-lg px-3 py-2 border border-[#333] mb-2 focus:outline-none focus:border-primary"
                       required
                   />
                   <input
                       type="text"
                       placeholder="Short description"
                       value={newDesc}
                       onChange={(e) => setNewDesc(e.target.value)}
                       className="w-full bg-neutral-800 text-xs text-slate-300 rounded-lg px-3 py-2 border border-[#333] mb-2 focus:outline-none focus:border-primary"
                   />
                   <div className="flex gap-2 mb-3">
                       <input
                           type="text"
                           placeholder="Metric (e.g. Pushups)"
                           value={newMetricName}
                           onChange={(e) => setNewMetricName(e.target.value)}
                           className="w-full bg-neutral-800 text-xs text-slate-300 rounded-lg px-3 py-2 border border-[#333] focus:outline-none focus:border-primary"
                           required
                       />
                       <input
                           type="number"
                           placeholder="Goal value (e.g. 50000)"
                           value={newGoal}
                           onChange={(e) => setNewGoal(e.target.value)}
                           className="w-full bg-neutral-800 text-xs text-slate-300 rounded-lg px-3 py-2 border border-[#333] focus:outline-none focus:border-primary"
                           required
                       />
                   </div>
                   <button 
                       type="submit"
                       className="w-full py-2 bg-primary text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-transform active:scale-95 shadow-[0_0_15px_rgba(132,204,22,0.2)]"
                   >
                       Start Challenge
                   </button>
               </form>
           )}

           <div className="space-y-4">
              {challenges.map(c => {
                  const isJoined = c.joinedUsers?.includes(currentUserId);
                  const myFriendEntry = c.friends?.find((f: any) => f.userId === currentUserId);
                  const currentProgress = myFriendEntry?.progress || 0;

                  return (
                  <div key={c.id} className="flex gap-3 items-stretch">
                      {isDeleteMode && (
                          <div className="flex items-center justify-center pt-5">
                              <button 
                                  onClick={() => toggleSelection(c.id)}
                                  className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${selectedChallenges.includes(c.id) ? 'bg-primary border-primary' : 'bg-surface-elevated border-card-border'}`}
                              >
                                  {selectedChallenges.includes(c.id) && <div className="w-2.5 h-2.5 bg-black rounded-[2px]" />}
                              </button>
                          </div>
                      )}
                      <div 
                          className="flex-1 bg-surface-elevated rounded-2xl p-5 border border-card-border transition-all hover:bg-primary/5 min-w-0 cursor-pointer"
                          onClick={() => { if (isJoined) toggleExpand(c.id); }}
                      >
                          <div className="flex justify-between items-start mb-3 gap-2">
                              <div className="min-w-0 flex-1 pr-2">
                                  <h4 className="font-black text-sm text-foreground truncate uppercase tracking-tight">{c.title}</h4>
                                  <p className="text-[10px] text-muted font-bold tracking-tight line-clamp-1">{c.description}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                  <div className="flex items-center text-[10px] text-muted bg-black/5 dark:bg-black/40 px-3 py-1.5 rounded-full border border-card-border font-black">
                                      <Users size={12} className="mr-1.5 text-primary" />
                                      {c.participants}
                                  </div>
                                  {isJoined && (
                                      <div className="text-muted opacity-50 transition-transform">
                                          {expandedChallenges.includes(c.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                      </div>
                                  )}
                              </div>
                          </div>

                          {isJoined ? (
                             expandedChallenges.includes(c.id) && (
                             <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                                 <div className="flex justify-between text-[10px] uppercase font-black tracking-widest mb-2 text-slate-500">
                                     <span>Score: <span className="text-primary font-mono">{currentProgress}</span> / {c.goal}</span>
                                     <span>{Math.round((currentProgress / (c.goal || 1)) * 100)}%</span>
                                 </div>
                                 <div className="w-full h-2 bg-black/40 rounded-full mb-4 overflow-hidden ring-1 ring-white/5">
                                     <div className="h-full bg-primary" style={{ width: `${Math.min(100, (currentProgress / (c.goal || 1)) * 100)}%` }} />
                                 </div>

                                 <div className="flex gap-2">
                                    <button 
                                       onClick={(e) => { e.stopPropagation(); handleSyncClick(c, myFriendEntry); }}
                                       className="flex-1 py-2.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/20 transition-all active:scale-95"
                                    >
                                       Sync
                                    </button>
                                    <button 
                                       onClick={(e) => { e.stopPropagation(); toggleJoin(c.id); }}
                                       className="px-4 py-2.5 bg-white/5 border border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-rose-500 transition-all active:scale-95"
                                    >
                                       Leave
                                    </button>
                                 </div>
                                 
                                 {c.friends && c.friends.length > 0 && (
                                     <>
                                         <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 mt-4">Participants Leaderboard</div>
                                         <div className="space-y-1 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                                             {[...c.friends].sort((a: any, b: any) => b.progress - a.progress).map((f: any, i: number) => (
                                                 <div key={i} className={`flex justify-between items-center p-1.5 rounded-lg text-xs ${f.userId === currentUserId ? 'bg-primary/10 text-primary font-bold' : 'text-slate-300'}`}>
                                                     <div className="flex gap-2">
                                                        <span className="opacity-50 font-mono text-[10px] pt-0.5">{i + 1}.</span>
                                                        <span>{f.name}</span>
                                                     </div>
                                                     <span className="font-mono text-[10px]">{f.progress}</span>
                                                 </div>
                                             ))}
                                         </div>
                                     </>
                                 )}
                                 
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); toggleJoin(c.id); }}
                                    className="mt-4 w-full py-2 bg-neutral-800 text-slate-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-transform active:scale-95 hidden"
                                 >
                                    Leave
                                 </button>
                             </div>
                             )
                          ) : (
                              <button 
                                 onClick={(e) => { e.stopPropagation(); toggleJoin(c.id); toggleExpand(c.id); }}
                                 className="mt-3 w-full py-2 bg-primary text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-transform active:scale-95 shadow-[0_0_15px_rgba(132,204,22,0.2)]"
                              >
                                 Join Challenge
                              </button>
                          )}
                      </div>
                  </div>
                  )})}
              </div>

              {/* Sync Modal */}
              {syncModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
                      <div className="bg-surface-elevated w-full max-w-sm rounded-3xl p-6 border border-card-border shadow-2xl animate-in zoom-in-95">
                          <div className="flex justify-between items-start mb-6">
                              <div>
                                  <h3 className="font-black text-lg uppercase tracking-tight">{syncModal.title}</h3>
                                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Sync {syncModal.metricName}</p>
                              </div>
                              <button onClick={() => setSyncModal(null)} className="p-2 bg-background/50 rounded-full text-muted hover:text-foreground">
                                  <X size={16} />
                              </button>
                          </div>
                          <div className="mb-6">
                              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">How many {syncModal.metricName} today?</label>
                              <input 
                                  type="number"
                                  value={syncValue}
                                  onChange={(e) => setSyncValue(e.target.value)}
                                  placeholder="e.g. 50"
                                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary transition-colors"
                                  autoFocus
                              />
                          </div>
                          <button 
                              onClick={confirmSync}
                              className="w-full py-3 bg-primary text-black font-black uppercase tracking-widest rounded-xl text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
                          >
                              Sync Progress
                          </button>
                      </div>
                  </div>
              )}

              {/* Alert Modal */}
              {alertMessage && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm" onClick={() => setAlertMessage(null)}>
                      <div className="bg-surface-elevated w-full max-w-sm rounded-3xl p-6 border border-card-border shadow-2xl animate-in zoom-in-95 text-center" onClick={(e) => e.stopPropagation()}>
                          <p className="font-bold text-sm mb-6">{alertMessage}</p>
                          <button 
                              onClick={() => setAlertMessage(null)}
                              className="w-full py-3 bg-background border border-card-border text-foreground font-black uppercase tracking-widest rounded-xl text-xs hover:bg-white/5 active:scale-95 transition-all"
                          >
                              Close
                          </button>
                      </div>
                  </div>
              )}
          </div>
      );
   }
