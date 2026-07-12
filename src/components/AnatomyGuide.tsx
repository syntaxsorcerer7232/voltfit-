// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { EXERCISE_LIBRARY, Exercise } from '../data/exercises';
import { AITrainerChat } from './AITrainerChat';

interface AnatomyGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const MUSCLE_MAPPING: Record<string, string[]> = {
  Chest: ['Chest'],
  Back: ['Back'],
  Core: ['Core', 'Abs'],
  Shoulders: ['Shoulders', 'Delts'],
  Arms: ['Arms', 'Biceps', 'Triceps', 'Forearms'],
  Legs: ['Legs', 'Quads', 'Hamstrings', 'Calves', 'Glutes']
};

const NODE_NAME_MAPPING: Record<string, string> = {
  'Pectoralis': 'Chest',
  'Deltoid': 'Shoulders',
  'Bicep': 'Biceps',
  'Tricep': 'Triceps',
  'Abdominis': 'Core',
  'Oblique': 'Obliques',
  'Quadriceps': 'Quads',
  'Gastrocnemius': 'Calves',
  'Latissimus': 'Back',
  'Trapezius': 'Traps',
  'Gluteus': 'Glutes',
  'Brachialis': 'Arms',
  'Forearm': 'Forearms',
  'Hamstring': 'Hamstrings',
  'Vastus': 'Quads'
};

export default function AnatomyGuide({ isOpen, onClose }: AnatomyGuideProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [expandedExercise, setExpandedExercise] = useState<Exercise | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [api, setApi] = useState<any>(null);
  const nodeMapRef = useRef<any>(null);
  const lastPickTimeRef = useRef(0);
  const isProcessingPickRef = useRef(false);

  // Initialize Sketchfab API
  useEffect(() => {
    if (!isOpen || !iframeRef.current || !window.Sketchfab) return;

    const client = new window.Sketchfab('1.12.1', iframeRef.current);

    let container: HTMLElement | null = null;
    let handleMouseMove: (e: MouseEvent) => void;
    let handleMouseLeave: () => void;
    let handleClick: (e: MouseEvent) => void;

    client.init('9bfa112a99844626ac2480fff6276f0e', {
      success: (api: any) => {
        if (typeof api.start === 'function') api.start();
        api.addEventListener('viewerready', () => {
          setApi(api);
          
          // Pre-fetch node map to avoid calling it in mousemove
          if (typeof api.getNodeMap === 'function') {
            api.getNodeMap((err: any, nodes: any) => {
              if (!err) nodeMapRef.current = nodes;
            });
          }

          // Set Camera Constraints to fix centering and limit zoom
          if (typeof api.setCameraConstraints === 'function') {
            api.setCameraConstraints({
              usePan: false,
              useZoom: true,
              zoomIn: 30, // Minimum distance
              zoomOut: 160 // Maximum distance
            });
          }

          // Increase interaction sensitivity
          if (typeof api.setUserInteractionOptions === 'function') {
            api.setUserInteractionOptions({
              orbitSpeed: 1.5,
              zoomSpeed: 1.5
            });
          }
          
          // Focus precisely on the torso area (Pivot placed deep inside the chest cavity)
          // Eye: [0, -85, 120], Target: [0, 0, 120]
          if (typeof api.setCameraLookAt === 'function') {
            api.setCameraLookAt([0, -85, 120], [0, 0, 120], 0);
          }

          // Setup Hover Detection with safety checks
          container = iframeRef.current?.parentElement || null;
          if (container) {
            handleMouseMove = (e: MouseEvent) => {
              if (!api) return;
              
              const rect = (container as HTMLElement).getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              
              setMousePos({ x: e.clientX, y: e.clientY });

              // Throttle picking to 100ms and avoid concurrent picks
              const now = Date.now();
              if (now - lastPickTimeRef.current < 100 || isProcessingPickRef.current) return;

              const pickMethod = api.pick || api.pickFromScreen;
              if (typeof pickMethod === 'function') {
                isProcessingPickRef.current = true;
                lastPickTimeRef.current = now;
                
                pickMethod.call(api, x, y, (err: any, info: any) => {
                  isProcessingPickRef.current = false;
                  if (!err && info && info.instanceID) {
                    const nodes = nodeMapRef.current;
                    if (nodes && nodes[info.instanceID]) {
                      const node = nodes[info.instanceID];
                      const rawName = node.name || '';
                      
                      const muscleName = Object.keys(NODE_NAME_MAPPING).find(key => 
                        rawName.toLowerCase().includes(key.toLowerCase())
                      );

                      if (muscleName) {
                        setHoveredMuscle(NODE_NAME_MAPPING[muscleName]);
                      } else if (rawName.length > 3 && !rawName.includes('Skeleton')) {
                        const cleanName = rawName.split('_').pop()?.replace(/[0-9]/g, '');
                        setHoveredMuscle(cleanName || null);
                      } else {
                        setHoveredMuscle(null);
                      }
                    }
                  } else {
                    setHoveredMuscle(null);
                  }
                });
              }
            };

            handleMouseLeave = () => setHoveredMuscle(null);

            handleClick = (e: MouseEvent) => {
              if (!api) return;
              
              const rect = (container as HTMLElement).getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;

              const pickMethod = api.pick || api.pickFromScreen;
              if (typeof pickMethod === 'function') {
                pickMethod.call(api, x, y, (err: any, info: any) => {
                  if (!err && info && info.instanceID) {
                    const nodes = nodeMapRef.current;
                    if (nodes && nodes[info.instanceID]) {
                      const node = nodes[info.instanceID];
                      const rawName = node.name || '';
                      
                      const muscleKey = Object.keys(NODE_NAME_MAPPING).find(key => 
                        rawName.toLowerCase().includes(key.toLowerCase())
                      );

                      if (muscleKey) {
                        const muscleName = NODE_NAME_MAPPING[muscleKey];
                        setSelectedMuscle(prev => prev === muscleName ? null : muscleName);
                      } else {
                        setSelectedMuscle(null);
                      }
                    }
                  } else {
                    setSelectedMuscle(null);
                  }
                });
              }
            };

            container.addEventListener('mousemove', handleMouseMove);
            container.addEventListener('mouseleave', handleMouseLeave);
            container.addEventListener('click', handleClick);
          }
        });
      },
      error: () => {
        console.error('Sketchfab API error');
      },
      autostart: 1,
      ui_controls: 0,
      ui_infos: 0,
      ui_stop: 0,
      ui_watermark: 0,
      ui_hint: 0,
      transparent: 1,
      scrollwheel: 1,
      double_click: 0
    });

    return () => {
      if (api && typeof api.stop === 'function') api.stop();
      if (container) {
        if (handleMouseMove) container.removeEventListener('mousemove', handleMouseMove);
        if (handleMouseLeave) container.removeEventListener('mouseleave', handleMouseLeave);
        if (handleClick) container.removeEventListener('click', handleClick);
      }
    };
  }, [isOpen]);

  // Update model highlights when selectedMuscle changes
  useEffect(() => {
    if (!api) return;

    if (!selectedMuscle) {
      // Clear all highlights
      if (typeof api.highlight === 'function') {
        api.highlight(null);
      }
      return;
    }

    if (typeof api.getNodeMap === 'function') {
      api.getNodeMap((err: any, nodes: any) => {
        if (err) return;

      // Find nodes that belong to the selected muscle group
      const targetNodes = Object.values(nodes).filter((node: any) => {
        const rawName = node.name || '';
        const muscleKey = Object.keys(NODE_NAME_MAPPING).find(key => 
          rawName.toLowerCase().includes(key.toLowerCase())
        );
        return muscleKey && NODE_NAME_MAPPING[muscleKey] === selectedMuscle;
      });

      if (targetNodes.length > 0) {
        // Highlight the first node of the group and focus
        // Sketchfab highlight will dim others and focus on this
        if (typeof api.highlight === 'function') {
          api.highlight(targetNodes[0].instanceID, {
            outline: true,
            outlineColor: [1, 1, 1], // White outline
            duration: 0.5
          });
        }
      } else {
        if (typeof api.highlight === 'function') {
          api.highlight(null);
        }
      }
    });
    }
  }, [api, selectedMuscle]);

  // Handle manual zoom
  const handleZoom = (direction: 'in' | 'out') => {
    if (!api || typeof api.getCameraLookAt !== 'function') return;

    api.getCameraLookAt((err: any, camera: any) => {
      if (err) return;

      const { position, target } = camera;
      // Calculate distance between eye and target
      const dx = position[0] - target[0];
      const dy = position[1] - target[1];
      const dz = position[2] - target[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Zoom factor
      const factor = direction === 'in' ? 0.8 : 1.25;
      const newDistance = distance * factor;

      // Constraints check (mirrors api.setCameraConstraints)
      if (direction === 'in' && newDistance < 30) return;
      if (direction === 'out' && newDistance > 160) return;

      // Calculate new position while maintaining the same direction vector
      const ratio = newDistance / distance;
      const newPosition = [
        target[0] + dx * ratio,
        target[1] + dy * ratio,
        target[2] + dz * ratio
      ];

      api.setCameraLookAt(newPosition, target, 0.4); // 0.4s smooth transition
    });
  };

  const suggestedExercises = useMemo(() => {
    if (!selectedMuscle) return [];
    const targetGroups = MUSCLE_MAPPING[selectedMuscle] || [selectedMuscle];
    return EXERCISE_LIBRARY.filter(ex => 
      targetGroups.some(g => ex.focus.includes(g as any))
    ).slice(0, 6);
  }, [selectedMuscle]);

  const getVideoForMuscle = (muscle: string) => {
    switch (muscle) {
      case 'Chest': return 'https://assets.mixkit.co/videos/preview/mixkit-man-training-with-a-kettlebell-in-the-gym-14562-large.mp4';
      case 'Legs': return 'https://assets.mixkit.co/videos/preview/mixkit-athlete-doing-stretching-exercises-in-the-gym-14561-large.mp4';
      case 'Arms': return 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-with-dumbbells-in-a-gym-4475-large.mp4';
      default: return 'https://assets.mixkit.co/videos/preview/mixkit-man-training-with-a-kettlebell-in-the-gym-14562-large.mp4';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-xl"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-6xl h-full md:h-[90vh] bg-neutral-950 md:border md:border-white/10 md:rounded-[40px] overflow-hidden flex flex-col relative"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-30 pointer-events-none">
            <div className="pointer-events-auto">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Anatomy Explorer</h2>
              <p className="text-[#84cc16] text-xs font-black tracking-[0.2em] mt-2 uppercase">Precision Training Guide</p>
            </div>
            <button 
              onClick={onClose}
              className="pointer-events-auto w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center border border-white/10 transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>

          {/* 3D Model Container */}
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden" data-no-swipe="true">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800/20 via-transparent to-transparent pointer-events-none" />
            
            <iframe 
              ref={iframeRef}
              src="" 
              id="api-frame"
              className="w-full h-full border-0 max-w-4xl mx-auto z-10"
              title="Ecorche - Anatomy Human Male Musculature"
              allow="autoplay; fullscreen; xr-spatial-tracking"
            />

            {/* Muscle Selector Overlay */}
            <div className="absolute bottom-10 left-0 right-0 z-20 px-6 flex flex-wrap justify-center gap-2 pointer-events-none">
              {Object.keys(MUSCLE_MAPPING).map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => setSelectedMuscle(selectedMuscle === muscle ? null : muscle)}
                  className={`pointer-events-auto px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    selectedMuscle === muscle 
                      ? 'bg-white text-black scale-110 shadow-[0_0_40px_rgba(255,255,255,0.4)] ring-4 ring-white/20' 
                      : 'bg-black/60 text-white/60 border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>

            {/* Tooltip */}
            <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-40">
               <div className="flex items-center gap-4 text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">
                  <ZoomIn size={12} />
                  <span>Rotate to Explore</span>
                  <ZoomOut size={12} />
               </div>
            </div>

            {/* Muscle Hover Tooltip */}
            <AnimatePresence>
              {hoveredMuscle && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{ 
                    position: 'fixed',
                    left: mousePos.x + 20,
                    top: mousePos.y - 20,
                  }}
                  className="z-[100] pointer-events-none bg-black/80 backdrop-blur-md border border-[#84cc16]/30 px-3 py-1.5 rounded-lg"
                >
                  <p className="text-[#84cc16] text-[10px] font-black uppercase tracking-widest leading-none whitespace-nowrap">
                    {hoveredMuscle}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Manual Zoom Controls */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
              <button
                onClick={() => handleZoom('in')}
                className="w-12 h-12 bg-black/60 hover:bg-white/10 text-white border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl transition-all active:scale-90"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={() => handleZoom('out')}
                className="w-12 h-12 bg-black/60 hover:bg-white/10 text-white border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl transition-all active:scale-90"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>
            </div>
          </div>

          {/* AI Chat Bot Section */}
          <AnimatePresence>
            {selectedMuscle && (
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="absolute inset-0 z-40 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
              >
                <AITrainerChat 
                  initialMuscle={selectedMuscle} 
                  onClose={() => setSelectedMuscle(null)} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Exercise Detail Overlay (Keep for any other manual triggers if needed) */}
          <AnimatePresence>
            {expandedExercise && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black flex flex-col">
                <button onClick={() => setExpandedExercise(null)} className="absolute top-8 right-8 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-all">
                  <X size={24} className="text-white" />
                </button>
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  <div className="flex-[1.2] relative bg-neutral-900">
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover" src={expandedExercise.videoUrl || getVideoForMuscle(selectedMuscle || 'Chest')} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  </div>
                  <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-neutral-950 border-l border-white/10">
                    <div className="max-w-xl">
                      <h3 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-8">{expandedExercise.name}</h3>
                      {expandedExercise.instructions && (
                        <section className="mb-12">
                          <h4 className="text-white/40 text-[10px] font-black tracking-[0.3em] uppercase mb-6">Movement Execution</h4>
                          <div className="space-y-6">
                            {expandedExercise.instructions.map((step, idx) => (
                              <div key={idx} className="flex gap-6">
                                <span className="text-[#84cc16] font-black italic text-xl">{(idx + 1).toString().padStart(2, '0')}</span>
                                <p className="text-white/80 text-lg leading-relaxed">{step}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      {expandedExercise.tips && (
                        <section>
                          <h4 className="text-white/40 text-[10px] font-black tracking-[0.3em] uppercase mb-6">Form & Technique</h4>
                          <div className="grid grid-cols-1 gap-4">
                            {expandedExercise.tips.map((tip, idx) => (
                              <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#84cc16] mt-2.5 shrink-0" />
                                <p className="text-white/70 text-base leading-relaxed italic">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
