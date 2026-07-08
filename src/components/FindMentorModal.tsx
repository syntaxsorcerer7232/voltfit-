import React, { useState, useEffect } from "react";
import { X, Search, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

interface UserProfileSubset {
  id: string;
  name: string;
  profilePicture?: string;
  reputationPoints: number;
}

interface FindMentorModalProps {
  onClose: () => void;
  onOpenChat: (chatId: string, mentor: UserProfileSubset) => void;
}

export default function FindMentorModal({
  onClose,
  onOpenChat,
}: FindMentorModalProps) {
  const [advisors, setAdvisors] = useState<UserProfileSubset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app we'd query 'where("isAdvisor", "==", true)'
    // Here we just fetch public_profiles to demo.
    const fetchAdvisors = async () => {
      try {
        const q = query(collection(db, "public_profiles"));
        const snap = await getDocs(q);
        const data = snap.docs
          .map((d) => ({
            id: d.id,
            name: d.data().name || "Anonymous",
            profilePicture: d.data().profilePicture,
            reputationPoints: d.data().reputationPoints || 0,
          }))
          .filter((u) => u.id !== auth.currentUser?.uid); // Don't list self

        // Sort by reputation points artificially as a proxy for 'advisor' ranking
        data.sort((a, b) => b.reputationPoints - a.reputationPoints);
        setAdvisors(data);
      } catch (err) {
        console.error("Failed to fetch advisors", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdvisors();
  }, []);

  const handleConnect = async (mentor: UserProfileSubset) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    // Sort IDs to ensure stable chat ID between these two users
    const participants = [currentUserId, mentor.id].sort();
    const chatId = participants.join("_");

    try {
      const chatRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          participants,
          lastMessage: "",
          lastMessageAt: null,
        });
      }

      onOpenChat(chatId, mentor);
    } catch (err) {
      console.error("Failed to create chat", err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-surface-elevated/90 backdrop-blur-3xl border border-card-border rounded-[2.5rem] w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
        >
          <div className="p-6 border-b border-card-border flex items-center justify-between sticky top-0 bg-surface-elevated/80 backdrop-blur-md z-10">
            <div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tighter italic">
                Iron Council
              </h2>
              <p className="text-[10px] text-muted font-black uppercase tracking-[0.2em] opacity-60">
                Locate Expert Advisors
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-background/50 border border-card-border rounded-full text-muted hover:text-foreground transition-all active:scale-90 shadow-md"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-background/20">
            {loading ? (
              <div className="py-20 text-center">
                 <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-lg" />
                 <p className="text-[10px] text-muted uppercase font-black tracking-widest mt-6 opacity-40">Syncing with Iron Network...</p>
              </div>
            ) : advisors.length === 0 ? (
              <div className="text-center py-20 bg-surface-elevated/20 rounded-[2rem] border border-dashed border-card-border">
                 <p className="text-[10px] text-muted uppercase font-black tracking-widest opacity-40 leading-relaxed px-6">The field is quiet. No advisors transmitting currently.</p>
              </div>
            ) : (
              advisors.map((adv) => (
                <div
                  key={adv.id}
                  className="bg-surface-elevated/50 backdrop-blur-xl rounded-[2rem] p-5 border border-card-border flex items-center gap-5 group hover:border-primary/30 hover:bg-surface-elevated/80 transition-all shadow-xl"
                >
                  {adv.profilePicture ? (
                    <img
                      src={adv.profilePicture}
                      alt={adv.name}
                      className="w-14 h-14 rounded-full border border-card-border object-cover shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-background border border-card-border flex items-center justify-center shadow-lg">
                      <ShieldCheck size={24} className="text-muted" strokeWidth={2.5} />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-black text-foreground text-sm uppercase tracking-tight group-hover:text-primary transition-colors italic">{adv.name}</h4>
                    <div className="text-[9px] text-muted flex items-center gap-1.5 font-black uppercase tracking-[0.2em] mt-1.5 opacity-60">
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                      {adv.reputationPoints} SP Units
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnect(adv)}
                    className="bg-primary text-black hover:scale-105 transition-all text-[9px] font-black uppercase tracking-[0.2em] px-5 py-3 rounded-xl shadow-lg active:scale-95"
                  >
                    ESTABLISH LINK
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
