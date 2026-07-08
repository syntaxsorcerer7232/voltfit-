import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CommunityTip } from '../../types';

interface CommentsModalProps {
  tip: CommunityTip;
  onClose: () => void;
  onPostComment: (comment: string) => Promise<void>;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ tip, onClose, onPostComment }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePost = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onPostComment(newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-surface-elevated/90 backdrop-blur-3xl border border-card-border rounded-[2.5rem] w-full max-w-md p-6 relative h-[80vh] flex flex-col shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-background/50 rounded-full text-muted hover:text-foreground transition-all z-10 border border-card-border shadow-md">
          <X size={20} strokeWidth={3} />
        </button>
        
        <h3 className="text-xl font-black text-foreground mb-6 uppercase tracking-tight border-b border-card-border pb-4 italic">Community Transmission</h3>
        
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2 mb-4 no-scrollbar">
          {(!tip.comments || tip.comments.length === 0) ? (
            <div className="text-center text-muted/50 text-xs mt-12 uppercase tracking-[0.2em] font-black italic">The signal is silent...<br/>Be the first to transmit thoughts.</div>
          ) : (
            tip.comments.map(c => (
              <div key={c.id} className="bg-background/40 rounded-2xl p-5 border border-card-border shadow-sm group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3 mb-3">
                   {c.authorImage ? (
                     <img src={c.authorImage} alt={c.authorName} className="w-8 h-8 rounded-full object-cover border border-card-border" referrerPolicy="no-referrer" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-[10px] font-black border border-card-border">{c.authorName?.charAt(0) || '?'}</div>
                   )}
                   <span className="text-xs font-black text-foreground uppercase tracking-tight">{c.authorName}</span>
                </div>
                <p className="text-sm text-muted leading-relaxed">{c.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-card-border/50">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePost()}
              placeholder="Transmit insight..."
              className="flex-1 bg-background/50 border border-card-border rounded-2xl py-4 px-5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-inner placeholder:text-muted/30"
            />
            <button 
              onClick={handlePost}
              disabled={!newComment.trim() || isSubmitting}
              className="bg-primary text-black px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.05] active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center min-w-[90px] shadow-lg shadow-primary/10"
            >
              {isSubmitting ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'SEND'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
