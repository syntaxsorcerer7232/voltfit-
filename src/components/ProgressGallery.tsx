import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Plus, Trash2, Loader2, Image as ImageIcon, Save, ChevronLeft } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../context/AppContext';

interface PhotoLog {
  id: string;
  url: string;
  date: string;
  timestamp: any;
  weight?: number;
  description?: string;
}

enum OperationType {
  LIST = 'list',
  CREATE = 'create',
  DELETE = 'delete',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export default function ProgressGallery({ onClose }: { onClose: () => void }) {
  const { user } = useAppContext();
  const [photos, setPhotos] = useState<PhotoLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [newPhotoDataUrl, setNewPhotoDataUrl] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newWeight, setNewWeight] = useState(user?.weight?.toString() || '');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const progressRef = collection(db, 'users', auth.currentUser.uid, 'progress_photos');
    const q = query(progressRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PhotoLog[];
      setPhotos(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'progress_photos');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const chartData = useMemo(() => {
    return [...photos]
      .filter(p => typeof p.weight === 'number' && p.weight > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [photos]);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Compress image using canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimension 800px to keep base64 string small
        const MAX_DIMENSION = 800;
        if (width > height && width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Url = canvas.toDataURL('image/jpeg', 0.6); // 60% quality

          setNewPhotoDataUrl(base64Url);
          setNewDate(new Date().toISOString().split('T')[0]);
          setNewWeight(user?.weight?.toString() || '');
          setNewDescription('');
        }
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const savePhoto = async () => {
    if (!auth.currentUser || !newPhotoDataUrl) return;
    setUploading(true);
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'progress_photos'), {
        url: newPhotoDataUrl,
        date: newDate,
        weight: parseFloat(newWeight) || null,
        description: newDescription,
        timestamp: new Date().toISOString()
      });
      setNewPhotoDataUrl(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'progress_photos');
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) return;
    if (window.confirm("Delete this progress photo?")) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'progress_photos', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'progress_photos');
      }
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      className="flex flex-col z-50 bg-[#0a0a0a] pt-safe"
    >
      <header className="px-8 py-10 flex items-center justify-between border-b border-card-border bg-background/60 backdrop-blur-3xl sticky top-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
         <div className="flex items-center gap-6">
           <button 
             onClick={onClose} 
             className="p-3 bg-surface-elevated border border-card-border rounded-2xl text-muted hover:text-foreground hover:scale-110 hover:rotate-[-5deg] active:scale-95 transition-all shadow-xl shadow-black/20 group"
           >
             <ChevronLeft size={24} strokeWidth={3} className="text-muted group-hover:text-foreground transition-colors" />
           </button>
           <div className="flex flex-col">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Progress</h2>
              <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em] mt-2 opacity-40">Visual Biometrics</p>
           </div>
         </div>
         <div className="flex items-center gap-3">
           <button 
             onClick={() => fileInputRef.current?.click()} 
             disabled={uploading}
             className="p-3 bg-primary text-black rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl shadow-primary/20"
           >
             <Plus size={20} strokeWidth={3} />
           </button>
         </div>
      </header>

      <div className="flex-1 p-4 space-y-6 pb-24">
        {chartData.length > 0 && (
          <div className="bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] opacity-20 pointer-events-none" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-8 opacity-40">Weight Trajectory</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#52525B" 
                    fontSize={10} 
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getUTCMonth()+1}/${d.getUTCDate()}`;
                    }}
                    tickMargin={10}
                  />
                  <YAxis 
                    stroke="#52525B" 
                    fontSize={10} 
                    domain={['dataMin - 2', 'dataMax + 2']} 
                    tickFormatter={(val) => `${val}${user?.weightUnit || 'kg'}`} 
                    width={40}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#A1A1AA', fontWeight: 'bold', fontSize: '12px' }}
                    itemStyle={{ color: '#CCFF00', fontWeight: 'black', fontSize: '14px' }}
                    formatter={(value: number) => [`${value} ${user?.weightUnit || 'kg'}`, 'Weight']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#CCFF00" 
                    strokeWidth={3} 
                    dot={{ fill: '#CCFF00', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6, fill: '#fff', stroke: '#CCFF00', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : photos.length === 0 ? (
           <div className="bg-neutral-900/40 backdrop-blur-2xl rounded-[3rem] p-12 text-center border border-white/5 mt-4 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-1000 blur-[100px]" />
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl relative z-10">
                 <ImageIcon size={32} className="text-primary animate-pulse" />
              </div>
              <p className="text-sm font-black italic uppercase tracking-tighter mb-2 relative z-10">Memory Bank Clear</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-10 max-w-[220px] mx-auto leading-loose opacity-40 relative z-10">Capture physical evolution<br/>to establish baseline data.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary text-black font-black uppercase tracking-[0.2em] text-[10px] px-10 py-5 rounded-[2rem] hover:scale-110 active:scale-95 transition-all inline-flex items-center shadow-2xl shadow-primary/20 relative z-10 border border-primary/30"
              >
                 <Camera size={18} className="mr-3" strokeWidth={3} />
                 Initiate Baseline
              </button>
           </div>
        ) : (
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">Gallery</h3>
            <div className="grid grid-cols-2 gap-5 pt-2">
               {photos.map(photo => (
                 <motion.div 
                   key={photo.id} 
                   whileHover={{ y: -8, scale: 1.02 }}
                   className="relative aspect-[3/4] bg-neutral-900 rounded-[2.5rem] overflow-hidden group border border-white/10 shadow-2xl flex flex-col"
                 >
                   <img src={photo.url} alt="Progress" className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-110" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 flex flex-col justify-end p-5 pointer-events-none transition-opacity group-hover:opacity-100">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-white drop-shadow-md mb-0.5">{photo.date}</p>
                          {photo.weight && <p className="text-[10px] font-bold text-primary">{photo.weight} {user?.weightUnit || 'kg'}</p>}
                        </div>
                      </div>
                      {photo.description && (
                        <p className="text-[10px] text-zinc-300 mt-2 line-clamp-2 leading-tight">{photo.description}</p>
                      )}
                   </div>
                   <button 
                     onClick={() => handleDelete(photo.id)}
                     className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white/70 hover:text-rose-500 hover:border-rose-500/50 transition-colors z-10"
                   >
                      <Trash2 size={16} />
                   </button>
                 </motion.div>
               ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-center z-40">
         <button 
           onClick={() => fileInputRef.current?.click()}
           disabled={uploading}
           className="bg-primary text-black shadow-[0_0_20px_rgba(204,255,0,0.3)] font-black uppercase tracking-widest text-xs px-8 py-4 rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center min-w-[200px]"
         >
           {uploading && !newPhotoDataUrl ? (
             <><Loader2 size={18} className="animate-spin mr-2" /> Processing...</>
           ) : (
             <><Camera size={18} className="mr-2" /> Take Photo</>
           )}
         </button>
         <input 
           type="file" 
           accept="image/*" 
           className="hidden" 
           ref={fileInputRef}
           onChange={handleCapture}
         />
      </div>

      {/* Save Photo Modal */}
      <AnimatePresence>
        {newPhotoDataUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex flex-col pt-safe overflow-y-auto"
          >
            <div className="px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-black/50 backdrop-blur-md">
              <button onClick={() => setNewPhotoDataUrl(null)} className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Save Progress</h2>
              <div className="w-10"></div>
            </div>

            <div className="p-6 space-y-6 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
              <div className="relative aspect-[3/4] w-full max-w-[240px] mx-auto rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
                <img src={newPhotoDataUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>

              <div className="space-y-4 w-full bg-neutral-900 p-5 rounded-[2rem] border border-white/5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Date</label>
                  <input 
                    type="date" 
                    value={newDate} 
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Body Weight ({user?.weightUnit || 'kg'})</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 75.5"
                    value={newWeight} 
                    onChange={e => setNewWeight(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Notes</label>
                  <textarea 
                    placeholder="How do you feel today?"
                    value={newDescription} 
                    onChange={e => setNewDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-primary resize-none placeholder-slate-700"
                  />
                </div>
              </div>

              <button 
                onClick={savePhoto}
                disabled={uploading}
                className="w-full bg-primary text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} className="mr-2" /> Save to Gallery</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
