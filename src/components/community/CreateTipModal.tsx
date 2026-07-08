import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface CreateTipModalProps {
  onClose: () => void;
  onSubmit: (title: string, content: string) => Promise<void>;
  isSubmitting: boolean;
  initialTitle?: string;
  initialContent?: string;
  titleText?: string;
}

export const CreateTipModal: React.FC<CreateTipModalProps> = ({ 
  onClose, 
  onSubmit, 
  isSubmitting,
  initialTitle = '',
  initialContent = '',
  titleText = 'Share Knowledge'
}) => {
  const [newTitle, setNewTitle] = useState(initialTitle);
  const [newContent, setNewContent] = useState(initialContent);
  const isSubmittingRef = useRef(false);

  const handlePublish = async () => {
    if (!newTitle.trim() || !newContent.trim() || isSubmitting || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      await onSubmit(newTitle, newContent);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-surface-elevated/90 backdrop-blur-3xl border border-card-border rounded-[2.5rem] w-full max-w-md p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 p-2.5 bg-background/50 border border-card-border rounded-full text-muted hover:text-foreground transition-all shadow-lg active:scale-90">
          <X size={20} strokeWidth={3} />
        </button>
        <h3 className="text-2xl font-black text-foreground mb-1 uppercase italic tracking-tighter">{titleText}</h3>
        <p className="text-[10px] text-muted mb-8 uppercase tracking-[0.2em] font-black opacity-60">Advisor Panel • Community Knowledge Sync</p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 ml-1">Tip Headline</label>
            <input 
              type="text" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Engage Lats Before Deadlifting"
              className="w-full bg-background/50 border border-card-border rounded-2xl py-4 px-5 text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 ml-1">Detailed Insight</label>
            <textarea 
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Explain why and how..."
              className="w-full bg-background/50 border border-card-border rounded-2xl py-4 px-5 text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 min-h-[160px] resize-none transition-all shadow-inner"
            />
          </div>

          <button 
            onClick={handlePublish}
            disabled={!newTitle.trim() || !newContent.trim() || isSubmitting}
            className="w-full bg-primary text-black font-black uppercase tracking-[0.3em] py-5 rounded-2xl mt-4 disabled:opacity-50 disabled:grayscale transition-all hover:scale-[1.02] active:scale-95 flex justify-center items-center shadow-lg shadow-primary/20 text-xs"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : initialTitle ? 'Update Tip' : 'Publish Tip'}
          </button>
        </div>
      </div>
    </div>
  );
};
