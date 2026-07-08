import React, { useState, useEffect } from "react";
import {
  Users,
  Activity,
  Target,
  MessageSquare,
  Plus,
  Lock,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import {
  getDynamicStrengthScore,
  getRank,
  canBeAdvisor,
} from "../utils/community";
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import FindMentorModal from "../components/FindMentorModal";
import ChatModal from "../components/ChatModal";

export default function CommunityMentorship() {
  const { user, workoutHistory } = useAppContext();
  const strengthScore = getDynamicStrengthScore(user?.lifts, workoutHistory);
  const currentRank = getRank(strengthScore);
  const isMentor = user
    ? canBeAdvisor(user, workoutHistory?.length || 0, 30, workoutHistory || [])
    : false;

  const [mentees, setMentees] = useState<any[]>([]);
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showFindMentor, setShowFindMentor] = useState(false);
  const [activeChat, setActiveChat] = useState<{
    chatId: string;
    user: any;
  } | null>(null);
  const [myChats, setMyChats] = useState<any[]>([]);

  useEffect(() => {
    // In a real app we'd query real mentorship relationships
    setLoading(false);
  }, []);

  useEffect(() => {
    // Poll chats
    const fetchChats = async () => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      try {
        const q = query(
          collection(db, "chats"),
          where("participants", "array-contains", currentUserId),
        );
        const snap = await getDocs(q);

        const chatsList = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            const otherId = data.participants.find(
              (id: string) => id !== currentUserId,
            );
            // Try to find an advisor name
            let otherUser: any = { id: otherId || 'Unknown', name: "Unknown User" };
            
            if (otherId) {
              try {
                const userDocSnap = await getDoc(
                  doc(db, "public_profiles", otherId)
                );
                if (userDocSnap.exists()) {
                  otherUser = { id: otherId, ...userDocSnap.data() };
                }
              } catch (profileErr) {
                console.error("Failed to load profile for otherId:", otherId, profileErr);
              }
            }

            return {
              id: d.id,
              otherUser,
              ...data,
            };
          }),
        );

        setMyChats(chatsList);
      } catch (err) {
        console.error("Failed to fetch chats", err);
      }
    };
    fetchChats();
  }, [activeChat, showFindMentor]);

  const handleOpenChat = (chatId: string, mentorUser: any) => {
    setShowFindMentor(false);
    setActiveChat({ chatId, user: mentorUser });
  };

  if (!isMentor) {
    return (
      <div className="w-full relative">
        {/* Background Decorative Glows */}
        <div className="fixed top-1/2 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[150px] -z-10 pointer-events-none" />

        <div className="p-4 md:p-8 pb-32 space-y-10 max-w-5xl mx-auto">
          <div className="bg-surface-elevated/40 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-card-border shadow-2xl relative overflow-hidden group pt-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000 opacity-50"></div>
            
            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
              <div className="bg-surface-elevated p-8 rounded-[2.5rem] border border-card-border shadow-inner scale-110">
                <Lock size={48} strokeWidth={3} className="text-muted opacity-30" />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter italic mb-3">
                  Advisor Sanctuary
                </h2>
                <p className="text-sm text-muted font-black italic opacity-60 uppercase tracking-widest">
                  Reserved for those who have mastered the Iron.
                </p>
                <div className="mt-8 inline-flex items-center gap-3 bg-primary/10 border border-primary/20 px-5 py-2.5 rounded-2xl shadow-sm">
                   <Target size={18} className="text-primary" strokeWidth={3} />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Requirement: 200kg Powerlifting Total</span>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 pt-10 mt-12 border-t border-card-border flex flex-col md:flex-row justify-between items-center gap-8">
              <p className="text-[10px] text-muted/60 italic max-w-xs text-center md:text-left font-black uppercase tracking-widest leading-relaxed">
                "To lead, you must first endure. Prove your strength to guide the next generation."
              </p>
              <div className="flex items-center gap-6 bg-background/30 px-6 py-4 rounded-[2rem] border border-card-border">
                 <div className="h-1.5 w-32 bg-background rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-primary shadow-[0_0_10px_rgba(132,204,22,0.5)]" 
                      style={{ width: `${Math.min(100, (strengthScore / 200) * 100)}%` }} 
                    />
                 </div>
                 <span className="text-[11px] font-black text-muted tracking-widest">{strengthScore} / 200 KG</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end px-4">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-40">
              Active Connections
            </h3>
          </div>

          <div className="space-y-6">
            {myChats.length === 0 ? (
              <div className="bg-surface-elevated/30 backdrop-blur-2xl rounded-[3rem] border border-card-border p-16 text-center group overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0 bg-primary/5 blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-background/50 border border-card-border rounded-full flex items-center justify-center mb-8 shadow-xl">
                    <Users size={36} className="text-muted opacity-30" strokeWidth={3} />
                  </div>
                  <p className="text-xs font-black text-muted mb-12 uppercase tracking-[0.3em] opacity-40 italic">
                    The bond has not yet been forged.
                  </p>
                  <button
                    onClick={() => setShowFindMentor(true)}
                    className="bg-foreground text-background font-black text-[10px] uppercase tracking-[0.4em] px-14 py-6 rounded-3xl hover:scale-[1.05] active:scale-95 transition-all shadow-2xl"
                  >
                    LOCATE ADVISOR
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <button
                  onClick={() => setShowFindMentor(true)}
                  className="w-full bg-surface-elevated/20 border border-dashed border-card-border rounded-[2.5rem] p-8 text-muted text-[10px] font-black uppercase tracking-[0.4em] hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-4 active:scale-[0.99] opacity-60 hover:opacity-100"
                >
                  <Plus size={20} strokeWidth={3} /> DEEP SEARCH ADVISORS
                </button>
                {myChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="bg-surface-elevated/40 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-8 border border-card-border flex items-center gap-6 cursor-pointer hover:border-primary/40 hover:-translate-y-1.5 transition-all group hover:shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
                    onClick={() => handleOpenChat(chat.id, chat.otherUser)}
                  >
                    <div className="relative scale-110">
                      {chat.otherUser.profilePicture ? (
                        <img
                          src={chat.otherUser.profilePicture}
                          alt=""
                          className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-card-border group-hover:border-primary/50 transition-all shadow-2xl"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-background border-2 border-card-border group-hover:border-primary/50 transition-all flex items-center justify-center shadow-2xl text-muted font-black text-2xl">
                          {chat.otherUser.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full border-4 border-background flex items-center justify-center shadow-lg">
                         <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 ml-4">
                      <h4 className="font-black text-foreground text-xl md:text-2xl truncate italic tracking-tighter uppercase group-hover:text-primary transition-colors">
                        {chat.otherUser.name || "Anonymous Mentor"}
                      </h4>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 font-black tracking-[0.2em] uppercase">
                          Primary Advisor
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-primary p-4 md:p-6 rounded-[2rem] text-black shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform active:scale-90">
                      <MessageSquare size={24} strokeWidth={3} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showFindMentor && (
            <FindMentorModal
              onClose={() => setShowFindMentor(false)}
              onOpenChat={handleOpenChat}
            />
          )}
          {activeChat && (
            <ChatModal
              chatId={activeChat.chatId}
              otherUserId={activeChat.user.id}
              otherUserName={activeChat.user.name}
              otherUserImage={activeChat.user.profilePicture}
              onClose={() => setActiveChat(null)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Background Decorative Glows */}
      <div className="fixed top-1/4 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      
      <div className="p-4 md:p-8 pb-32 space-y-10 max-w-5xl mx-auto">
        <div className="bg-surface-elevated/40 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 border border-card-border shadow-2xl relative overflow-hidden group pt-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-20"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-10 mb-12 relative z-10">
            <div className="bg-primary/10 p-8 rounded-[2.5rem] border border-primary/20 shadow-2xl shadow-primary/5">
              <Users size={56} strokeWidth={3} className="text-primary" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter italic mb-2">
                Mentor Command
              </h2>
              <p className="text-[10px] text-primary uppercase font-black tracking-[0.3em] bg-primary/10 inline-block px-4 py-2 rounded-2xl border border-primary/20 mt-3 shadow-sm">Elite Advisor Status Active</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 relative z-10 border-t border-card-border pt-10">
            {[
              { label: 'Connections', value: myChats.length, color: 'text-foreground' },
              { label: 'Success Rate', value: myChats.length > 0 ? "100%" : "0%", color: 'text-foreground' },
              { label: 'Units Earned', value: '+340', color: 'text-amber-500' }
            ].map((stat, i) => (
              <div key={stat.label} className={`text-center ${i === 1 ? 'border-x border-card-border/50 px-4' : ''}`}>
                <div className={`text-3xl md:text-5xl font-black italic tracking-tighter ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-[9px] md:text-[11px] text-muted uppercase tracking-[0.2em] font-black mt-3 opacity-60">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-end px-4">
          <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-40">
            Active Units & Mentees
          </h3>
          <p className="text-[10px] text-primary font-black uppercase tracking-widest italic opacity-60">All systems active</p>
        </div>

        <div className="space-y-6">
          {myChats.length === 0 ? (
            <div className="bg-surface-elevated/20 backdrop-blur-2xl rounded-[3rem] border border-card-border p-20 text-center shadow-inner group">
              <div className="w-16 h-16 bg-background/50 rounded-full flex items-center justify-center mx-auto mb-10 border border-card-border shadow-xl group-hover:scale-110 transition-transform">
                <Target size={32} className="text-muted opacity-30" strokeWidth={3} />
              </div>
              <p className="text-xs font-black text-muted uppercase tracking-[0.3em] italic max-w-xs mx-auto leading-relaxed opacity-40">
                "The quiet field. Your wisdom awaits a seeker."
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myChats.map((chat) => (
                <div
                  key={chat.id}
                  className="bg-surface-elevated/40 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-card-border flex items-center gap-6 cursor-pointer hover:border-primary/40 hover:-translate-y-1.5 transition-all group shadow-xl"
                  onClick={() => handleOpenChat(chat.id, chat.otherUser)}
                >
                  <div className="relative scale-110">
                    {chat.otherUser.profilePicture ? (
                      <img
                        src={chat.otherUser.profilePicture}
                        alt=""
                        className="w-16 h-16 rounded-full object-cover border-2 border-card-border group-hover:border-primary/40 transition-all shadow-xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-background border-2 border-card-border group-hover:border-primary/40 transition-all flex items-center justify-center shadow-xl text-muted font-black text-xl">
                        {chat.otherUser.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-background animate-pulse" />
                  </div>
                  
                  <div className="flex-1 min-w-0 ml-4">
                    <h4 className="font-black text-foreground text-lg md:text-xl truncate uppercase italic tracking-tighter group-hover:text-primary transition-colors">
                      {chat.otherUser.name || "Anonymous User"}
                    </h4>
                    <span className="text-[10px] text-muted uppercase font-black tracking-[0.2em] opacity-60">
                      Active Mentee
                    </span>
                  </div>
                  
                  <div className="bg-background/50 group-hover:bg-primary p-4 rounded-2xl transition-all text-muted group-hover:text-black shadow-lg border border-card-border group-hover:border-primary active:scale-90">
                    <MessageSquare size={20} strokeWidth={3} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeChat && (
          <ChatModal
            chatId={activeChat.chatId}
            otherUserId={activeChat.user.id}
            otherUserName={activeChat.user.name}
            otherUserImage={activeChat.user.profilePicture}
            onClose={() => setActiveChat(null)}
          />
        )}
      </div>
    </div>
  );
}
