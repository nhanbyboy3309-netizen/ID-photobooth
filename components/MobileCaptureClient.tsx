
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { PhotoSize, AppConfig } from '../types';
import { analyzeIDPhotoFrame } from '../services/geminiService';
import { savePhotoToCloud } from '../services/databaseService';
import { t } from '../services/i18n';

interface MobileCaptureClientProps {
  sessionId: string;
  config: AppConfig;
  initialSize?: PhotoSize;
}

type ValidationStatus = 'searching' | 'analyzing' | 'adjusting' | 'valid';

const SHUTTER_SOUND = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhYAAAAABAAAANtaW5vcl92ZXJzaW9uADAAV1hYWAAAAA8AAANjb21wYXRpYmxlX2JyYW5kcwBpc29tAG1wNDIA//uQZAAAAAAAABAAAAAAAAAAAAAAJktYAGAAAABAAAAAAAAAAAAAAAD/+5BkAA/wAAAADwAAAAgAAAASAAAABgAAAAQAAAAMAAAAFAAAAA//uQZAAIAAAAAvAAAAEAAAAAIAAAABAAAAA8AAAAIAAAADAAAAA//uQZAIQA9gATAAAAAAgAAAAEYAAAAL4AAABAAAAACgAAAAEAAAAH/+5BkD4AD2AAAAQAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADQAAAAf/7kGQWgAPQAAAAwAAAAEAAAADAAAABgAAAAcAAAAIAAAAAwAAAAz/+5BkHgAD1AAAAQAAAAAIAAAACAAAAAwAAAAgAAAAEAAAADQAAAAf/7kGQjgAPQAAAAwAAAAIAAAACAAAAAgAAAAkAAAAFAAAAAwAAAAz/+5BkT4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGRWgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAA3/+5BkXoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGRhgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BkeYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGR/gAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BkkIAD2AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGSbhAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BkpoAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGSvgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5Bk0IAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGThgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5Bk74AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGT3gAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BlFoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGWZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BluYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGXhgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5Bl94AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGYhgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BmO4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGZfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BmloAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGbWgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BnGYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGdBgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BnYYAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGehgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5Bnu4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGffgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BoFoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kGgZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BoOYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kGhggAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5Bof4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7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AEAAAADgAAAAf/7kHAhgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5Bwf4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHCogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BwuYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHDfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAAz/+5BxF4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHEogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BxuYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHHfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5ByFoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHIZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5Byu4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHLfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5BzF4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHMogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5BzuYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHPfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B0FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHQZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B0u4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHTfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B1F4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHUogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B1uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHXfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B2FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHYZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B2u4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHbHgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B3FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHcZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B3uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHfHgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B4F4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHgogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B4uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHjfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B5FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHmZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B5u4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHnfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B6F4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHorgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B6uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHrfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B7F4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHsogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B7uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHvfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B8FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHwZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B8OYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHwhgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B8n4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kHyogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B8uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kHzfgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B9FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kH0ZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B9OYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kH16AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kH1l4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kH2ogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B9uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kH3fgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B+FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kH4ZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B+u4AD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kH7fgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B/FoAD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kH8ZgAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B/OYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kH9fgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/+5B/l4AD1AAAAPAAAAAIAAAABAAAAAwAAAAgAAAAEAAAADwAAAAf/7kH+ogAPUAAAAwAAAAEAAAACAAAAAgAAAAoAAAAFAAAAAwAAAAz/+5B/uYAD2AAAAPAAAAAIAAAABAAAAAwAAAAYAAAAEAAAADgAAAAf/7kH/fgAPUAAAAwAAAAEAAAACAAAAAgAAAAkAAAAFAAAAAwAAAA3/";

const MobileCaptureClient: React.FC<MobileCaptureClientProps> = ({ sessionId, config, initialSize = PhotoSize.SIZE_4X6 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const shutterAudioRef = useRef<HTMLAudioElement | null>(null);
  const analysisIntervalRef = useRef<any>(null);
  const isAnalyzingRef = useRef(false);
  const hasAutoCapturedForCurrentValidRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSpokenRef = useRef<string>('');

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('searching');
  const [feedbackMessage, setFeedbackMessage] = useState<string>(t('capture.label.processing', config));
  const [instruction, setInstruction] = useState<string>('');
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isAutoCaptureEnabled, setIsAutoCaptureEnabled] = useState(true);

  // Voice Synthesis helper
  const speak = useCallback((text: string, force: boolean = false) => {
    if (!text || (!force && lastSpokenRef.current === text)) return;
    if (force || window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.language === 'en' ? 'en-US' : 'vi-VN';
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(utterance.lang));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    lastSpokenRef.current = text;
  }, [config.language]);

  const startCamera = async (mode: 'user' | 'environment') => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    const constraints: MediaStreamConstraints = { 
        video: { 
            facingMode: mode, 
            width: { ideal: 3840 }, 
            height: { ideal: 2160 } 
        } 
    };
    try {
      let s;
      try {
        s = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        s = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
      }
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) {
      setCameraError('Máy ảnh chưa được cấp quyền.');
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    shutterAudioRef.current = new Audio(SHUTTER_SOUND);
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
      window.speechSynthesis.cancel();
    };
  }, [facingMode]);

  // AI Analysis Loop
  useEffect(() => {
    if (stream && !countdown && !capturedImage) {
      analysisIntervalRef.current = setInterval(performAIAnalysis, 3000);
    } else {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    }
    return () => { if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current); };
  }, [stream, countdown, capturedImage, initialSize]);

  // Handle voice guidance when instruction changes
  useEffect(() => {
    if (countdown !== null || capturedImage) return;
    if (instruction) {
      if (validationStatus === 'valid') {
        if (lastSpokenRef.current !== 'ok') {
          speak(t('capture.msg.valid', config), true);
          lastSpokenRef.current = 'ok';
        }
      } else {
        speak(instruction);
      }
    }
  }, [instruction, validationStatus, countdown, capturedImage, speak, config]);

  // Auto-capture Trigger logic
  useEffect(() => {
    if (validationStatus === 'valid' && isAutoCaptureEnabled && !hasAutoCapturedForCurrentValidRef.current && countdown === null && !capturedImage) {
          hasAutoCapturedForCurrentValidRef.current = true;
          setCountdown(3);
    } else if (validationStatus !== 'valid') { 
        hasAutoCapturedForCurrentValidRef.current = false; 
    }
  }, [validationStatus, isAutoCaptureEnabled, countdown, capturedImage]);

  const getCropDimensions = (sourceW: number, sourceH: number) => {
    let targetRatio = 2/3; 
    if (initialSize === PhotoSize.SIZE_5X5) targetRatio = 1;
    if (initialSize === PhotoSize.SIZE_3X4) targetRatio = 3/4;
    const sourceRatio = sourceW / sourceH;
    let cropW, cropH, startX, startY;
    if (sourceRatio > targetRatio) { 
        cropH = sourceH; 
        cropW = cropH * targetRatio; 
        startX = (sourceW - cropW) / 2; 
        startY = 0; 
    } else { 
        cropW = sourceW; 
        cropH = cropW / targetRatio; 
        startX = 0; 
        startY = (sourceH - cropH) * 0.65;
    }
    return { x: Math.floor(startX), y: Math.floor(startY), w: Math.floor(cropW), h: Math.floor(cropH) };
  };

  const performAIAnalysis = async () => {
    if (isAnalyzingRef.current || !videoRef.current || !analysisCanvasRef.current) return;
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
        
        ctx.save();
        if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        ctx.drawImage(video, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        const result = await analyzeIDPhotoFrame(canvas.toDataURL('image/jpeg', 0.6));
        
        if (!result.faceDetected) {
            setValidationStatus('searching'); 
            setFeedbackMessage(t('capture.msg.no_face', config)); 
            setInstruction(t('capture.msg.move_in', config));
        } else if (result.isCompliant) {
            setValidationStatus('valid'); 
            setFeedbackMessage(t('capture.status.valid', config)); 
            setInstruction(result.instruction || t('capture.msg.valid', config));
        } else {
            setValidationStatus('adjusting'); 
            setFeedbackMessage(result.feedback || t('capture.status.adjusting', config)); 
            setInstruction(result.instruction || '');
        }
      }
    } catch (err) {} finally { isAnalyzingRef.current = false; }
  };

  const captureFrame = useCallback(() => {
    if (shutterAudioRef.current) {
        shutterAudioRef.current.currentTime = 0;
        shutterAudioRef.current.play().catch(() => {});
    }
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const crop = getCropDimensions(video.videoWidth, video.videoHeight);
    
    canvas.width = crop.w;
    canvas.height = crop.h;
    
    if (ctx) {
        if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        ctx.drawImage(video, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.95));
    }
  }, [facingMode, initialSize]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
        speak(countdown.toString(), true);
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
    } else {
        captureFrame();
        setCountdown(null);
    }
  }, [countdown, captureFrame, speak]);

  // Fixed missing handleFileUpload function to handle manual image selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setCapturedImage(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!capturedImage || !sessionId) return;
    setIsUploading(true);
    try {
        const resultId = await savePhotoToCloud({
            id: sessionId,
            dataUrl: capturedImage,
            timestamp: Date.now(),
            settings: { size: initialSize, background: 'original' as any, beauty: {} as any, printQuantity: 1 }
        }, config.googleScriptUrl);
        
        if (resultId) setIsCompleted(true);
        else alert('Đồng bộ thất bại. Vui lòng thử lại.');
    } catch (e) { 
        alert('Lỗi kết nối Cloud. Kiểm tra lại đường truyền.'); 
    } finally { 
        setIsUploading(false); 
    }
  };

  const topMarginPercent = useMemo(() => initialSize === PhotoSize.SIZE_3X4 ? 7.5 : initialSize === PhotoSize.SIZE_5X5 ? 6 : 7, [initialSize]);
  const marginText = useMemo(() => initialSize === PhotoSize.SIZE_4X6 ? "CÁCH MÉP 4MM" : "CÁCH MÉP 3MM", [initialSize]);
  const displayMarginText = marginText.replace('CÁCH MÉP', t('capture.margin', config));
  const overlayColor = validationStatus === 'valid' ? '#22c55e' : validationStatus === 'adjusting' ? '#facc15' : validationStatus === 'analyzing' ? '#60a5fa' : '#ef4444';

  const getSizeLabel = () => {
     if (initialSize === PhotoSize.SIZE_3X4) return t('capture.overlay.3x4', config);
     if (initialSize === PhotoSize.SIZE_5X5) return t('capture.overlay.5x5', config);
     return t('capture.overlay.4x6', config);
  };

  if (isCompleted) {
    return (
        <div className="h-[100dvh] bg-brand-600 flex flex-col items-center justify-center text-white p-8 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl">
                <svg className="w-10 h-10 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-black mb-4 uppercase">Gửi thành công!</h2>
            <p className="opacity-90">ID phiên: <span className="font-mono bg-black/20 px-2 rounded">{sessionId}</span></p>
            <p className="mt-4 opacity-80 text-sm">Máy tính sẽ nhận ảnh trong vài giây.</p>
        </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-black flex flex-col relative overflow-hidden touch-none py-safe">
        
        {/* Compact Status Header - Mobile Optimized */}
        <div className="absolute top-2 left-0 right-0 p-2 z-50 flex flex-col items-center pointer-events-none">
            {!capturedImage && (
                <div className={`
                  px-4 py-2.5 rounded-2xl backdrop-blur-md border transition-all duration-300 text-center shadow-lg flex flex-col items-center min-w-[200px] max-w-[90%]
                  ${validationStatus === 'valid' ? 'bg-green-600/60 border-green-400' : 
                    validationStatus === 'adjusting' ? 'bg-yellow-600/40 border-yellow-400' : 
                    validationStatus === 'analyzing' ? 'bg-brand-600/40 border-brand-400' : 
                    'bg-red-600/40 border-red-500'}
                `}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-white font-black text-[9px] uppercase tracking-widest">{feedbackMessage}</span>
                    </div>
                    <span className="text-white text-sm font-bold leading-tight line-clamp-2">{instruction}</span>
                </div>
            )}
        </div>

        <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">
            {cameraError ? (
                <div className="text-white text-center p-6 bg-black/80 rounded-2xl border border-red-500 m-4 pointer-events-auto">
                    <p className="font-bold">{cameraError}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold">Thử lại</button>
                </div>
            ) : capturedImage ? (
                <div className="relative h-full w-full flex items-center justify-center p-4 bg-black">
                    <img src={capturedImage} className="max-h-full max-w-full rounded shadow-2xl" alt="Preview" />
                </div>
            ) : (
                <>
                    <video ref={videoRef} autoPlay playsInline className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`} />
                    
                    {(validationStatus === 'searching' || validationStatus === 'analyzing') && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/60 shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[scan_1.5s_ease-in-out_infinite] z-30" />
                    )}

                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-70 pointer-events-none z-20">
                        <defs>
                            <mask id="m">
                                <rect x="0" y="0" width="100" height="100" fill="white" />
                                <ellipse cx="50" cy={topMarginPercent + 35} rx={32} ry={38} fill="black" />
                            </mask>
                        </defs>
                        <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.5)" mask="url(#m)" />
                        
                        <line x1="50" y1="0" x2="50" y2="100" stroke={overlayColor} strokeWidth="0.1" strokeDasharray="1,2" />
                        <line x1="0" y1={topMarginPercent} x2="100" y2={topMarginPercent} stroke="#fbbf24" strokeWidth="0.3" strokeDasharray="3,2" />
                        <text x="50" y={topMarginPercent - 1} fill="#fbbf24" fontSize="2" fontWeight="bold" textAnchor="middle" style={{textShadow: '0 1px 2px black'}}>{displayMarginText}</text>
                        <line x1="15" y1={topMarginPercent + 28} x2="85" y2={topMarginPercent + 28} stroke={overlayColor} strokeWidth="0.3" strokeDasharray="3,3" />

                        <ellipse 
                            cx="50" 
                            cy={topMarginPercent + 35} 
                            rx={32} 
                            ry={38} 
                            fill="none" 
                            stroke={overlayColor} 
                            strokeWidth={validationStatus === 'valid' ? "0.8" : "0.3"} 
                            strokeDasharray={validationStatus === 'valid' ? "0" : "1,1"} 
                        />

                        <text x="50" y="96" fill="white" fontSize="2.5" textAnchor="middle" fontWeight="black" style={{textShadow: '0 1px 2px black', opacity: 0.8}}>
                            {getSizeLabel()}
                        </text>
                    </svg>
                </>
            )}

            {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-[100] backdrop-blur-sm">
                    <span className="text-8xl font-black text-white animate-ping">{countdown}</span>
                </div>
            )}
        </div>

        {/* Controls Footer - Compact for Mobile */}
        <div className="bg-black/95 px-6 pt-4 pb-8 z-50 flex flex-col items-center gap-4 border-t border-white/5">
            {capturedImage ? (
                <div className="flex w-full gap-3 max-w-sm">
                    <button onClick={() => setCapturedImage(null)} disabled={isUploading} className="flex-1 py-3.5 bg-gray-800 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest border border-white/10 active:scale-95 transition-all">Chụp lại</button>
                    <button onClick={handleUpload} disabled={isUploading} className="flex-[2] py-3.5 bg-brand-600 text-white rounded-xl font-black shadow-xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                        {isUploading ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                        {isUploading ? "Đang gửi..." : "Sử dụng ảnh này"}
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-sm space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <button 
                            onClick={() => setIsAutoCaptureEnabled(!isAutoCaptureEnabled)}
                            className="flex flex-col items-center gap-1.5"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isAutoCaptureEnabled ? 'bg-brand-600 border-brand-400 text-white ring-2 ring-brand-500/20' : 'bg-white/5 border-white/10 text-white/30'}`}>
                                <svg className={`w-5 h-5 ${isAutoCaptureEnabled ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${isAutoCaptureEnabled ? 'text-brand-400' : 'text-white/30'}`}>AUTO</span>
                        </button>

                        <button 
                            onClick={() => setCountdown(3)} 
                            disabled={countdown !== null} 
                            className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${validationStatus === 'valid' ? 'border-green-500 bg-white shadow-lg' : 'border-gray-600 bg-gray-800'}`}
                        >
                            <div className={`w-16 h-16 rounded-full transition-colors ${validationStatus === 'valid' ? 'bg-green-600' : 'bg-gray-700'}`}></div>
                        </button>

                        <button 
                            onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')} 
                            className="flex flex-col items-center gap-1.5"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 active:bg-white/20 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">XOAY</span>
                        </button>
                    </div>

                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="w-full py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-white/40 hover:text-white/70 active:bg-white/10 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Thư viện ảnh</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>
            )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={analysisCanvasRef} className="hidden" />
    </div>
  );
};

export default MobileCaptureClient;
