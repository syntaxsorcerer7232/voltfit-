import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Share2, 
  MessageCircle, 
  Bookmark, 
  Heart, 
  Brain, 
  Zap, 
  ShieldCheck, 
  Search, 
  ChevronDown, 
  Pencil, 
  Trash2 
} from 'lucide-react';
import { CommunityTip } from '../types';
import { getRank } from '../utils/community';
import { useAppContext } from '../context/AppContext';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  getDocs,
  startAfter, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  arrayUnion, 
  arrayRemove, 
  limit 
} from 'firebase/firestore';
import { EmptyState } from '../components/EmptyState';
import { CreateTipModal } from '../components/community/CreateTipModal';
import { CommentsModal } from '../components/community/CommentsModal';
import { IneligibleModal } from '../components/community/IneligibleModal';

const TIPS_PER_PAGE = 5;

export default function CommunityTipsFeed({ isCreatingTip, setIsCreatingTip }: { isCreatingTip: boolean, setIsCreatingTip: (val: boolean) => void }) {
  const { user, awardPoints, communityTips: tips } = useAppContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showIneligibleMessage, setShowIneligibleMessage] = useState(false);
  const [selectedTipForComments, setSelectedTipForComments] = useState<CommunityTip | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTip, setEditingTip] = useState<CommunityTip | null>(null);
  
  const currentUserId = user?.userId || user?.id || auth.currentUser?.uid || '';
  
  useEffect(() => {
    const handleIneligible = () => setShowIneligibleMessage(true);
    window.addEventListener('show-ineligible-modal' as any, handleIneligible);

    return () => {
      window.removeEventListener('show-ineligible-modal' as any, handleIneligible);
    };
  }, []);

  const handleCreateTip = async (title: string, content: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setIsCreatingTip(false);
    
    try {
      const { getRank } = await import('../utils/community');
      const totalLift = (user?.lifts?.squat || 0) + (user?.lifts?.bench || 0) + (user?.lifts?.deadlift || 0);
      const currentRank = getRank(totalLift);
      const tipData = {
        authorId: currentUserId || 'anonymous',
        authorName: user?.name || 'Anonymous',
        authorImage: user?.profilePicture || '',
        authorPhoto: user?.profilePicture || '',
        authorRank: currentRank.name,
        authorBadges: ['Advisor'],
        badges: ['Advisor'],
        title: title,
        content: content,
        likes: { helpful: [], motivating: [], science: [], bookmarks: [] },
        comments: [],
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'tips'), tipData);
      
      awardPoints(10, false, 'Knowledge Sharing');
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Knowledge shared! +10 XP`, type: 'success' }}));
    } catch (e) {
      console.error("Error creating tip", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTip = async (tipId: string) => {
    if (window.confirm("Are you sure you want to delete this tip globally?")) {
      try {
        await deleteDoc(doc(db, 'tips', tipId));
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Tip deleted successfully`, type: 'success' }}));
      } catch (e) {
        console.error("Failed to delete tip", e);
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Failed to delete tip`, type: 'error' }}));
      }
    }
  };

  const [copiedTipId, setCopiedTipId] = useState<string | null>(null);

  const handleShareTip = async (tip: CommunityTip) => {
    const text = `${tip.title} by ${tip.authorName}\n\n${tip.content}\n\nShared from VoltFit Community.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: tip.title,
          text: text,
        });
        return;
      } catch (e) {
        // fallback
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTipId(tip.id);
      setTimeout(() => setCopiedTipId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleReaction = async (tipId: string, type: 'helpful' | 'science' | 'motivating' | 'bookmarks') => {
    const currentUserId = user?.userId || user?.id || auth.currentUser?.uid;
    if (!currentUserId) return;
    
    // Update in Firestore
    try {
      const tipRef = doc(db, 'tips', tipId);
      const tipData = tips.find(t => t.id === tipId);
      if (tipData) {
        const likes = tipData.likes || { helpful: [], motivating: [], science: [], bookmarks: [] };
        const currentLikesList = likes[type] || [];
        const hasLiked = currentLikesList.includes(currentUserId);
        if (hasLiked) {
          await updateDoc(tipRef, {
            [`likes.${type}`]: arrayRemove(currentUserId)
          });
        } else {
          await updateDoc(tipRef, {
            [`likes.${type}`]: arrayUnion(currentUserId)
          });
        }
      }
    } catch (e) {
      console.error("Error toggling reaction", e);
    }
  };

  const handlePostComment = async (comment: string) => {
    if (!selectedTipForComments || !user) return;
    const commentObj = {
      id: Math.random().toString(36).substr(2, 9),
      authorId: user.userId || user.id || auth.currentUser?.uid || 'anonymous',
      authorName: user.name || 'Anonymous',
      authorImage: user.profilePicture || '',
      content: comment,
      createdAt: new Date().toISOString()
    };

    // No optimistic update needed as onSnapshot handles it
    try {
      const tipRef = doc(db, 'tips', selectedTipForComments.id);
      await updateDoc(tipRef, {
        comments: arrayUnion(commentObj)
      });
    } catch (e) {
      console.error("Error posting comment", e);
    }
  };

  const handleSwipeReaction = (tipId: string, direction: 'left' | 'right') => {
    handleToggleReaction(tipId, direction === 'right' ? 'helpful' : 'motivating');
  };

  const filteredTips = tips.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Derive active comments tip from real-time list to display comments instantly
  const activeTipForComments = selectedTipForComments
    ? (tips.find(t => t.id === selectedTipForComments.id) || selectedTipForComments)
    : null;

  return (
    <div className="w-full relative">
      {/* Background Decorative Glows */}
      <div className="fixed top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-1/4 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="w-full pb-32 px-4 md:px-8 max-w-5xl mx-auto space-y-6 pt-8">
        <div className="relative mb-10">
           <div className="absolute inset-0 bg-primary/5 blur-xl -z-10 opacity-50" />
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
           <input 
             type="text" 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             placeholder="Search tips, advice, or authors..." 
             className="w-full bg-surface-elevated/50 backdrop-blur-md border border-card-border rounded-2xl py-4 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary focus:bg-surface-elevated transition-all shadow-xl placeholder:text-muted/50" 
           />
        </div>

        {false ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm font-black uppercase tracking-widest">Hydrating the Feed...</p>
          </div>
        ) : filteredTips.length === 0 ? (
          <EmptyState 
            title="No Tips Yet"
            description="No community tips found. Check back later or share your own advice if you're an advisor!"
          />
        ) : (
          <div className="space-y-12">
            {filteredTips.map((tip) => (
              <div key={tip.id} className="w-full relative flex justify-center group">
                <div className="absolute inset-0 bg-background/40 -z-10 rounded-[2.5rem] scale-95 group-hover:scale-105 transition-transform duration-500" />
                
                <motion.div 
                   drag="x"
                   dragConstraints={{ left: 0, right: 0 }}
                   dragElastic={0.4}
                   onDragEnd={(e, { offset }) => {
                      if (offset.x > 150) {
                         handleSwipeReaction(tip.id, 'right');
                      } else if (offset.x < -150) {
                         handleSwipeReaction(tip.id, 'left');
                      }
                   }}
                   className="w-full rounded-[2.5rem] md:rounded-[3rem] border border-card-border overflow-hidden shadow-2xl relative bg-surface-elevated/40 backdrop-blur-2xl flex flex-col p-4 sm:p-6 md:p-10 cursor-grab active:cursor-grabbing min-h-[400px] md:min-h-[500px] transition-colors"
                >
                  
                  {/* Author details overlay top */}
                  <div className="w-full flex justify-between items-center z-10 mb-8 gap-4 text-left">
                      <div className="flex items-center gap-3 md:gap-4 bg-surface-elevated/80 pr-5 md:pr-6 pl-1.5 py-1.5 rounded-full border border-card-border backdrop-blur-md max-w-[85%] md:max-w-none shadow-sm">
                       {tip.authorImage ? (
                          <img src={tip.authorImage} alt={tip.authorName || 'User'} className="w-10 h-10 md:w-14 md:h-14 flex-shrink-0 rounded-full border border-primary/30 pointer-events-none object-cover shadow-lg" referrerPolicy="no-referrer" />
                       ) : (
                          <div className="w-10 h-10 md:w-14 md:h-14 flex-shrink-0 rounded-full border border-primary/30 bg-surface-elevated flex items-center justify-center font-black text-foreground text-[10px]">{tip.authorName?.charAt(0) || '?'}</div>
                       )}
                       <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-foreground font-black text-sm md:text-lg leading-none flex items-center gap-1.5 w-full">
                              <span className="truncate">{tip.authorName}</span> {(tip.authorBadges)?.length > 0 && <ShieldCheck size={14} className="text-primary flex-shrink-0" />}
                            </span>
                            <span className="text-muted text-[8px] md:text-[10px] uppercase tracking-[0.15em] font-black truncate mt-1.5 leading-none opacity-60">[{tip.authorRank || 'Member'}]</span>
                       </div>
                     </div>

                     {tip.authorId === currentUserId && (
                       <div className="flex gap-2 z-10">
                         <button 
                           onClick={() => setEditingTip(tip)} 
                           className="p-2.5 bg-surface-elevated border border-card-border rounded-xl hover:bg-primary/10 text-muted hover:text-primary transition-all shadow-lg active:scale-90" 
                           title="Edit Tip"
                         >
                            <Pencil size={14} />
                         </button>
                         <button 
                           onClick={() => handleDeleteTip(tip.id)} 
                           className="p-2.5 bg-rose-500/10 rounded-xl hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 transition-all shadow-lg active:scale-90" 
                           title="Delete Tip"
                         >
                            <Trash2 size={14} />
                         </button>
                       </div>
                     )}
                  </div>
                  
                  {/* Content Area */}
                  <div className="relative z-10 mt-2 mb-8 w-full text-left flex-1 flex flex-col justify-center">
                     <h3 className="text-2xl md:text-4xl font-black text-foreground mb-4 leading-tight italic tracking-tighter uppercase group-hover:text-primary transition-colors duration-500">{tip.title}</h3>
                     <p className="text-muted text-sm md:text-lg leading-relaxed select-text font-medium opacity-90">{tip.content}</p>
                     <div className="mt-8 flex items-center gap-2">
                        <div className="h-px bg-card-border flex-1" />
                        <p className="text-muted text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black italic whitespace-nowrap opacity-40">Swipe to React • Interact to Scale</p>
                        <div className="h-px bg-card-border flex-1" />
                     </div>
                  </div>
                  
                  {/* Interactions */}
                  <div className="flex flex-wrap items-center justify-between mt-auto z-10 pt-6 gap-y-4">
                     <div className="flex gap-2 sm:gap-4 md:gap-8">
                       <button onClick={() => handleToggleReaction(tip.id, 'helpful')} className={`flex flex-col items-center gap-1.5 transition-all ${tip.likes?.helpful?.includes(currentUserId) ? 'text-primary' : 'text-muted hover:text-primary'}`}>
                          <div className={`p-3 sm:p-4 md:p-5 rounded-2xl transition-all ${tip.likes?.helpful?.includes(currentUserId) ? 'bg-primary/20 scale-110 shadow-lg shadow-primary/10' : 'bg-surface-elevated/50 hover:bg-primary/10'}`}><Heart size={18} className={tip.likes?.helpful?.includes(currentUserId) ? "fill-primary" : ""} /></div>
                          <span className="text-[10px] font-black font-mono">{tip.likes?.helpful?.length || 0}</span>
                       </button>
                       <button onClick={() => handleToggleReaction(tip.id, 'science')} className={`flex flex-col items-center gap-1.5 transition-all ${tip.likes?.science?.includes(currentUserId) ? 'text-cyan-400' : 'text-muted hover:text-cyan-400'}`}>
                          <div className={`p-3 sm:p-4 md:p-5 rounded-2xl transition-all ${tip.likes?.science?.includes(currentUserId) ? 'bg-cyan-400/20 scale-110 shadow-lg shadow-cyan-400/10' : 'bg-surface-elevated/50 hover:bg-cyan-400/10'}`}><Brain size={18} className={tip.likes?.science?.includes(currentUserId) ? "fill-cyan-400" : ""} /></div>
                          <span className="text-[10px] font-black font-mono">{tip.likes?.science?.length || 0}</span>
                       </button>
                       <button onClick={() => handleToggleReaction(tip.id, 'motivating')} className={`flex flex-col items-center gap-1.5 transition-all ${tip.likes?.motivating?.includes(currentUserId) ? 'text-amber-400' : 'text-muted hover:text-amber-400'}`}>
                          <div className={`p-3 sm:p-4 md:p-5 rounded-2xl transition-all ${tip.likes?.motivating?.includes(currentUserId) ? 'bg-amber-400/20 scale-110 shadow-lg shadow-amber-400/10' : 'bg-surface-elevated/50 hover:bg-amber-400/10'}`}><Zap size={18} className={tip.likes?.motivating?.includes(currentUserId) ? "fill-amber-400" : ""} /></div>
                          <span className="text-[10px] font-black font-mono">{tip.likes?.motivating?.length || 0}</span>
                       </button>
                     </div>
                     
                     <div className="flex gap-2 md:gap-4">
                       <button onClick={() => setSelectedTipForComments(tip)} className="bg-surface-elevated/50 p-3 sm:p-4 md:p-5 rounded-2xl text-muted hover:text-primary hover:bg-primary/10 transition-all flex items-center gap-2">
                          <MessageCircle size={18} />
                          <span className="text-[10px] font-black">{tip.comments?.length || 0}</span>
                       </button>
                       <button onClick={() => handleToggleReaction(tip.id, 'bookmarks')} className={`p-3 sm:p-4 md:p-5 rounded-2xl transition-all ${tip.likes?.bookmarks?.includes(currentUserId) ? 'bg-primary/20 text-primary scale-110 shadow-lg shadow-primary/10' : 'bg-surface-elevated/50 text-muted hover:text-primary hover:bg-primary/10'}`}><Bookmark size={18} className={tip.likes?.bookmarks?.includes(currentUserId) ? "fill-primary" : ""} /></button>
                       <button onClick={() => handleShareTip(tip)} className="bg-surface-elevated/50 p-3 sm:p-4 md:p-5 rounded-2xl text-muted hover:text-primary hover:bg-primary/10 transition-all relative">
                          <Share2 size={18} />
                          {copiedTipId === tip.id && <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-elevated text-[10px] font-black px-3 py-1.5 rounded-lg text-nowrap shadow-2xl border border-card-border">Copied!</span>}
                       </button>
                     </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCreatingTip && (
        <CreateTipModal 
          onClose={() => setIsCreatingTip(false)}
          onSubmit={handleCreateTip}
          isSubmitting={isSubmitting}
        />
      )}

      {editingTip && (
        <CreateTipModal 
          onClose={() => setEditingTip(null)}
          onSubmit={async (title, content) => {
            try {
              const tipRef = doc(db, 'tips', editingTip.id);
              await updateDoc(tipRef, {
                title,
                content,
                updatedAt: new Date().toISOString()
              });
              
              window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Tip updated globally!`, type: 'success' }}));
              setEditingTip(null);
            } catch (e) {
              console.error("Failed to edit tip", e);
              window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Failed to update tip`, type: 'error' }}));
            }
          }}
          isSubmitting={isSubmitting}
          initialTitle={editingTip.title}
          initialContent={editingTip.content}
          titleText="Edit Tip"
        />
      )}
      
      {activeTipForComments && (
        <CommentsModal 
          tip={activeTipForComments}
          onClose={() => { setSelectedTipForComments(null); }}
          onPostComment={handlePostComment}
        />
      )}

      {showIneligibleMessage && (
        <IneligibleModal 
          onClose={() => setShowIneligibleMessage(false)}
          weightUnit={user?.weightUnit}
        />
      )}
    </div>
  );
}
