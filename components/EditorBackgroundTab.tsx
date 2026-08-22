
import React from 'react';
import { BackgroundType, AppConfig, PhotoSettings } from '../types';
import { t } from '../services/i18n';

interface EditorBackgroundTabProps {
  config: AppConfig;
  settings: PhotoSettings;
  onBgChange: (bg: BackgroundType, hex?: string) => void;
}

const EditorBackgroundTab: React.FC<EditorBackgroundTabProps> = ({ config, settings, onBgChange }) => {
  return (
    <div className="animate-fadeIn">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Chọn màu phông nền</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
           {/* Original Option */}
           <button 
             onClick={() => onBgChange(BackgroundType.ORIGINAL)} 
             className={`
                group relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-200
                ${settings.background === BackgroundType.ORIGINAL 
                    ? 'border-brand-500 bg-brand-900/10' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}
             `}
           >
             <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl shadow-inner border border-white/5">📷</div>
             <span className={`text-xs font-bold uppercase ${settings.background === BackgroundType.ORIGINAL ? 'text-brand-400' : 'text-gray-400'}`}>
                {t('editor.label.original', config)}
             </span>
             {settings.background === BackgroundType.ORIGINAL && (
                 <div className="absolute top-3 right-3 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
             )}
           </button>

           {/* Color Options */}
           {(config.backgroundConfig || []).map((bg, idx) => {
             const isSelected = settings.background === bg.type && settings.backgroundHex === bg.hexColor;
             return (
                 <button 
                   key={idx} 
                   onClick={() => onBgChange(bg.type, bg.hexColor)} 
                   className={`
                      group relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-200
                      ${isSelected 
                        ? 'border-brand-500 bg-brand-900/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}
                   `}
                 >
                   <div 
                        className="w-12 h-12 rounded-full shadow-lg border-2 border-white/20 group-hover:scale-110 transition-transform" 
                        style={{ backgroundColor: bg.hexColor }} 
                   />
                   <span className={`text-xs font-bold uppercase truncate w-full text-center ${isSelected ? 'text-brand-400' : 'text-gray-400'}`}>
                        {bg.label}
                   </span>
                   
                   {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs shadow-sm">✓</div>
                   )}
                 </button>
             );
           })}
        </div>
    </div>
  );
};

export default EditorBackgroundTab;
