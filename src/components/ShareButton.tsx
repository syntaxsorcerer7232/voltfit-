import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton({ title, text, url }: { title: string, text: string, url?: string }) {
   const [shared, setShared] = useState(false);

   const handleShare = async () => {
       const shareUrl = url || window.location.href;
       if (navigator.share) {
           try {
               await navigator.share({
                   title: title,
                   text: text,
                   url: shareUrl,
               });
           } catch (error) {
               console.error("Error sharing", error);
               fallbackShare(shareUrl);
           }
       } else {
           fallbackShare(shareUrl);
       }
   };

   const fallbackShare = async (shareUrl: string) => {
       try {
           await navigator.clipboard.writeText(`${title} - ${text} ${shareUrl}`);
           setShared(true);
           setTimeout(() => setShared(false), 2000);
       } catch (err) {
           // Final fallback
           const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + (url ? ' ' + url : ''))}`;
           window.open(twitterUrl, '_blank');
       }
   };

   return (
       <button onClick={handleShare} className="p-2 bg-[#2a2a2a] text-neutral-300 rounded-full hover:bg-neutral-700 hover:text-white transition-colors relative" title="Share via text">
           {shared ? <Check size={16} className="text-primary" /> : <Share2 size={16} />}
           {shared && (
               <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-neutral-800 text-xs py-1 px-2 rounded-lg font-bold text-nowrap">
                   Copied!
               </div>
           )}
       </button>
   );
}
