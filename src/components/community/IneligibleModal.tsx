import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface IneligibleModalProps {
  onClose: () => void;
  weightUnit?: string;
}

export const IneligibleModal: React.FC<IneligibleModalProps> = ({ onClose, weightUnit }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-[#333] rounded-3xl w-full max-w-md p-6 relative text-center shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <ShieldCheck size={48} className="text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Advisor Status Required</h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          To publish a tip, you need to prove your experience by achieving a total equal to or greater than <span className="text-primary font-bold">200{weightUnit || 'kg'}</span> across your Squat, Bench, and Deadlift records. 
          Update your Profile lifts to unlock this feature.
        </p>
        <button 
          onClick={onClose}
          className="w-full bg-[#222] border border-[#333] text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all hover:bg-[#333] active:scale-95"
        >
          Keep Training
        </button>
      </div>
    </div>
  );
};
