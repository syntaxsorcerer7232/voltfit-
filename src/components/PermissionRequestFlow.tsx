import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { Filesystem } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, Camera as CameraIcon, Bell, FolderOpen, CheckCircle2 } from 'lucide-react';

export default function PermissionRequestFlow() {
  const [show, setShow] = useState(false);
  const [statuses, setStatuses] = useState({
    camera: false,
    notifications: false,
    storage: false
  });

  useEffect(() => {
    // Only show on native platforms (Android/iOS)
    if (!Capacitor.isNativePlatform()) return;

    const hasRequested = localStorage.getItem('initial_permissions_requested');
    if (!hasRequested) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const requestCamera = async () => {
    try {
      const result = await Camera.requestPermissions();
      if (result.camera === 'granted') {
        setStatuses(prev => ({ ...prev, camera: true }));
      }
    } catch (e) { console.error(e); }
  };

  const requestNotifications = async () => {
    try {
      const local = await LocalNotifications.requestPermissions();
      let push = { receive: 'denied' };
      try {
        push = await PushNotifications.requestPermissions();
      } catch (e) {}
      
      if (local.display === 'granted' || push.receive === 'granted') {
        setStatuses(prev => ({ ...prev, notifications: true }));
      }
    } catch (e) { console.error(e); }
  };

  const requestStorage = async () => {
    try {
      const result = await Filesystem.requestPermissions();
      if (result.publicStorage === 'granted') {
        setStatuses(prev => ({ ...prev, storage: true }));
      }
    } catch (e) { console.error(e); }
  };

  const handleFinish = () => {
    localStorage.setItem('initial_permissions_requested', 'true');
    setShow(false);
  };

  const allDone = statuses.camera && statuses.notifications && statuses.storage;

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#121212] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden"
      >
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
           <ShieldCheck size={32} className="text-primary" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Permission Setup</h2>
        <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
          Tap each category below to enable individual permissions. This ensures your workout logs and scanner work perfectly.
        </p>

        <div className="space-y-4 mb-8">
           {/* Camera */}
           <button 
             onClick={requestCamera}
             disabled={statuses.camera}
             className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
               statuses.camera ? 'bg-primary/5 border-primary/20' : 'bg-neutral-900/50 border-white/5 hover:bg-neutral-800'
             }`}
           >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statuses.camera ? 'bg-primary text-black' : 'bg-neutral-800 text-primary'}`}>
                 {statuses.camera ? <CheckCircle2 size={18} /> : <CameraIcon size={18} />}
              </div>
              <div className="flex-1 text-left">
                 <div className="text-sm font-bold">Camera Access</div>
                 <div className="text-[10px] text-neutral-500">{statuses.camera ? 'Access Granted' : 'Required for scanning & photos'}</div>
              </div>
           </button>

           {/* Notifications */}
           <button 
             onClick={requestNotifications}
             disabled={statuses.notifications}
             className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
               statuses.notifications ? 'bg-secondary/5 border-secondary/20' : 'bg-neutral-900/50 border-white/5 hover:bg-neutral-800'
             }`}
           >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statuses.notifications ? 'bg-secondary text-white' : 'bg-neutral-800 text-secondary'}`}>
                 {statuses.notifications ? <CheckCircle2 size={18} /> : <Bell size={18} />}
              </div>
              <div className="flex-1 text-left">
                 <div className="text-sm font-bold">Notifications</div>
                 <div className="text-[10px] text-neutral-500">{statuses.notifications ? 'Notifications Active' : 'Required for reminders'}</div>
              </div>
           </button>

           {/* Storage */}
           <button 
             onClick={requestStorage}
             disabled={statuses.storage}
             className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
               statuses.storage ? 'bg-orange-500/5 border-orange-500/20' : 'bg-neutral-900/50 border-white/5 hover:bg-neutral-800'
             }`}
           >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statuses.storage ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-orange-500'}`}>
                 {statuses.storage ? <CheckCircle2 size={18} /> : <FolderOpen size={18} />}
              </div>
              <div className="flex-1 text-left">
                 <div className="text-sm font-bold">Storage</div>
                 <div className="text-[10px] text-neutral-500">{statuses.storage ? 'Storage Connected' : 'Required for file logs'}</div>
              </div>
           </button>
        </div>

        <div className="flex flex-col gap-3">
           <button 
             onClick={handleFinish}
             className={`w-full py-4 font-black rounded-2xl shadow-lg transition-all ${
               allDone 
               ? 'bg-primary text-black shadow-primary/20 scale-105' 
               : 'bg-neutral-800 text-neutral-400'
             }`}
           >
             {allDone ? 'COMPLETE SETUP' : 'FINISH LATER'}
           </button>
        </div>
      </motion.div>
    </div>
  );
}
