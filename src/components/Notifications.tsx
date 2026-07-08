import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { AppNotification } from '../types';
import { Bell, Trash2, CheckCircle2, MessageSquare, Award, Info, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationsProps {
  onClose: () => void;
  onNavigateToQuestion?: (questionId: string) => void;
}

export default function Notifications({ onClose, onNavigateToQuestion }: NotificationsProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId]);

  const fetchNotifications = async () => {
    if (!currentUserId) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUserId)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification));
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error("Error marking read", e);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error("Error marking all read", e);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error("Error deleting notification", e);
    }
  };

  const handleNotifClick = (notif: AppNotification) => {
    if (!notif.isRead) markAsRead(notif.id);
    if (notif.type === 'reply' && notif.referenceId && onNavigateToQuestion) {
      onNavigateToQuestion(notif.referenceId);
      onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'reply': return <MessageSquare size={16} className="text-primary" />;
      case 'achievement': return <Award size={16} className="text-yellow-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col bg-background relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-[20%] -right-[10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] opacity-10" />
      </div>

      <header className="px-8 py-10 border-b border-card-border flex items-center justify-between bg-background/60 backdrop-blur-3xl sticky top-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-6">
           <button 
             onClick={onClose} 
             className="p-3 bg-surface-elevated border border-card-border rounded-2xl text-muted hover:text-foreground hover:scale-110 hover:rotate-[-5deg] active:scale-95 transition-all shadow-xl shadow-black/20 group"
           >
             <ChevronLeft size={24} strokeWidth={3} className="text-muted group-hover:text-foreground transition-colors" />
           </button>
           <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                 <Bell size={24} className="text-primary" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tighter leading-none">Notifications</h2>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-40 mt-2">Status Stream</span>
              </div>
           </div>
        </div>
      </header>

      <div className="p-6 flex justify-end">
         <button 
           onClick={markAllAsRead}
           className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 bg-primary/5 border border-primary/20 px-4 py-2.5 rounded-full hover:bg-primary/10 transition-all active:scale-95 shadow-lg shadow-primary/5"
         >
            <CheckCircle2 size={12} /> Sync all as read
         </button>
      </div>

      <div className="flex-1 px-4 pb-32">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-xs font-black text-muted uppercase tracking-widest">Accessing Logs...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center space-y-4">
             <div className="w-20 h-20 bg-surface-elevated rounded-full flex items-center justify-center mx-auto opacity-20">
                <Bell size={40} className="text-muted" />
             </div>
             <p className="text-sm font-black text-muted uppercase italic">No notifications found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {notifications.map(notif => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={() => handleNotifClick(notif)}
                  className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden shadow-2xl ${
                    notif.isRead 
                      ? 'bg-surface-elevated/30 border-card-border grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:bg-surface-elevated/50' 
                      : 'bg-surface-elevated/80 backdrop-blur-md border-primary/30 shadow-xl shadow-primary/5 hover:border-primary/60 hover:-translate-y-1'
                  }`}
                >
                  {!notif.isRead && (
                    <div className="absolute top-0 right-0 w-2 h-full bg-primary shadow-[0_0_15px_rgba(132,204,22,0.4)]" />
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-2xl shrink-0 shadow-lg ${notif.isRead ? 'bg-background/50' : 'bg-primary/10 border border-primary/20 shadow-primary/10'}`}>
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-black uppercase tracking-tight mb-2 italic ${notif.isRead ? 'text-muted' : 'text-foreground'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-muted/80 leading-relaxed italic font-medium">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-[8px] text-muted/60 font-black uppercase tracking-[0.2em] italic bg-background/50 px-2 py-1 rounded-md border border-card-border/50">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[8px] text-muted/60 font-black uppercase tracking-[0.2em] italic bg-background/50 px-2 py-1 rounded-md border border-card-border/50">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => deleteNotification(e, notif.id)}
                      className="p-3 opacity-0 group-hover:opacity-100 bg-surface-elevated border border-card-border rounded-xl text-rose-500 transition-all hover:bg-rose-500 hover:text-white shadow-xl hover:scale-110 active:scale-95"
                    >
                       <Trash2 size={16} strokeWidth={3} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
