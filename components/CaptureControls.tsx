
import React from 'react';
import { t } from '../services/i18n';
import { AppConfig } from '../types';

interface CaptureControlsProps {
  isAutoCaptureEnabled: boolean;
  validationStatus: string;
  countdown: number | null;
  isCapturing: boolean;
  onAutoCaptureToggle: () => void;
  onCaptureClick: () => void;
  onMobileLink: () => void;
  onFileUploadClick: () => void;
  config?: AppConfig;
}

const CaptureControls: React.FC<CaptureControlsProps> = ({
  isAutoCaptureEnabled, validationStatus, countdown, isCapturing, onAutoCaptureToggle, onCaptureClick, onMobileLink, onFileUploadClick, config = { language: 'vi' } as AppConfig
}) => {
  return (
    <div className="w-full flex justify-center items-center gap-2 sm:gap-6 md:gap-8 pointer-events-auto px-4 overflow-x-auto scrollbar-hide">
      
      {/* 1. UPLOAD */}
      <div className="flex flex-col items-center gap-1 w-16 sm:w-20 shrink-0">
         <button
           onClick={onFileUploadClick}
           className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-300 border-2 bg-black/50 border-gray-600 text-gray-400 hover:border-brand-400 hover:text-white hover:bg-gray-800 active:scale-95"
           title={t('capture.btn.upload', config)}
         >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
         </button>
         <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter text-gray-500">
            {t('capture.btn.upload', config)}
         </span>
      </div>

      {/* 2. AUTO TOGGLE */}
      <div className="flex flex-col items-center gap-1 w-16 sm:w-20 shrink-0">
         <button
           onClick={onAutoCaptureToggle}
           className={`
              w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-300 border-2 active:scale-95
              ${isAutoCaptureEnabled 
                ? 'bg-brand-600 border-brand-400 text-white shadow-lg shadow-brand-500/40 ring-2 ring-brand-500/20' 
                : 'bg-black/50 border-gray-600 text-gray-400 hover:border-gray-400'}
           `}
           title={isAutoCaptureEnabled ? t('capture.tooltip.auto_on', config) : t('capture.tooltip.auto_off', config)}
         >
            <svg className={`w-5 h-5 md:w-6 md:h-6 ${isAutoCaptureEnabled ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
         </button>
         <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-tighter ${isAutoCaptureEnabled ? 'text-brand-400' : 'text-gray-500'}`}>
            AUTO
         </span>
      </div>

      {/* 3. CAPTURE BUTTON */}
      <div className="flex flex-col items-center gap-3 shrink-0 mx-2">
          <div className={`text-[10px] md:text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur transition-colors ${validationStatus === 'valid' ? 'bg-green-500 text-white' : 'bg-gray-800/80 text-gray-400'}`}>
            {validationStatus === 'valid' ? `✔ ${t('capture.label.valid', config)}` : `⚠️ ${t('capture.label.processing', config)}`}
          </div>

          <button
            onClick={onCaptureClick}
            disabled={countdown !== null || isCapturing}
            className={`
              w-16 h-16 md:w-20 md:h-20 rounded-full border-4 transition-all duration-300 flex items-center justify-center shadow-2xl relative
              ${validationStatus === 'valid' 
                ? 'bg-white border-green-500 hover:border-green-400 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-green-500/30' 
                : 'bg-gray-700 border-gray-600 opacity-90 cursor-pointer'} 
            `}
          >
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full transition-all duration-300 flex items-center justify-center ${validationStatus === 'valid' ? 'bg-green-600' : 'bg-gray-600'}`}>
                {validationStatus !== 'valid' && (
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                )}
            </div>
          </button>
      </div>

      {/* 4. MOBILE LINK */}
      <div className="flex flex-col items-center gap-1 w-16 sm:w-20 shrink-0">
         <button
           onClick={onMobileLink}
           className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-300 border-2 bg-black/50 border-gray-600 text-gray-400 hover:border-brand-400 hover:text-white hover:bg-gray-800 active:scale-95"
           title={t('mobile.title', config)}
         >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
         </button>
         <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter text-gray-500">
            MOBILE
         </span>
      </div>
    </div>
  );
};

export default CaptureControls;
