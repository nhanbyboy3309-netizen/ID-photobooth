
import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, PhotoSize } from '../types';
import { getPhotoById } from '../services/databaseService';
import { t } from '../services/i18n';

interface MobileCameraLinkProps {
  onPhotoReceived: (dataUrl: string) => void;
  onCancel: () => void;
  config: AppConfig;
  selectedSize: PhotoSize;
}

const MobileCameraLink: React.FC<MobileCameraLinkProps> = ({ onPhotoReceived, onCancel, config, selectedSize }) => {
  // Session ID duy nhất cho phiên làm việc này
  const [sessionId, setSessionId] = useState<string>(`IDP_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [status, setStatus] = useState<'waiting' | 'found' | 'downloading'>('waiting');
  const [pollCount, setPollCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<any>(null);

  const generateQr = () => {
    const sid = sessionId;
    const baseUrl = window.location.origin + window.location.pathname;
    const scriptUrlEncoded = encodeURIComponent(config.googleScriptUrl || '');
    
    // Tạo link chứa session và size để điện thoại biết cần chụp kiểu gì
    const mobileLink = `${baseUrl}?mobileSession=${sid}&size=${selectedSize}&surl=${scriptUrlEncoded}`;
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(mobileLink)}&ecc=M&margin=1`);
  };

  useEffect(() => {
    generateQr();
    return () => {
        isMountedRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [sessionId, selectedSize, config.googleScriptUrl]);

  const pollForPhoto = async () => {
      if (!isMountedRef.current) return;
      
      try {
          setPollCount(prev => prev + 1);
          // Tìm ảnh trên cloud có ID trùng với sessionId
          const photo = await getPhotoById(sessionId, config.googleScriptUrl, true);
          
          if (photo && photo.dataUrl) {
              if (!isMountedRef.current) return;
              setStatus('found');
              setTimeout(() => {
                  if (isMountedRef.current) onPhotoReceived(photo.dataUrl);
              }, 800);
              return; 
          }
      } catch (e) {
          console.error("Polling error:", e);
      }

      // Tiếp tục quét sau mỗi 2 giây
      if (isMountedRef.current && status === 'waiting') {
          timeoutRef.current = setTimeout(pollForPhoto, 2000);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) onPhotoReceived(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRefresh = () => {
      setSessionId(`IDP_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
      setStatus('waiting');
      setPollCount(0);
  };

  useEffect(() => {
      pollForPhoto();
      return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [sessionId]);

  return (
    <div className="absolute inset-0 z-[60] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full border border-white/10 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-full transition-colors duration-500 ${status === 'found' ? 'bg-green-500' : 'bg-brand-500'}`}></div>
        
        {status === 'found' ? (
            <div className="py-10 animate-pulse flex flex-col items-center">
                <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase">Đã nhận được ảnh!</h2>
                <p className="text-gray-500 text-sm mt-2">Đang chuyển vào trình chỉnh sửa...</p>
            </div>
        ) : (
            <>
                <div className="mb-6 relative">
                    <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase leading-tight">Kết nối Camera</h2>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Đang chờ ({pollCount})
                        </span>
                    </div>
                    <button 
                        onClick={handleRefresh} 
                        className="absolute top-0 right-0 p-1.5 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded-full transition-all"
                        title="Làm mới mã"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                </div>

                <div className="mx-auto w-48 h-48 mb-6 p-2 bg-white rounded-xl shadow-inner border border-gray-100 flex items-center justify-center">
                    {qrUrl ? (
                        <img src={qrUrl} alt="QR Code" className="w-full h-full" />
                    ) : (
                        <div className="animate-spin w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full"></div>
                    )}
                </div>

                <div className="space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Quét mã bằng điện thoại để dùng camera ngoài. <br/>
                        <span className="font-bold text-brand-600">ID: {sessionId}</span>
                    </p>
                    
                    <div className="grid grid-cols-1 gap-2 mt-4">
                        <button 
                          onClick={() => fileInputRef.current?.click()} 
                          className="w-full py-3 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-brand-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            {t('capture.btn.upload', config)} từ máy tính
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        
                        <button onClick={onCancel} className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-gray-200 transition-colors">
                            Webcam máy tính
                        </button>
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default MobileCameraLink;
