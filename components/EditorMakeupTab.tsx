
import React, { useState } from 'react';
import { AppConfig, PhotoSettings } from '../types';
import { t } from '../services/i18n';
import { getHairStyles, findHairStyle } from '../services/hairStyles';

interface EditorMakeupTabProps {
  config: AppConfig;
  settings: PhotoSettings;
  onAiBeautyChange: (key: keyof PhotoSettings['beauty'], value: any) => void;
}

const EditorMakeupTab: React.FC<EditorMakeupTabProps> = ({ config, settings, onAiBeautyChange }) => {
  const [hairGender, setHairGender] = useState<'male' | 'female'>(findHairStyle(config, settings.beauty.hairStyle)?.gender || 'male');

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
                  type="range" min="0" max="100" step={item.id === 'smoothSkin' || item.id === 'blemishIntensity' ? 1 : 5}
                  value={(settings.beauty as any)[item.id]} 
                  onChange={(e) => onAiBeautyChange(item.id as any, Number(e.target.value))} 
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
            </div>
         ))}

         <button
            type="button"
            role="switch"
            aria-checked={!!settings.beauty.removeSkinMarks}
            onClick={() => onAiBeautyChange('removeSkinMarks', !settings.beauty.removeSkinMarks)}
            className="w-full flex items-center justify-between gap-3 text-left"
         >
            <span className="min-w-0">
               <span className="block text-xs font-bold text-gray-300">{t('editor.makeup.removeMarks', config)}</span>
               <span className="block text-[10px] text-gray-500">{t('editor.makeup.removeMarksHint', config)}</span>
            </span>
            <span className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${settings.beauty.removeSkinMarks ? 'bg-brand-500' : 'bg-gray-700'}`}>
               <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.beauty.removeSkinMarks ? 'translate-x-4' : ''}`}></span>
            </span>
         </button>
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

         <div className="space-y-3 pt-2">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('editor.makeup.hairStyle', config)}</span>
            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
               {(['male', 'female'] as const).map(g => (
                  <button
                     key={g}
                     onClick={() => setHairGender(g)}
                     className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${hairGender === g ? (g === 'male' ? 'bg-brand-600 text-white' : 'bg-pink-600 text-white') : 'text-gray-500 hover:text-gray-300'}`}
                  >
                     {t(`editor.gender.${g}`, config)}
                  </button>
               ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
               {[{ id: 'original', label: t('editor.makeup.hairStyleOriginal', config) }, ...getHairStyles(config).filter(s => s.gender === hairGender)].map(s => {
                  const active = (settings.beauty.hairStyle || 'original') === s.id;
                  return (
                     <button
                        key={s.id}
                        onClick={() => onAiBeautyChange('hairStyle', s.id)}
                        className={`py-2.5 px-2 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all ${active ? 'border-brand-500 bg-brand-900/20 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'}`}
                     >
                        {s.label}
                     </button>
                  );
               })}
            </div>
         </div>
      </div>
    </div>
  );
};

export default EditorMakeupTab;
