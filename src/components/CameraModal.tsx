import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, Upload, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Data: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop video stream cleanly
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start video stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    stopStream();
    setIsInitializing(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการเปิดกล้องโดยตรง โปรดใช้ปุ่มเลือกไฟล์ภาพแทน');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'ไม่สามารถเข้าถึงกล้องได้';
      setCameraError(errorMsg);
    } finally {
      setIsInitializing(false);
    }
  }, [stopStream]);

  useEffect(() => {
    if (isOpen && !previewImage) {
      startCamera(facingMode);
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, previewImage, startCamera, stopStream]);

  if (!isOpen) return null;

  // Compress and resize image using an offscreen canvas
  const compressImage = (source: HTMLVideoElement | HTMLImageElement, width: number, height: number): string => {
    const canvas = document.createElement('canvas');
    const MAX_DIM = 1200;
    let targetW = width;
    let targetH = height;

    if (targetW > MAX_DIM || targetH > MAX_DIM) {
      if (targetW > targetH) {
        targetH = Math.round((targetH * MAX_DIM) / targetW);
        targetW = MAX_DIM;
      } else {
        targetW = Math.round((targetW * MAX_DIM) / targetH);
        targetH = MAX_DIM;
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(source, 0, 0, targetW, targetH);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return '';
  };

  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const dataUrl = compressImage(video, video.videoWidth || 640, video.videoHeight || 480);
      if (dataUrl) {
        setPreviewImage(dataUrl);
        stopStream();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const compressed = compressImage(img, img.width, img.height);
        setPreviewImage(compressed);
        stopStream();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (previewImage) {
      onCapture(previewImage);
      handleClose();
    }
  };

  const handleRetake = () => {
    setPreviewImage(null);
    startCamera(facingMode);
  };

  const handleClose = () => {
    stopStream();
    setPreviewImage(null);
    onClose();
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-lg w-full text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">ถ่ายรูปหน้างาน / แนบรูปภาพปัญหา</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
          {previewImage ? (
            <img
              src={previewImage}
              alt="ภาพถ่ายหน้างาน"
              className="w-full h-full object-contain"
            />
          ) : cameraError ? (
            <div className="p-6 text-center text-slate-400 max-w-sm">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-sm mb-4">{cameraError}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold rounded-lg inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                เลือกรูปภาพจากเครื่อง
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-slate-300 text-sm gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                  กำลังเชื่อมต่อกล้อง...
                </div>
              )}
            </>
          )}

          {/* Quick upload input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          {previewImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                ถ่ายใหม่
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                ใช้รูปนี้
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                อัปโหลดไฟล์
              </button>

              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={Boolean(cameraError) || isInitializing}
                className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                title="กดถ่ายภาพ"
              >
                <div className="w-11 h-11 rounded-full border-2 border-slate-950 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
              </button>

              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="สลับกล้องหน้า/หลัง"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
