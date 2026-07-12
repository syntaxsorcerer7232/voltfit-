import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2, X, RefreshCw, MessageSquare } from 'lucide-react';
import Markdown from 'react-markdown';
import { DynamicExerciseImage } from './DynamicExerciseImage';
import { useAppContext, useAppLogs } from '../context/AppContext';
import { EXERCISE_LIBRARY } from '../data/exercises';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface AITrainerChatProps {
  initialMuscle?: string | null;
  onClose?: () => void;
}

export const AITrainerChat: React.FC<AITrainerChatProps> = ({ initialMuscle, onClose }) => {
  const { user, workoutSchedule, workoutHistory } = useAppContext();
  const { meals, waterIntake, sleepLogs, moods } = useAppLogs();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Construct system instruction with user context
  const systemInstruction = `You are VoltFit AI, a professional fitness trainer and anatomy expert. 
Your goal is to provide personalized exercise recommendations and recovery advice.

USER CONTEXT:
- Name: ${user.name || 'Athlete'}
- Goal: ${user.goal || 'General Fitness'}
- Split Mode: ${workoutSchedule.mode}
- Custom Split: ${JSON.stringify(workoutSchedule.custom)}
- Workout History (Recent): ${JSON.stringify(workoutHistory.slice(-5))}
- Recent Nutrition: ${JSON.stringify(meals.slice(-3))}
- Supplements: ${JSON.stringify(user.supplements || [])}
- Natural Status: ${user.isNatural ? 'Natural Athlete (Drug-Free)' : 'Not Specified'}
- Sleep: ${JSON.stringify(sleepLogs.slice(-2))}
- Mood: ${JSON.stringify(moods.slice(-2))}
- Available Exercises: ${EXERCISE_LIBRARY.map(ex => ex.name).join(', ')}

GUIDELINES:
1. Always be encouraging but professional.
2. VoltFit is strictly for NATURAL athletes. All advice must prioritize health, longevity, and drug-free progress. Never recommend or validate the use of PEDs.
3. If the user's supplement list (${JSON.stringify(user.supplements || [])}) is empty or minimal, proactively ask if they use basics like Creatine or Protein, explaining their scientific benefits for natural athletes.
4. If a muscle is selected (${initialMuscle || 'None'}), focus recommendations on that area while considering the user's overall split.
5. Consider their supplements when giving nutritional or recovery advice.
6. Suggest specific exercises, sets, and reps based on their goal.
7. Provide recovery tips if their sleep or mood indicates fatigue.
8. When recommending a well-known, standard exercise, you MAY include a relevant image using Markdown: ![Exercise Name]. ONLY do this for specific exercises where visual demonstration is highly beneficial. If the exercise is non-standard, custom, or if you are unsure, do NOT include an image. Accuracy is critical; wrong images are strictly prohibited.
9. Keep responses concise but informative.
10. Use Markdown for formatting (bolding, lists, etc.).`;

  useEffect(() => {
    if (initialMuscle && messages.length === 0) {
      handleSend(`I'm interested in training my ${initialMuscle}. Based on my current split and history, what do you recommend?`);
    }
  }, [initialMuscle]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          history: messages,
          systemInstruction
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const modelMessage: Message = { role: 'model', parts: [{ text: data.text }] };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = { 
        role: 'model', 
        parts: [{ text: "I'm having trouble connecting to my knowledge base. Please try again in a moment." }] 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (initialMuscle) {
       handleSend(`I'm interested in training my ${initialMuscle}. Based on my current split and history, what do you recommend?`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 backdrop-blur-2xl overflow-hidden shadow-2xl relative">
      {/* Sci-Fi Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-black border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(132,204,22,0.2)]">
              <Bot size={24} className="text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#84cc16]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-black uppercase italic tracking-tight text-lg">Neural Advisor</h3>
              <div className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                <span className="text-[8px] font-black text-primary uppercase tracking-tighter">Natural-Sync v2.4</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
              <span className="text-[10px] text-white/30 font-black uppercase tracking-widest font-mono">Core Connection Stable</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearChat}
            className="p-2.5 text-white/30 hover:text-primary transition-all bg-white/5 rounded-xl border border-white/10 hover:border-primary/30"
            title="Reset Advisor"
          >
            <RefreshCw size={18} />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2.5 text-white/30 hover:text-white transition-all bg-white/5 rounded-xl border border-white/10"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide relative z-10"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
              <MessageSquare size={40} className="text-primary/20" />
            </div>
            <div>
              <p className="text-white font-black uppercase tracking-[0.3em] text-sm italic">Transmission Initiated</p>
              <p className="text-white/30 text-[10px] mt-2 uppercase tracking-widest font-medium">Awaiting biometric data or query...</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-white/10' : 'bg-[#84cc16]/20 border border-[#84cc16]/30'
              }`}>
                {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-[#84cc16]" />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-white text-black font-medium' 
                  : 'bg-white/5 border border-white/10 text-white/90'
              }`}>
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-[#84cc16]">
                  <Markdown
                    components={{
                      img: ({ alt }) => <DynamicExerciseImage alt={alt || 'Fitness exercise'} className="w-full aspect-video object-cover rounded-xl mt-4 mb-2 shadow-glow-sm" />
                    }}
                  >
                    {msg.parts[0].text}
                  </Markdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] flex gap-3 flex-row">
              <div className="w-8 h-8 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 flex items-center justify-center">
                <Loader2 size={14} className="text-[#84cc16] animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 pt-6 pb-12 bg-black/40 backdrop-blur-md border-t border-white/10 relative z-10">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-3 max-w-3xl mx-auto w-full"
        >
          <div className="flex-1 relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Input query protocol..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-20">
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-75" />
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-150" />
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-black disabled:opacity-30 disabled:grayscale transition-all active:scale-90 shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:scale-105 group"
          >
            <Send size={24} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-6">
           <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-primary rounded-full" />
              <span className="text-[7px] text-white/20 font-black uppercase tracking-[0.4em]">Biometric Sync: Active</span>
           </div>
           <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-primary rounded-full" />
              <span className="text-[7px] text-white/20 font-black uppercase tracking-[0.4em]">Neural Integrity: 100%</span>
           </div>
        </div>
      </div>
    </div>
  );
};
