import React, { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';

interface DynamicExerciseImageProps {
  alt?: string;
  className?: string;
}

export const DynamicExerciseImage: React.FC<DynamicExerciseImageProps> = ({ alt, className }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted && isLoading) {
        setIsLoading(false);
        setError(true);
      }
    }, 8000); // 8 second hard timeout for "instant" feel

    const fetchImage = async () => {
      if (!alt) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: alt }),
        });

        const data = await response.json();
        if (isMounted) {
          if (data.url) {
            setImageUrl(data.url);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error('Failed to generate image:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };

    fetchImage();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [alt]);

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-xl ${className || 'aspect-video w-full'}`}>
        <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
        <span className="text-[8px] text-white/30 uppercase tracking-widest font-black">Synthesizing Visual...</span>
      </div>
    );
  }

  if (error || !imageUrl) {
    return null;
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={`${className || 'w-full aspect-video object-cover rounded-xl border border-white/10 shadow-glow-sm'}`} 
    />
  );
};
