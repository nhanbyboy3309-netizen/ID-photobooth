
import React, { useState } from 'react';
import { AppConfig, PhotoSettings } from '../types';
import { t } from '../services/i18n';

interface EditorClothingTabProps {
  config: AppConfig;
  settings: PhotoSettings;
  onClothingClick: (prompt: string) => void;
}

const EditorClothingTab: React.FC<EditorClothingTabProps> = ({ config, settings, onClothingClick }) => {
  const [genderTab, setGenderTab] = useState<'male' | 'female'>('male');
  const activeOptions = (config.clothingOptions || []).filter(item => item.gender === genderTab);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Segmented Control */}
      <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/5">
        <button 
          onClick={() => setGenderTab('male')} 
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${genderTab === 'male' ? 'bg-brand-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
        >
          {t('editor.gender.male', config)}
        </button>
        <button 
          onClick={() => setGenderTab('female')} 
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${genderTab === 'female' ? 'bg-pink-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
        >
          {t('editor.gender.female', config)}
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
        <button 
          onClick={() => onClothingClick('')} 
          className={`
            p-4 border-2 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all
            ${!settings.clothingPrompt 
                ? 'border-brand-500 bg-brand-900/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}
          `}
        >
           <div className="text-2xl opacity-70">👕</div>
           <div className="text-[10px] font-bold text-gray-300 uppercase tracking-wide">{t('editor.clothing.none', config)}</div>
        </button>
        
        {activeOptions.map((item) => (
          <button 
            key={item.id} 
            onClick={() => onClothingClick(item.prompt)} 
            className={`
                group relative p-4 border-2 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all
                ${settings.clothingPrompt === item.prompt 
                    ? 'border-brand-500 bg-brand-900/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}
            `}
          >
            <div className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</div>
            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-wide text-center leading-tight">{item.label}</div>
            {settings.clothingPrompt === item.prompt && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EditorClothingTab;
