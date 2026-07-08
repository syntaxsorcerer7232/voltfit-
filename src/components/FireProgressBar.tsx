import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface FireProgressBarProps {
  progress: number; // 0 to 1
  onSeek?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  height?: number;
  color?: string; // e.g. '#00FF88'
  showStatus?: boolean;
}

const FireProgressBar: React.FC<FireProgressBarProps> = ({ 
  progress, 
  onSeek, 
  height = 10, 
  color = '#00FF88', 
  showStatus = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<any[]>([]);
  const animationRef = useRef<number>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (canvas.parentElement) {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 40; 
      }
    };

    class Particle {
      x = 0;
      y = 0;
      size = 0;
      speedY = 0;
      speedX = 0;
      life = 0;
      decay = 0;
      r = 34;
      g = 197;
      b = 94;

      constructor(width: number, height: number) {
        this.reset(width, height);
      }

      reset(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = height * 0.7; 
        this.size = Math.random() * 2 + 1;
        this.speedY = Math.random() * 0.5 + 0.2;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        
        if (color === '#00FF88') {
            this.r = 0; this.g = 255; this.b = 136;
        } else {
            this.r = 34; this.g = 197; this.b = 94;
        }
      }

      update(width: number, height: number) {
        this.y -= this.speedY;
        this.x += this.speedX;
        this.life -= this.decay;

        // Keep within bounds
        if (this.x < 0) this.x = 0;
        if (this.x > width) this.x = width;

        if (this.life <= 0) {
          this.reset(width, height);
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        const alpha = this.life * 0.4;
        ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha})`;
        ctx.fill();

        if (this.life > 0.6) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 255, 220, ${alpha * 0.7})`;
          ctx.fill();
        }
      }
    }

    const init = () => {
      resize();
      particlesRef.current = [];
      for (let i = 0; i < 35; i++) {
        particlesRef.current.push(new Particle(canvas.width, canvas.height));
      }
    };

    const animate = () => {
      if (canvas.parentElement) {
        const rect = canvas.parentElement.getBoundingClientRect();
        if (canvas.width !== rect.width) {
          canvas.width = rect.width;
          canvas.height = 40;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      
      particlesRef.current.forEach(p => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    init();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [color]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative h-2 w-full bg-neutral-900/80 rounded-full border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] overflow-visible">
        {/* The Filled Portion */}
        <motion.div 
          className="absolute h-full left-0 top-0 rounded-full"
          style={{ 
            width: `${progress * 100}%`,
            backgroundColor: color,
            boxShadow: `0 0 15px ${color}, 0 0 30px ${color}44`
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          {/* Fire Animation Container */}
          <div className="absolute top-[-24px] left-0 w-full h-[40px] pointer-events-none overflow-visible">
            <canvas ref={canvasRef} className="block w-full h-full" />
          </div>
        </motion.div>
        
        {onSeek && (
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.001"
            value={progress}
            onChange={onSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
        )}
      </div>
      
      {showStatus && (
        <div className="mt-2.5 flex justify-end">
          <motion.div 
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[9px] font-mono font-black tracking-[0.2em] uppercase"
            style={{ color, textShadow: `0 0 8px ${color}88` }}
          >
            {Math.round(progress * 100)}% STABLE
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FireProgressBar;
