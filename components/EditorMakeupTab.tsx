
import React from 'react';
import { AppConfig, PhotoSettings } from '../types';
import { t } from '../services/i18n';

interface EditorMakeupTabProps {
  config: AppConfig;
  settings: PhotoSettings;
  onAiBeautyChange: (key: keyof PhotoSettings['beauty'], value: any) => void;
}

const EditorMakeupTab: React.FC<EditorMakeupTabProps> = ({ config, settings, onAiBeautyChange }) => {
  return (
    <div className="space-y-8 animate-fadeIn pb-6">
      
      {/* 1. SLIDERS GROUP */}
      <div className="space-y-6">
         <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-white/10 pb-2">{t('editor.makeup.definition', config)}</h3>

         {[
            { id: 'eyebrowIntensity', label: t('editor.makeup.eyebrow', config) },
            { id: 'eyelashIntensity', label: t('editor.makeup.eyelash', config) },
            { id: 'contourIntensity', label: t('editor.makeup.contour', config) },
            { id: 'blemishIntensity', label: t('editor.makeup.blemish', config) },
            { id: 'smoothSkin', label: t('editor.makeup.smooth', config) }
         ].map((item) => (
            <div key={item.id} className="space-y-2">
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-gray-300">{item.label}</span>
                   <span className="text-[10px] font-mono text-brand-400 bg-brand-900/20 px-1.5 rounded">{(settings.beauty as any)[item.id]}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="5" 
                  value={(settings.beauty as any)[item.id]} 
                  onChange={(e) => onAiBeautyChange(item.id as any, Number(e.target.value))} 
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
            </div>
         ))}
      </div>

      {/* 2. LIPSTICK */}
      <div className="space-y-4 pt-4 border-t border-white/10">
         <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('editor.makeup.lipstick', config)}</span>
            <span className="text-[10px] text-pink-400 font-bold">{settings.beauty.lipstickIntensity}%</span>
         </div>
         <div className="flex flex-wrap gap-3">
            {(config.lipstickOptions || []).map(opt => (
              <button 
                key={opt.id} 
                onClick={() => { onAiBeautyChange('lipstickColor', opt.id); if(settings.beauty.lipstickIntensity === 0) onAiBeautyChange('lipstickIntensity', 50); }} 
                className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                    ${settings.beauty.lipstickColor === opt.id 
                        ? 'bg-white ring-2 ring-pink-500 shadow-lg scale-110' 
                        : 'bg-transparent hover:bg-white/10'}
                `}
              >
                <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: opt.hex }}></div>
              </button>
            ))}
         </div>
         <input 
            type="range" min="0" max="100" step="10" 
            value={settings.beauty.lipstickIntensity} 
            onChange={(e) => onAiBeautyChange('lipstickIntensity', Number(e.target.value))} 
            className="w-full accent-pink-500" 
         />
      </div>

      {/* 3. BLUSH */}
      <div className="space-y-4 pt-4 border-t border-white/10">
         <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('editor.makeup.blush', config)}</span>
            <span className="text-[10px] text-orange-400 font-bold">{settings.beauty.blushIntensity}%</span>
         </div>
         <div className="flex flex-wrap gap-3">
            {(config.blushOptions || []).map(opt => (
              <button 
                key={opt.id} 
                onClick={() => { onAiBeautyChange('blushColor', opt.id); if(settings.beauty.blushIntensity === 0) onAiBeautyChange('blushIntensity', 30); }} 
                className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                    ${settings.beauty.blushColor === opt.id 
                        ? 'bg-white ring-2 ring-orange-500 shadow-lg scale-110' 
                        : 'bg-transparent hover:bg-white/10'}
                `}
              >
                <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: opt.hex }}></div>
              </button>
            ))}
         </div>
         <input 
            type="range" min="0" max="100" step="10" 
            value={settings.beauty.blushIntensity} 
            onChange={(e) => onAiBeautyChange('blushIntensity', Number(e.target.value))} 
            className="w-full accent-orange-500" 
         />
      </div>

      {/* 4. HAIR */}
      <div className="space-y-4 pt-4 border-t border-white/10">
         <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('editor.makeup.hair', config)}</span>
            <span className="text-[10px] text-gray-300 font-bold">{settings.beauty.hairVolume}%</span>
         </div>
         <div className="flex flex-wrap gap-3">
            {(config.hairColorOptions || []).map(opt => (
              <button 
                key={opt.id} 
                onClick={() => { onAiBeautyChange('hairColor', opt.id); if(opt.id !== 'original' && settings.beauty.hairVolume === 0) onAiBeautyChange('hairVolume', 20); }} 
                className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                    ${settings.beauty.hairColor === opt.id 
                        ? 'bg-white ring-2 ring-gray-400 shadow-lg scale-110' 
                        : 'bg-transparent hover:bg-white/10'}
                `}
              >
                {opt.id === 'original' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-[8px] font-black text-white">ORIG</div>
                ) : (
                    <div className="w-8 h-8 rounded-full shadow-inner border border-white/10" style={{ backgroundColor: opt.hex }}></div>
                )}
              </button>
            ))}
         </div>
         <input 
            type="range" min="0" max="100" step="20" 
            value={settings.beauty.hairVolume} 
            onChange={(e) => onAiBeautyChange('hairVolume', Number(e.target.value))} 
            className="w-full accent-gray-400" 
         />
      </div>
    </div>
  );
};

export default EditorMakeupTab;
