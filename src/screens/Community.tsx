import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Users, Trophy, Target, Info, Plus } from 'lucide-react';
import CommunityTipsFeed from './CommunityTipsFeed';
import CommunityAskExperts from './CommunityAskExperts';
import CommunityLeaderboard from './CommunityLeaderboard';
import CommunityMentorship from './CommunityMentorship';
import { useAppContext } from '../context/AppContext';
import { getDynamicStrengthScore, getRank } from '../utils/community';

export default function Community() {
  const { user, workoutHistory } = useAppContext();
  const [activeTab, setActiveTab] = useState('tips');
  const [isCreatingTip, setIsCreatingTip] = useState(false);

  const strengthScore = getDynamicStrengthScore(user?.lifts, workoutHistory);
  const currentRank = getRank(strengthScore);

  const isEligibleAdvisor = (user?.points || 0) >= 500 || (user?.badges || []).length >= 3;

  const renderTab = () => {
    switch (activeTab) {
      case 'tips': return <CommunityTipsFeed isCreatingTip={isCreatingTip} setIsCreatingTip={setIsCreatingTip} />;
      case 'ask': return <CommunityAskExperts />;
      case 'leaderboard': return <CommunityLeaderboard />;
      case 'mentorship': return <CommunityMentorship />;
      default: return <CommunityTipsFeed isCreatingTip={isCreatingTip} setIsCreatingTip={setIsCreatingTip} />;
    }
  };

  return (
    <div className="flex flex-col flex-1 relative">
      {/* Community Header Options */}
      <div className="sticky top-0 left-0 right-0 z-50 flex flex-col px-6 pt-6 pb-6 bg-background/80 backdrop-blur-3xl border-b border-card-border shadow-xl">
        
        {/* User Rank Mini-Badge top left */}
        <div className="flex justify-between items-center mb-6">
           <div className="flex bg-surface-elevated/50 backdrop-blur-md rounded-full pl-1.5 pr-5 py-1.5 border border-card-border items-center gap-3 shadow-2xl">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center p-0.5">
                <div className="w-full h-full rounded-full bg-surface-elevated flex items-center justify-center">
                  <Flame size={18} className="text-amber-500 fill-amber-500/20" />
                </div>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] md:text-sm uppercase font-black tracking-widest text-amber-500 leading-none">{currentRank.name}</span>
                <span className="text-[8px] md:text-xs text-muted font-bold uppercase mt-1.5 leading-none tracking-tight">{strengthScore}{user?.weightUnit || 'kg'} Total Strength</span>
             </div>
           </div>
           
           <div className="flex gap-2.5">
             <button className="bg-surface-elevated/50 backdrop-blur-md p-3.5 rounded-2xl border border-card-border text-muted hover:text-foreground hover:bg-surface-elevated transition-all active:scale-95 shadow-xl">
               <Info size={20} />
             </button>
           </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 w-full justify-between items-center overflow-x-auto no-scrollbar scroll-smooth">
           {[
             { id: 'tips', label: 'Feed', icon: Flame },
             { id: 'ask', label: 'Experts', icon: Users },
             { id: 'leaderboard', label: 'Hall of Fame', icon: Trophy },
             { id: 'mentorship', label: 'Mentors', icon: Target }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl transition-all font-black text-[10px] md:text-xs whitespace-nowrap tracking-wider uppercase border ${
                 activeTab === tab.id 
                   ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' 
                   : 'bg-surface-elevated/50 text-muted hover:text-foreground border-card-border'
               }`}
             >
               <tab.icon size={14} strokeWidth={activeTab === tab.id ? 3 : 2} /> 
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
         <AnimatePresence mode="wait">
            <motion.div
               key={activeTab}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.15 }}
               className="min-h-full pb-32"
            >
               {renderTab()}
            </motion.div>
         </AnimatePresence>
      </div>

      {/* Floating Action Button (FAB) - Restored UI position */}
      {activeTab === 'tips' && (
        <motion.button 
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           whileHover={{ scale: 1.1 }}
           whileTap={{ scale: 0.9 }}
           onClick={() => setIsCreatingTip(true)}
           className="fixed bottom-24 right-6 z-[60] bg-primary w-14 h-14 rounded-full flex items-center justify-center text-black shadow-[0_10px_30px_rgba(132,204,22,0.4)] border-2 border-white/20"
           title="Create Tip"
        >
           <Plus size={28} strokeWidth={3} />
        </motion.button>
      )}

    </div>
  );
}
