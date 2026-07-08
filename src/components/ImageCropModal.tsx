import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropSave: (croppedBase64: string) => void;
  theme: 'dark' | 'light';
}

export default function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropSave,
  theme,
}: ImageCropModalProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
    };
    img.src = imageSrc;
    imgRef.current = img;

    return () => {
      if (imgRef.current) {
        imgRef.current.onload = null;
      }
    };
  }, [imageSrc]);

  // Calculate scaling factors & dimensions
  const getDimensions = useCallback(() => {
    if (!image) return { fitScale: 1, displayedWidth: 0, displayedHeight: 0, maxOffsetX: 0, maxOffsetY: 0 };

    const canvasSize = 600; // Resolution of exported canvas
    const imgWidth = image.naturalWidth || image.width;
    const imgHeight = image.naturalHeight || image.height;

    // Calculate scale to completely fill the 600x600 square (aspect-fill)
    const fitScale = Math.max(canvasSize / imgWidth, canvasSize / imgHeight);

    const displayedWidth = imgWidth * fitScale * zoom;
    const displayedHeight = imgHeight * fitScale * zoom;

    // Maximum offsets in coordinate terms to keep canvas covered
    const maxOffsetX = Math.max(0, (displayedWidth - canvasSize) / 2);
    const maxOffsetY = Math.max(0, (displayedHeight - canvasSize) / 2);

    return { fitScale, displayedWidth, displayedHeight, maxOffsetX, maxOffsetY };
  }, [image, zoom]);

  // Constrain offsets helper
  const clampOffsets = useCallback((x: number, y: number) => {
    const { maxOffsetX, maxOffsetY } = getDimensions();
    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, y)),
    };
  }, [getDimensions]);

  // Raw draw method
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = canvas.width; // 600px
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    const { fitScale } = getDimensions();
    const { x: constrainedX, y: constrainedY } = clampOffsets(offsetX, offsetY);

    ctx.save();
    // Translate to center + offset, scale it, and draw centered
    ctx.translate(canvasSize / 2 + constrainedX, canvasSize / 2 + constrainedY);
    ctx.scale(fitScale * zoom, fitScale * zoom);
    
    const imgWidth = image.naturalWidth || image.width;
    const imgHeight = image.naturalHeight || image.height;
    ctx.drawImage(image, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
    ctx.restore();
  }, [image, zoom, offsetX, offsetY, getDimensions, clampOffsets]);

  // Redraw canvas whenever zoom, offsets or image changes
  useEffect(() => {
    if (isOpen && image) {
      drawCanvas();
    }
  }, [isOpen, image, drawCanvas]);

  // Mouse & Touch interaction handlers
  const handleDown = (clientX: number, clientY: number) => {
    if (!image) return;
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !image) return;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    // We mapping screen coordinates (approx 300px scale) to canvas coordinates (600px scale)
    // Canvas is displayed at 300px, so 1px on screen is 2px on canvas.
    const multiplier = 2; 

    const newX = offsetX + deltaX * multiplier;
    const newY = offsetY + deltaY * multiplier;

    const { x, y } = clampOffsets(newX, newY);
    setOffsetX(x);
    setOffsetY(y);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleUp = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (newZoom: number) => {
    const nextZoom = Math.min(3, Math.max(1, newZoom));
    setZoom(nextZoom);

    // Re-clamp offsets immediately based on the new zoom factor
    const { maxOffsetX, maxOffsetY } = getDimensionsByZoom(nextZoom);
    setOffsetX(prev => Math.min(maxOffsetX, Math.max(-maxOffsetX, prev)));
    setOffsetY(prev => Math.min(maxOffsetY, Math.max(-maxOffsetY, prev)));
  };

  // Immediate dimension calc to bound zoom transitions instantly
  const getDimensionsByZoom = (targetZoom: number) => {
    if (!image) return { maxOffsetX: 0, maxOffsetY: 0 };
    const canvasSize = 600;
    const imgWidth = image.naturalWidth || image.width;
    const imgHeight = image.naturalHeight || image.height;
    const fitScale = Math.max(canvasSize / imgWidth, canvasSize / imgHeight);
    const displayedWidth = imgWidth * fitScale * targetZoom;
    const displayedHeight = imgHeight * fitScale * targetZoom;
    const maxOffsetX = Math.max(0, (displayedWidth - canvasSize) / 2);
    const maxOffsetY = Math.max(0, (displayedHeight - canvasSize) / 2);
    return { maxOffsetX, maxOffsetY };
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Standard low-compression export (quality 0.9)
    const base64Img = canvas.toDataURL('image/jpeg', 0.9);
    onCropSave(base64Img);
    onClose();
  };

  const handleReset = () => {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          id="crop-modal-backdrop"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className={`relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border ${
            isDark ? 'bg-[#121212] border-white/10 text-white' : 'bg-white border-neutral-200 text-black'
          }`}
          id="crop-modal-body"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div>
              <h3 className="font-bold text-lg">Crop Profile Picture</h3>
              <p className="text-xs text-slate-400 mt-0.5">Drag to move, slider to zoom</p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-neutral-100 text-neutral-500'
              }`}
              id="crop-modal-close-btn"
            >
              <X size={18} />
            </button>
          </div>

          {/* Central stage area */}
          <div className="p-6 flex flex-col items-center justify-center">
            {/* Viewport Mask container */}
            <div
              className={`relative w-[280px] h-[280px] rounded-full overflow-hidden select-none cursor-move border-2 ${
                isDark ? 'border-primary/50' : 'border-[#84cc16]'
              } shadow-inner bg-neutral-900 group`}
              onMouseDown={(e) => handleDown(e.clientX, e.clientY)}
              onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
              onMouseUp={handleUp}
              onMouseLeave={handleUp}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleDown(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches[0]) {
                  handleMove(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={handleUp}
              id="crop-canvas-mask"
            >
              {/* Canvas reflecting the actual crop result */}
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                className="w-full h-full pointer-events-none"
              />

              {/* Centered Guide HUD overlay */}
              <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-full flex items-center justify-center">
                <div className="w-[180px] h-[180px] border border-dashed border-white/20 rounded-full" />
              </div>
            </div>

            {/* Controls */}
            <div className="w-full mt-6 space-y-4">
              {/* Zoom slider */}
              <div className="flex items-center gap-3">
                <ZoomOut size={16} className="text-slate-500 flex-shrink-0" />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => handleZoomChange(Number(e.target.value))}
                  className="w-full accent-[#84cc16] cursor-pointer h-1.5 rounded-full bg-neutral-700/50"
                  id="zoom-crop-slider"
                />
                <ZoomIn size={16} className="text-slate-500 flex-shrink-0" />
              </div>

              {/* Quick actions row */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors ${
                    isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                  id="crop-reset-btn"
                >
                  <RotateCcw size={14} /> Full Fit
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-neutral-500 hover:text-black'
                    }`}
                    id="crop-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[#84cc16] hover:bg-[#84cc16]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-colors"
                    id="crop-confirm-btn"
                  >
                    <Check size={14} /> Apply Crop
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
