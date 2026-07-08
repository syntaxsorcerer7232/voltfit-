import React, { useState, useEffect } from 'react';
import { ScanBarcode, X, Camera as CameraIcon, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarcodeScanner as MlKitScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface Props {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      checkPermission();
    } else {
      setPermissionState('denied'); // Prompt simulator UI on web
      setError('Barcode scanning requires the native Android app. Use the simulator below for testing.');
    }
  }, []);

  const checkPermission = async () => {
    try {
      const status = await Camera.checkPermissions();
      setPermissionState(status.camera as any);
      
      if (status.camera === 'granted') {
        startScanning();
      }
    } catch (e) {
      console.error("Permission check failed", e);
      setPermissionState('prompt');
    }
  };

  const requestPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      setError('Camera access via ML Kit is only available in the native Android/iOS app. Please use the simulator below.');
      return;
    }
    try {
      const status = await Camera.requestPermissions();
      setPermissionState(status.camera as any);
      
      if (status.camera === 'granted') {
        startScanning();
      } else {
        setError('Camera permission is required to scan food barcodes.');
      }
    } catch (e) {
      setError('Could not request camera permission.');
    }
  };

  const startScanning = async () => {
    if (!Capacitor.isNativePlatform()) {
      setError('Scanning is only supported in the native app.');
      return;
    }
    try {
      setError('');
      
      // Check if feature is supported
      const isSupported = await MlKitScanner.isSupported();
      if (!isSupported.supported) {
        setError('Barcode scanning is not supported on this device/browser.');
        return;
      }

      // Hide the webview content (required for barcode scanning on some platforms)
      document.body.classList.add('barcode-scanner-active');
      setIsScanning(true);

      // Start the scanner
      const { barcodes } = await MlKitScanner.scan({
        formats: [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.QrCode, BarcodeFormat.UpcA, BarcodeFormat.UpcE],
      });

      if (barcodes.length > 0) {
        onScan(barcodes[0].displayValue);
        handleStop();
      }
    } catch (e: any) {
      console.error(e);
      if (e.message !== 'cancelled') {
        setError('Scanning failed. Please try again.');
      }
      handleStop();
    }
  };

  const handleStop = async () => {
    document.body.classList.remove('barcode-scanner-active');
    setIsScanning(false);
    try {
      await MlKitScanner.stopScan();
    } catch (e) {}
  };

  const handleClose = () => {
    handleStop();
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${isScanning ? 'transparent-bg' : 'bg-[#0a0a0a]'}`}
    >
        {/* Transparent Scanning Area Placeholder (Webview should be transparent) */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute inset-x-0 top-0 bottom-[60%] bg-black/60"></div>
             <div className="absolute inset-x-0 bottom-0 top-[40%] bg-black/60"></div>
             <div className="absolute left-0 top-[40%] bottom-[60%] right-[85%] bg-black/60"></div>
             <div className="absolute right-0 top-[40%] bottom-[60%] left-[85%] bg-black/60"></div>
             <div className="absolute top-[40%] left-[15%] right-[15%] h-[20%] border-2 border-primary rounded-xl overflow-hidden">
                <motion.div 
                  className="h-1 bg-primary/50 w-full"
                  animate={{ y: [0, 80, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
             </div>
             <div className="absolute bottom-20 left-0 right-0 text-center text-white font-bold text-sm">
                Center barcode within the box
             </div>
          </div>
        )}

        <button onClick={handleClose} className="absolute top-10 left-4 p-3 bg-neutral-900 rounded-full z-20 text-white hover:bg-neutral-800 transition-colors">
          <X />
        </button>

        {!isScanning && (
          <div className="text-white text-center px-8">
            {permissionState === 'denied' || error ? (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={40} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-neutral-400 text-sm leading-relaxed mb-8">
                  {error || "We need your camera to recognize food barcodes and track your calories automatically."}
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={requestPermission}
                    className="w-full py-4 bg-primary text-black font-black rounded-xl shadow-lg shadow-primary/20"
                  >
                    ENABLE CAMERA
                  </button>
                  <button 
                    onClick={() => onScan('000000000000')} 
                    className="w-full py-3 text-neutral-500 text-xs font-bold font-mono tracking-tighter"
                  >
                    CONTINUE WITH SIMULATOR
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 cursor-pointer"
                  onClick={startScanning}
                >
                  <ScanBarcode size={48} className="text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Ready to scan</h2>
                <p className="text-neutral-500">Scanning food labels makes logging 10x faster.</p>
                
                <button 
                  onClick={startScanning}
                  className="mt-12 px-12 py-4 bg-neutral-900 border border-white/5 text-white font-bold rounded-2xl flex items-center gap-3 mx-auto"
                >
                  <CameraIcon size={20} className="text-primary" />
                  START SCANNER
                </button>
              </div>
            )}
          </div>
        )}
    </motion.div>
  );
}
