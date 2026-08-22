
import React from 'react';
import { PhotoSize, AppConfig } from '../types';
import { t } from '../services/i18n';

interface CaptureOverlayProps {
  selectedSize: PhotoSize;
  validationStatus: string;
  aiLimitReached: boolean;
  topMarginPercent: number;
  marginText: string;
  getOverlayColor: () => string;
  config?: AppConfig;
}

const CaptureOverlay: React.FC<CaptureOverlayProps> = ({
  selectedSize, validationStatus, aiLimitReached, topMarginPercent, marginText, getOverlayColor, config = { language: 'vi' } as AppConfig
}) => {
  const isUSVisa = selectedSize === PhotoSize.SIZE_5X5;
  const is3x4 = selectedSize === PhotoSize.SIZE_3X4;
  const overlayColor = getOverlayColor();

  const getSizeLabel = () => {
     if (is3x4) return t('capture.overlay.3x4', config);
     if (isUSVisa) return t('capture.overlay.5x5', config);
     return t('capture.overlay.4x6', config);
  };

  const displayMarginText = marginText.replace('CÁCH MÉP', t('capture.margin', config));

  return (
    <div className="relative z-10 w-full h-full">
      {(validationStatus === 'searching' || validationStatus === 'analyzing') && !aiLimitReached && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/80 shadow-[0_0_15px_rgba(255,255,255,1)] animate-[scan_1.5s_ease-in-out_infinite]" />
      )}

      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-90 pointer-events-none transition-colors duration-300">
         <defs>
           <mask id="faceMask">
             <rect x="0" y="0" width="100" height="100" fill="white" />
             <ellipse cx="50" cy={topMarginPercent + 35} rx={isUSVisa ? 35 : 32} ry={isUSVisa ? 42 : 38} fill="black" />
           </mask>
         </defs>

         <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.6)" mask="url(#faceMask)" />

         <line x1="50" y1="0" x2="50" y2="100" stroke={overlayColor} strokeWidth="0.2" strokeDasharray="2,2" />
        
         <line x1="0" y1={topMarginPercent} x2="100" y2={topMarginPercent} stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="5,2" />
         <text x="50" y={topMarginPercent - 1} fill="#fbbf24" fontSize="2.5" fontWeight="bold" textAnchor="middle" style={{textShadow: '0 1px 2px black'}}>{displayMarginText}</text>

         <line x1="15" y1={topMarginPercent + 28} x2="85" y2={topMarginPercent + 28} stroke={overlayColor} strokeWidth="0.5" strokeDasharray="4,4" />
         
         <ellipse 
            cx="50" 
            cy={topMarginPercent + 35} 
            rx={isUSVisa ? 35 : 32} 
            ry={isUSVisa ? 42 : 38} 
            fill="none" 
            stroke={overlayColor} 
            strokeWidth={validationStatus === 'valid' ? "1" : "0.5"} 
            strokeDasharray={validationStatus === 'valid' ? "0" : "2,2"} 
         />
         
         <text x="50" y="95" fill="white" fontSize="3" textAnchor="middle" fontWeight="bold" style={{textShadow: '0 1px 2px black'}}>
           {getSizeLabel()}
         </text>
      </svg>
    </div>
  );
};

export default CaptureOverlay;
