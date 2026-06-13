
import React from 'react';
import { PhotoSettings, SkinToneType } from '../types';
import { t } from '../services/i18n';
import { getConfig } from '../services/configService';

interface EditorFilterTabProps {
  settings: PhotoSettings;
  onClientBeautyChange: (key: keyof PhotoSettings['beauty'], value: any) => void;
}

const EditorFilterTab: React.FC<EditorFilterTabProps> = ({ settings, onClientBeautyChange }) => {
  const config = getConfig();
  const SkinToneOptions = [
    { id: SkinToneType.NATURAL, label: 'Tự nhiên', color: '#e5cba6' },
    { id: SkinToneType.FAIR, label: 'Trắng Sáng', color: '#fcebe3' },
    { id: SkinToneType.ROSY, label: 'Trắng Hồng', color: '#ffdee8' },
    { id: SkinToneType.TAN, label: 'Ngăm Khỏe', color: '#cd9b75' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-6">
      <div className="space-y-6">
         <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
            <div className="flex justify-between text-[10px] font-black text-gray-300 mb-3 uppercase tracking-widest">
              <span>{t('editor.filter.lighting', config)}</span>
              <span className={`px-2 py-0.5 rounded text-[9px] ${settings.beauty.lighting > 0 ? 'bg-orange-500/20 text-orange-400' : settings.beauty.lighting < 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                {settings.beauty.lighting > 0 ? `+${settings.beauty.lighting}` : settings.beauty.lighting}
              </span>
            </div>
            <input 
              type="range" min="-50" max="50" step="5" 
              value={settings.beauty.lighting} 
              onChange={(e) => onClientBeautyChange('lighting', Number(e.target.value))} 
              className="w-full accent-brand-500" 
            />
         </div>
         
         <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
            <div className="flex justify-between text-[10px] font-black text-gray-300 mb-3 uppercase tracking-widest">
              <span>{t('editor.filter.contrast', config)}</span>
              <span className="text-[9px] font-bold text-gray-400">{settings.beauty.contrast}</span>
            </div>
            <input 
              type="range" min="-50" max="50" step="5" 
              value={settings.beauty.contrast} 
              onChange={(e) => onClientBeautyChange('contrast', Number(e.target.value))} 
              className="w-full accent-purple-500" 
            />
         </div>
      </div>

      <div className="pt-6 border-t border-white/10">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t('editor.filter.skintone', config)}</label>
        <div className="grid grid-cols-2 gap-3">
          {SkinToneOptions.map(tone => (
            <button 
              key={tone.id} 
              onClick={() => { onClientBeautyChange('skinToneType', tone.id); if (settings.beauty.skinToneIntensity === 0) onClientBeautyChange('skinToneIntensity', 30); }} 
              className={`
                flex items-center gap-3 p-3 rounded-2xl border-2 transition-all active:scale-95
                ${settings.beauty.skinToneType === tone.id 
                  ? 'border-brand-500 bg-brand-900/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                  : 'border-white/5 bg-white/5 hover:bg-white/10'}
              `}
            >
              <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm shrink-0" style={{ backgroundColor: tone.color }}></div>
              <span className={`text-[10px] font-black uppercase ${settings.beauty.skinToneType === tone.id ? 'text-brand-400' : 'text-gray-400'}`}>
                {tone.label}
              </span>
            </button>
          ))}
        </div>
        
        {settings.beauty.skinToneIntensity > 0 && (
            <div className="mt-6 px-2 animate-fadeIn">
                 <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">
                    <span>Cường độ</span>
                    <span>{settings.beauty.skinToneIntensity}%</span>
                 </div>
                 <input 
                  type="range" min="0" max="100" step="10" 
                  value={settings.beauty.skinToneIntensity} 
                  onChange={(e) => onClientBeautyChange('skinToneIntensity', Number(e.target.value))} 
                  className="w-full accent-orange-400" 
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default EditorFilterTab;
