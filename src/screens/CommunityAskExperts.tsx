import React, { useState, useEffect } from 'react';
import { Search, Flame, MessageSquare, ChevronRight, ShieldCheck, ThumbsUp, X, Send, Award } from 'lucide-react';
import { CommunityQuestion, CommunityAnswer, AppNotification } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, where, increment } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';
import { getRank, getDynamicStrengthScore } from '../utils/community';

export default function CommunityAskExperts() {
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAsking, setIsAsking] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Form Check');
  const [selectedQuestion, setSelectedQuestion] = useState<CommunityQuestion | null>(null);
  const [answers, setAnswers] = useState<CommunityAnswer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [newAnswer, setNewAnswer] = useState('');
  const { user, workoutHistory, showToast } = useAppContext();
  
  const currentUserId = user?.userId || user?.id || auth.currentUser?.uid || '';

  const strengthScore = getDynamicStrengthScore(user?.lifts, workoutHistory);
  const rank = getRank(strengthScore);
  const isWarriorPlus = ['Warrior', 'Titan', 'Beast', 'Legend'].includes(rank.name);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (selectedQuestion) {
      fetchAnswers(selectedQuestion.id);
    }
  }, [selectedQuestion]);

  const fetchQuestions = async () => {
    try {
      const q = query(collection(db, 'community_questions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as CommunityQuestion));
      setQuestions(data);
    } catch (e) {
      console.error("Failed to fetch questions", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async (questionId: string) => {
    setLoadingAnswers(true);
    try {
      const q = query(
        collection(db, 'community_answers'), 
        where('questionId', '==', questionId)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as CommunityAnswer));
      data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setAnswers(data);
    } catch (e) {
      console.error("Failed to fetch answers", e);
    } finally {
      setLoadingAnswers(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = React.useRef(false);

  const handleAsk = async () => {
    if (!newTitle.trim() || !newContent.trim() || isSubmittingRef.current) return;
    setIsSubmitting(true);
    isSubmittingRef.current = true;
    try {
      const qData = {
        authorId: currentUserId || 'anonymous',
        authorName: user?.name || 'Anonymous',
        authorImage: user?.profilePicture || '',
        title: newTitle,
        content: newContent,
        category: newCategory,
        answers: 0,
        likes: { upvotes: [], bookmarks: [] },
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'community_questions'), qData);
      
      const newQuestion = { ...qData, id: docRef.id } as CommunityQuestion;
      setQuestions(prev => [newQuestion, ...prev]);
      setIsAsking(false);
      setNewTitle('');
      setNewContent('');
      showToast("Question posted! Waiting for Warriors to respond.", "success");
    } catch (e) {
      console.error("error adding question", e);
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleAnswer = async () => {
    if (!newAnswer.trim() || !selectedQuestion || !isWarriorPlus) return;
    setIsSubmitting(true);
    try {
      const answerData: Omit<CommunityAnswer, 'id'> = {
        questionId: selectedQuestion.id,
        authorId: currentUserId,
        authorName: user?.name || 'Warrior',
        authorImage: user?.profilePicture || '',
        authorRank: rank.name,
        authorBadges: user?.badges || [],
        content: newAnswer,
        createdAt: new Date().toISOString(),
        helpfulVotes: []
      };

      const docRef = await addDoc(collection(db, 'community_answers'), answerData);
      
      // Update question answer count
      const qRef = doc(db, 'community_questions', selectedQuestion.id);
      await updateDoc(qRef, { answers: increment(1) });

      // Create notification for asker
      if (selectedQuestion.authorId !== currentUserId) {
        const notifData: Omit<AppNotification, 'id'> = {
          userId: selectedQuestion.authorId,
          title: "New Expert Answer!",
          message: `${user?.name || 'A Warrior'} replied to your question: "${selectedQuestion.title}"`,
          type: 'reply',
          referenceId: selectedQuestion.id,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'notifications'), notifData);
      }

      setAnswers(prev => [...prev, { ...answerData, id: docRef.id }]);
      setNewAnswer('');
      showToast("Answer posted successfully!", "success");
      
      // Update local question list
      setQuestions(prev => prev.map(q => q.id === selectedQuestion.id ? { ...q, answers: q.answers + 1 } : q));
    } catch (e) {
      console.error("Error posting answer", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    if (!currentUserId) return;
    
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        const hasLiked = q.likes?.upvotes?.includes(currentUserId);
        const newUpvotes = hasLiked 
          ? (q.likes?.upvotes || []).filter(id => id !== currentUserId)
          : [...(q.likes?.upvotes || []), currentUserId];
        return { ...q, likes: { ...q.likes, upvotes: newUpvotes } };
      }
      return q;
    }));

    try {
      const qRef = doc(db, 'community_questions', questionId);
      const question = questions.find(q => q.id === questionId);
      if (question) {
        const hasLiked = question.likes?.upvotes?.includes(currentUserId);
        await updateDoc(qRef, {
          'likes.upvotes': hasLiked ? arrayRemove(currentUserId) : arrayUnion(currentUserId)
        });
      }
    } catch (error) {
      console.error("Error upvoting", error);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
    return matchesCategory && (q.title.toLowerCase().includes(searchQuery.toLowerCase()) || q.content.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="w-full relative">
      <div className="p-4 md:p-8 space-y-8 pb-32 max-w-5xl mx-auto">
        <div className="bg-surface-elevated/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-card-border shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
           <h2 className="text-3xl font-black text-foreground mb-2 uppercase tracking-tighter italic">Expert Consultation</h2>
           <p className="text-xs text-muted mb-8 leading-relaxed max-w-sm italic opacity-70 uppercase tracking-widest font-black">Beginners ask. Warriors guide. The forge of legends.</p>
           <button 
             className="w-full bg-primary text-black font-black text-xs uppercase tracking-[0.3em] py-5 rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-primary/20 active:scale-95" 
             onClick={() => setIsAsking(true)}
           >
             Initialize Inquiry
           </button>
        </div>

        <div className="relative">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted" size={18} strokeWidth={3} />
           <input 
             type="text" 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             placeholder="Search inquiries or categories..." 
             className="w-full bg-surface-elevated/30 backdrop-blur-md border border-card-border rounded-2xl py-5 pl-14 pr-6 text-sm text-foreground focus:outline-none focus:border-primary focus:bg-surface-elevated/50 transition-all shadow-xl placeholder:text-muted/30" 
           />
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
           {['All', 'Form Check', 'Muscle Gain', 'Fat Loss', 'Nutrition', 'Recovery'].map(cat => (
             <button 
               key={cat} 
               onClick={() => setSelectedCategory(cat)}
               className={`whitespace-nowrap px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                 selectedCategory === cat 
                  ? 'bg-foreground text-background border-foreground shadow-lg' 
                  : 'bg-surface-elevated/50 text-muted border-card-border hover:border-muted hover:text-foreground'
               }`}
             >
                {cat}
             </button>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {loading ? (
               <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                 <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                 <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Querying experts...</p>
               </div>
           ) : filteredQuestions.length === 0 ? (
               <div className="col-span-full py-10">
                 <EmptyState title="No Questions Found" description="Try a different search term or category." />
               </div>
           ) : (
               filteredQuestions.map(q => (
                   <div 
                    key={q.id} 
                    onClick={() => setSelectedQuestion(q)}
                    className="bg-surface-elevated/50 backdrop-blur-2xl rounded-[2.5rem] border border-card-border p-8 flex flex-col hover:border-primary/40 transition-all cursor-pointer group shadow-xl"
                   >
                       <div className="flex justify-between items-start mb-8 gap-2">
                          <div className="flex items-center gap-4">
                             {q.authorImage ? (
                               <img src={q.authorImage} className="w-12 h-12 rounded-full border border-card-border" referrerPolicy="no-referrer" />
                             ) : (
                               <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center font-black text-xs border border-card-border">{q.authorName?.charAt(0)}</div>
                             )}
                             <div>
                                <span className="text-sm font-black text-foreground block uppercase leading-none">{q.authorName}</span>
                                <span className="text-[9px] text-muted uppercase font-black tracking-widest mt-1 opacity-60">Inquirer</span>
                             </div>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl shadow-sm">{q.category}</span>
                       </div>
                       <h4 className="text-xl font-black text-foreground mb-4 leading-tight group-hover:text-primary transition-colors uppercase italic tracking-tighter">{q.title}</h4>
                       <p className="text-xs text-muted line-clamp-3 leading-relaxed mb-8 opacity-80">{q.content}</p>
                       <div className="flex items-center justify-between border-t border-card-border pt-6 mt-auto">
                           <div className="flex items-center gap-6">
                             <div className="flex items-center gap-2 text-[11px] font-black text-muted"><ThumbsUp size={14} className="opacity-50" /> {q.likes?.upvotes?.length || 0}</div>
                             <div className="flex items-center gap-2 text-[11px] font-black text-muted"><MessageSquare size={14} className="opacity-50" /> {q.answers || 0}</div>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest group-hover:gap-4 transition-all">
                              {isWarriorPlus ? "Transmit Guidance" : "View Answers"} <ChevronRight size={16} strokeWidth={3} />
                           </div>
                       </div>
                   </div>
               ))
           )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col md:inset-4 md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-card-border animate-in fade-in zoom-in-95 duration-300">
           <header className="p-6 border-b border-card-border flex items-center justify-between bg-surface-elevated/80 backdrop-blur-3xl shadow-xl">
              <button onClick={() => setSelectedQuestion(null)} className="p-2.5 bg-background border border-card-border rounded-xl text-muted hover:text-foreground transition-all active:scale-90 shadow-md"><X size={20} strokeWidth={3} /></button>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Transmitting Signal...</span>
              <div className="w-10 h-10" />
           </header>
           
           <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 space-y-12 bg-background/50">
              <div className="space-y-8">
                 <div className="flex items-center gap-5">
                    {selectedQuestion.authorImage ? (
                      <img src={selectedQuestion.authorImage} className="w-16 h-16 rounded-full border-2 border-primary/20 shadow-xl" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-surface-elevated border border-card-border flex items-center justify-center font-black text-2xl">{selectedQuestion.authorName?.charAt(0)}</div>
                    )}
                    <div>
                       <h3 className="text-2xl md:text-3xl font-black text-foreground uppercase italic tracking-tighter leading-tight">{selectedQuestion.title}</h3>
                       <p className="text-[9px] text-muted uppercase tracking-[0.2em] font-black opacity-60 mt-2">Source: {selectedQuestion.authorName} • Sector: {selectedQuestion.category}</p>
                    </div>
                 </div>
                 <div className="bg-surface-elevated/40 border border-card-border rounded-[2rem] p-8 text-sm md:text-base text-foreground/80 leading-relaxed italic shadow-inner">
                    {selectedQuestion.content}
                 </div>
              </div>

              <div className="space-y-8">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                    <ShieldCheck size={18} strokeWidth={3} /> Decoded Warrior Insight
                 </h4>
                 
                 {loadingAnswers ? (
                    <div className="py-16 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-lg" /></div>
                 ) : answers.length === 0 ? (
                    <div className="text-center py-16 bg-surface-elevated/20 rounded-[2rem] border border-dashed border-card-border">
                       <p className="text-xs text-muted uppercase font-black tracking-widest opacity-40">No expert transmissions received yet.</p>
                       {!isWarriorPlus && <p className="text-[9px] text-primary/60 mt-3 uppercase tracking-widest font-black">Authentication Required: Only Warriors+ may provide guidance.</p>}
                    </div>
                 ) : (
                    <div className="space-y-6">
                       {answers.map(ans => (
                          <div key={ans.id} className="bg-surface-elevated/50 backdrop-blur-xl border border-card-border rounded-[2rem] p-6 md:p-8 space-y-6 relative overflow-hidden group shadow-lg">
                             <div className="absolute top-0 right-0 p-5"><Award size={24} className="text-primary/10 group-hover:text-primary transition-all duration-500 group-hover:rotate-12" /></div>
                             <div className="flex items-center gap-4">
                                {ans.authorImage ? (
                                  <img src={ans.authorImage} className="w-10 h-10 rounded-full border border-card-border" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-background border border-card-border flex items-center justify-center font-black text-xs">{ans.authorName?.charAt(0)}</div>
                                )}
                                <div>
                                   <div className="flex items-center gap-3">
                                      <span className="text-xs font-black text-foreground uppercase tracking-tight">{ans.authorName}</span>
                                      <span className="text-[8px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-lg font-black tracking-widest uppercase shadow-sm">{ans.authorRank}</span>
                                   </div>
                                   <span className="text-[8px] text-muted uppercase font-black opacity-40 mt-1 block">{new Date(ans.createdAt).toLocaleDateString()}</span>
                                </div>
                             </div>
                             <p className="text-sm text-foreground/80 leading-relaxed font-medium">{ans.content}</p>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>

           {isWarriorPlus && (
              <div className="p-6 bg-surface-elevated/80 backdrop-blur-3xl border-t border-card-border">
                 <div className="flex items-end gap-4 max-w-4xl mx-auto">
                    <div className="flex-1 bg-background/50 rounded-2xl border border-card-border p-1 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-inner">
                       <textarea 
                          value={newAnswer}
                          onChange={e => setNewAnswer(e.target.value)}
                          placeholder="Craft your expert guidance..."
                          className="w-full bg-transparent p-4 text-sm text-foreground placeholder:text-muted/30 focus:outline-none resize-none min-h-[52px] max-h-32"
                       />
                    </div>
                    <button 
                       onClick={handleAnswer}
                       disabled={!newAnswer.trim() || isSubmitting}
                       className="bg-primary text-black p-4 rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-50 transition-all hover:scale-110 active:scale-90"
                    >
                       <Send size={24} strokeWidth={3} />
                    </button>
                 </div>
              </div>
           )}
        </div>
      )}

      {/* Ask Modal remains same or slightly styled */}
      {isAsking && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
          <div className="bg-surface-elevated/90 backdrop-blur-3xl border border-card-border rounded-[2.5rem] w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsAsking(false)} className="absolute top-6 right-6 p-2.5 bg-background border border-card-border rounded-full text-muted hover:text-foreground transition-all active:scale-90 shadow-lg"><X size={20} strokeWidth={3} /></button>
            <h3 className="text-2xl font-black text-foreground mb-1 uppercase italic tracking-tighter">Initialize Inquiry</h3>
            <p className="text-[10px] text-muted mb-8 uppercase tracking-[0.2em] font-black opacity-60">Warriors await your signal.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 ml-1">Sector</label>
                <div className="grid grid-cols-2 gap-2">
                   {['Form Check', 'Muscle Gain', 'Fat Loss', 'Nutrition', 'Recovery'].map(cat => (
                      <button key={cat} onClick={() => setNewCategory(cat)} className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all ${newCategory === cat ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20' : 'bg-background/50 border-card-border text-muted hover:border-muted'}`}>{cat}</button>
                   ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 ml-1">Core Subject</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Squat Depth Concerns" className="w-full bg-background/50 border border-card-border rounded-xl py-4 px-5 text-sm text-foreground focus:outline-none focus:border-primary shadow-inner" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 ml-1">Context</label>
                <textarea 
                  value={newContent} 
                  onChange={e => setNewContent(e.target.value)} 
                  placeholder="Provide details for a precise response..." 
                  className="w-full bg-background/50 border border-card-border rounded-xl py-4 px-5 text-sm text-foreground focus:outline-none focus:border-primary min-h-[140px] resize-none shadow-inner" 
                />
              </div>
              <button 
                onClick={handleAsk}
                disabled={!newTitle.trim() || !newContent.trim() || isSubmitting}
                className="w-full bg-primary text-black font-black uppercase tracking-[0.3em] py-5 rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all text-xs mt-2"
              >
                {isSubmitting ? 'Transmitting...' : 'Post Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
