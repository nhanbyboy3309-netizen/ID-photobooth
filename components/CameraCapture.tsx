
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { PhotoSize, AppConfig } from '../types';
import { analyzeIDPhotoFrame } from '../services/geminiService';
import { getConfig } from '../services/configService';

// Sub-components
import CaptureStatus from './CaptureStatus';
import CaptureOverlay from './CaptureOverlay';
import CaptureControls from './CaptureControls';
import MobileCameraLink from './MobileCameraLink';
import { t } from '../services/i18n';

// Polyfill definitions for ImageCapture API
interface PhotoCapabilities { redEyeReduction: string; imageHeight: any; imageWidth: any; fillLightMode: string[]; }
interface PhotoSettings { fillLightMode?: string; imageHeight?: number; imageWidth?: number; redEyeReduction?: boolean; }
declare class ImageCapture {
  constructor(track: MediaStreamTrack);
  takePhoto(photoSettings?: PhotoSettings): Promise<Blob>;
  getPhotoCapabilities(): Promise<PhotoCapabilities>;
  grabFrame(): Promise<ImageBitmap>;
}

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  selectedSize: PhotoSize;
  onSizeChange: (size: PhotoSize) => void;
}

type ValidationStatus = 'searching' | 'analyzing' | 'adjusting' | 'valid';

const SHUTTER_SOUND = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhYAAAAABAAAANtaW5vcl92ZXJzaW9uADAAV1hYWAAAAA8AAANjb21wYXRpYmxlX2JyYW5kcwBpc29tAG1wNDIA//uQZAAAAAAAABAAAAAAAAAAAAAAJktYAGAAAABAAAAAAAAAAAAAAAD/+5BkAA/wAAAADwAAAAgAAAASAAAABgAAAAQAAAAMAAAAFAAAAA//uQZAAIAAAAAvAAAAEAAAAAIAAAABAAAAA8AAAAIAAAADAAAAA//uQZAIQA9gATAAAAAAgAAAAEYAAAAL4AAABAAAAACgAAAAEAAAAH/+5BkD4AD2AAAAQAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADQAAAAf/7kGQWgAPQAAAAwAAAAEAAAADAAAABgAAAAcAAAAIAAAAAwAAAAz/+5BkHgAD1AAAAQAAAAAIAAAACAAAAAwAAAAgAAAAEAAAADQAAAAf/7kGQjgAPQAAAAwAAAAIAAAACAAAAAgAAAAkAAAAFAAAAAwAAAAz/+5BkT4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGRWgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAA3/+5BkXoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGRhgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BkeYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGR/gAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BkkIAD2AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGSbhAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BkpoAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGSvgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5Bk0IAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGThgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5Bk74AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGT3gAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BlFoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGWZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BluYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGXhgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5Bl94AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGYhgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BmO4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGZfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BmloAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGbWgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BnGYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGdBgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BnYYAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGehgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5Bnu4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGffgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BoFoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGgZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BoOYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGhggAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5Bof4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7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AEAAAADgAAAAf/7kHAhgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5Bwf4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHCogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BwuYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHDfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAAz/+5BxF4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHEogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BxuYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHHfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5ByFoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHIZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5Byu4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHLfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BzF4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHMogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BzuYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHPfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B0FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHQZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B0u4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADwAAAAf/7kHTfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B1F4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHUogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B1uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHXfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B2FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHYZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B2u4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHbHgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B3FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHcZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B3uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHfHgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B4F4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHgogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B4uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHjfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B5FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHmZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B5u4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHnfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B6F4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHorgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B6uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHrfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B7F4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHsogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B7uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHvfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B8FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHwZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B8OYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHwhgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B8n4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHyogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B8uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHzfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B9FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kH0ZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B9OYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kH1fgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B9l4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kH2ogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B9uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kH3fgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B+FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kH4ZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B+u4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kH7fgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B/FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kH8ZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B/OYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kH9fgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B/l4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kH+ogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B/uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kH/fgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/";

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, selectedSize, onSizeChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const shutterAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('searching');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Đang xử lý');
  const [instruction, setInstruction] = useState<string>('');
  const [aiLimitReached, setAiLimitReached] = useState(false);
  
  // Default to TRUE as requested
  const [isAutoCaptureEnabled, setIsAutoCaptureEnabled] = useState(true);
  
  const hasAutoCapturedForCurrentValidRef = useRef(false);
  const isAnalyzingRef = useRef(false);
  const analysisIntervalRef = useRef<any>(null);
  const lastSpokenRef = useRef<string>('');
  
  // Use config for i18n
  const config = getConfig();

  const isMobileLink = selectedDeviceId === 'mobile-link';

  useEffect(() => {
    getDevices();
    if (!isMobileLink) {
        startCamera();
    }
    shutterAudioRef.current = new Audio(SHUTTER_SOUND);
    return () => { stopCamera(); if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current); window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => { 
      if (selectedDeviceId && !isMobileLink) startCamera(selectedDeviceId); 
      if (isMobileLink) stopCamera();
  }, [selectedDeviceId]);

  useEffect(() => {
    if (stream && !countdown && !isCapturing && !aiLimitReached && !isMobileLink) analysisIntervalRef.current = setInterval(performAIAnalysis, 5000);
    else if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    return () => { if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current); };
  }, [stream, countdown, selectedSize, isCapturing, aiLimitReached, isMobileLink]); 

  useEffect(() => {
    if (validationStatus === 'valid' && isAutoCaptureEnabled && !hasAutoCapturedForCurrentValidRef.current && countdown === null && !isCapturing && !isMobileLink) {
          hasAutoCapturedForCurrentValidRef.current = true;
          setCountdown(3);
    } else if (validationStatus !== 'valid') { hasAutoCapturedForCurrentValidRef.current = false; }
  }, [validationStatus, isAutoCaptureEnabled, countdown, isCapturing, isMobileLink]);

  const speak = (text: string, force: boolean = false) => {
      if (!text || (!force && lastSpokenRef.current === text)) return;
      if (force || window.speechSynthesis.speaking) window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = config.language === 'en' ? 'en-US' : 'vi-VN'; 
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith(utterance.lang));
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
      lastSpokenRef.current = text;
  };
  
  useEffect(() => {
     if (countdown !== null) return; 
     if (isMobileLink) return;
     if (aiLimitReached) { if (lastSpokenRef.current !== 'AI_STOP') { speak(t('capture.status.analyzing', config), true); lastSpokenRef.current = 'AI_STOP'; } return; }
     if (instruction) {
         if (validationStatus === 'valid') { if (lastSpokenRef.current !== 'ok') { speak(t('capture.msg.valid', config), true); lastSpokenRef.current = 'ok'; } } 
         else { speak(instruction); }
     }
  }, [instruction, validationStatus, countdown, aiLimitReached, isMobileLink]);

  const getCropDimensions = (sourceW: number, sourceH: number) => {
    let targetRatio = 2/3; 
    if (selectedSize === PhotoSize.SIZE_5X5) targetRatio = 1;
    if (selectedSize === PhotoSize.SIZE_3X4) targetRatio = 3/4;
    const sourceRatio = sourceW / sourceH;
    let cropW, cropH, startX, startY;
    if (sourceRatio > targetRatio) { cropH = sourceH; cropW = cropH * targetRatio; startX = (sourceW - cropW) / 2; startY = 0; }
    else { cropW = sourceW; cropH = cropW / targetRatio; startX = 0; startY = (sourceH - cropH) * 0.65; }
    return { x: Math.floor(startX), y: Math.floor(startY), w: Math.floor(cropW), h: Math.floor(cropH) };
  };

  const performAIAnalysis = async () => {
    if (isAnalyzingRef.current || !videoRef.current || !analysisCanvasRef.current || aiLimitReached) return;
    try {
      isAnalyzingRef.current = true;
      const video = videoRef.current;
      const canvas = analysisCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (video.readyState === 4 && ctx) {
        const crop = getCropDimensions(video.videoWidth, video.videoHeight);
        const analysisH = 320;
        const analysisW = Math.floor(analysisH * (crop.w / crop.h));
        canvas.width = analysisW; canvas.height = analysisH;
        ctx.save(); ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
        ctx.drawImage(video, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        if (validationStatus === 'searching') setValidationStatus('analyzing');
        const result = await analyzeIDPhotoFrame(canvas.toDataURL('image/jpeg', 0.6));
        if (result.feedback === 'AI_LIMIT') { setAiLimitReached(true); setValidationStatus('valid'); setFeedbackMessage('AI TẠM NGƯNG'); return; }
        if (!result.faceDetected) { setValidationStatus('searching'); setFeedbackMessage('Không tìm thấy mặt'); setInstruction('Di chuyển vào khung hình'); }
        else if (result.isCompliant) { setValidationStatus('valid'); setFeedbackMessage('ĐẠT CHUẨN'); setInstruction(result.instruction || 'Giữ nguyên tư thế!'); }
        else { setValidationStatus('adjusting'); setFeedbackMessage(result.feedback || 'Cần điều chỉnh'); setInstruction(result.instruction || 'Chỉnh lại tư thế'); }
      }
    } catch (err) {} finally { isAnalyzingRef.current = false; }
  };

  const getDevices = async () => {
    const all = await navigator.mediaDevices.enumerateDevices();
    const video = all.filter(d => d.kind === 'videoinput');
    setDevices(video);
    const canon = video.find(d => d.label.toLowerCase().includes('canon') || d.label.toLowerCase().includes('eos'));
    if (canon) setSelectedDeviceId(canon.deviceId);
  };

  const startCamera = async (deviceId?: string) => {
    stopCamera();
    try {
      const constraints = { video: { deviceId: deviceId ? { exact: deviceId } : undefined, width: { ideal: 3840 }, height: { ideal: 2160 } } };
      let s; try { s = await navigator.mediaDevices.getUserMedia(constraints); } catch { s = await navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceId ? { exact: deviceId } : undefined, width: { ideal: 1920 }, height: { ideal: 1080 } } }); }
      setStream(s); if (videoRef.current) videoRef.current.srcObject = s;
    } catch { setError('Lỗi camera'); }
  };

  const stopCamera = () => { if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); } };

  const captureFrame = useCallback(async () => {
    setIsCapturing(true); if (shutterAudioRef.current) { shutterAudioRef.current.currentTime = 0; shutterAudioRef.current.play().catch(() => {}); }
    if (!videoRef.current || !canvasRef.current) { setIsCapturing(false); return; }
    const video = videoRef.current; const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    let src: any = video, sw = video.videoWidth, sh = video.videoHeight;
    if (stream) {
        const track = stream.getVideoTracks()[0];
        if (track && 'ImageCapture' in window) {
            try {
                const ic = new (window as any).ImageCapture(track); const blob = await ic.takePhoto();
                const hiImg = new Image(); hiImg.src = URL.createObjectURL(blob);
                await new Promise(r => hiImg.onload = r); src = hiImg; sw = hiImg.width; sh = hiImg.height;
            } catch {}
        }
    }
    if (ctx && sw > 0) {
        const crop = getCropDimensions(sw, sh);
        canvas.width = crop.w; canvas.height = crop.h;
        ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(src, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
        onCapture(canvas.toDataURL('image/jpeg', 1.0));
    }
    setIsCapturing(false);
  }, [onCapture, selectedSize, stream]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) onCapture(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) speak(countdown.toString(), true);
    if (countdown > 0) { const t = setTimeout(() => setCountdown(countdown - 1), 1000); return () => clearTimeout(t); }
    else if (countdown === 0) { captureFrame(); setCountdown(null); }
  }, [countdown, captureFrame]);

  const topMarginPercent = useMemo(() => selectedSize === PhotoSize.SIZE_3X4 ? 7.5 : selectedSize === PhotoSize.SIZE_5X5 ? 6 : 7, [selectedSize]);
  const marginText = useMemo(() => selectedSize === PhotoSize.SIZE_4X6 ? "CÁCH MÉP 4MM" : "CÁCH MÉP 3MM", [selectedSize]);
  const getOverlayColor = () => validationStatus === 'valid' ? '#22c55e' : validationStatus === 'adjusting' ? '#facc15' : validationStatus === 'analyzing' ? '#60a5fa' : '#ef4444';

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-900 relative select-none overflow-hidden touch-none py-safe">
      
      {/* 1. Header Area: Status */}
      <div className="shrink-0 z-20 w-full relative">
        <CaptureStatus 
          validationStatus={validationStatus}
          feedbackMessage={feedbackMessage}
          instruction={instruction}
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onDeviceChange={setSelectedDeviceId}
          config={config}
        />
      </div>

      {/* 2. Main Content: Video Feed */}
      <div className="flex-1 flex items-center justify-center w-full relative min-h-0 py-2">
         {isMobileLink && (
             <MobileCameraLink 
                config={config}
                selectedSize={selectedSize}
                onPhotoReceived={onCapture}
                onCancel={() => {
                    const firstWebcam = devices.find(d => d.kind === 'videoinput');
                    setSelectedDeviceId(firstWebcam?.deviceId || '');
                }}
             />
         )}
         
         <div className={`relative transition-all duration-300 bg-black rounded-lg overflow-hidden flex items-center justify-center border-4 h-full aspect-[2/3] md:aspect-[3/4] lg:aspect-[2/3] max-w-full max-h-full ${validationStatus === 'valid' ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.6)]' : validationStatus === 'adjusting' ? 'border-yellow-400' : validationStatus === 'analyzing' ? 'border-brand-400' : 'border-red-500'}`}>
            {!isMobileLink && (
                <>
                    <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" />
                    <CaptureOverlay 
                        selectedSize={selectedSize}
                        validationStatus={validationStatus}
                        aiLimitReached={aiLimitReached}
                        topMarginPercent={topMarginPercent}
                        marginText={marginText}
                        getOverlayColor={getOverlayColor}
                        config={config}
                    />
                    {(countdown !== null || isCapturing) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-40 backdrop-blur-sm">
                        {isCapturing ? <><div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" /><span className="text-white font-bold tracking-widest">{t('capture.label.processing', config)}</span></> : <span className="text-[120px] md:text-[180px] font-bold text-white animate-ping">{countdown}</span>}
                    </div>
                    )}
                </>
            )}
         </div>
      </div>

      {/* 3. Footer Area: Controls */}
      {!isMobileLink && (
        <div className="shrink-0 z-20 w-full pb-2 pt-2">
            <CaptureControls 
                isAutoCaptureEnabled={isAutoCaptureEnabled}
                validationStatus={validationStatus}
                countdown={countdown}
                isCapturing={isCapturing}
                onAutoCaptureToggle={() => setIsAutoCaptureEnabled(!isAutoCaptureEnabled)}
                onCaptureClick={() => setCountdown(3)}
                onMobileLink={() => setSelectedDeviceId('mobile-link')}
                onFileUploadClick={() => fileInputRef.current?.click()}
                config={config}
            />
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={analysisCanvasRef} className="hidden" />
      <style>{`@keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }`}</style>
    </div>
  );
};

export default CameraCapture;
