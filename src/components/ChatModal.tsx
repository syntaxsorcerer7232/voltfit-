import React, { useState, useEffect, useRef } from "react";
import { X, Send, User, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

interface ChatModalProps {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserImage: string;
  onClose: () => void;
}

export default function ChatModal({
  chatId,
  otherUserId,
  otherUserName,
  otherUserImage,
  onClose,
}: ChatModalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUserId,
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[100] bg-background flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-card-border bg-surface-elevated/80 backdrop-blur-3xl">
          <div className="flex items-center gap-3">
            {otherUserImage ? (
              <img
                src={otherUserImage}
                alt="User"
                className="w-10 h-10 rounded-full border border-card-border object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center">
                <User size={20} className="text-muted" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-foreground leading-tight">
                {otherUserName}
              </h3>
              <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">
                Online
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-surface-elevated border border-card-border rounded-full text-muted hover:text-foreground transition-all shadow-md active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-background/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
              <div className="w-16 h-16 rounded-full bg-surface-elevated/50 border border-card-border flex items-center justify-center mb-4">
                <MessageSquare size={24} />
              </div>
              <p className="text-sm font-bold text-muted uppercase tracking-widest opacity-60">
                Silence In The Forge
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 font-medium shadow-sm transition-all border ${isMe ? "bg-primary text-black border-primary/20 rounded-tr-sm" : "bg-surface-elevated text-foreground border-card-border rounded-tl-sm"}`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-card-border bg-surface-elevated/80 backdrop-blur-3xl pb-safe">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Transmit signal..."
              className="flex-1 bg-background/50 border border-card-border rounded-full px-6 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3.5 bg-primary text-black rounded-full shadow-lg shadow-primary/20 disabled:opacity-50 disabled:active:scale-100 active:scale-90 transition-all"
            >
              <Send size={20} strokeWidth={3} />
            </button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
