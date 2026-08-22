
import React from 'react';
import { PhotoSize, BackgroundType, AppConfig } from '../types';
import { t } from '../services/i18n';

interface StartSelectionProps {
  config: AppConfig;
  selectedSize: PhotoSize;
  selectedBg: BackgroundType;
  quantity: number;
  photoTypes: any[];
  onSizeSelect: (size: PhotoSize) => void;
  onBgSelect: (bg: BackgroundType) => void;
  onQuantityChange: (q: number) => void;
  onStart: () => void;
}

const StartSelection: React.FC<StartSelectionProps> = ({
  config, selectedSize, selectedBg, quantity, photoTypes,
  onSizeSelect, onBgSelect, onQuantityChange, onStart
}) => {
  return (
    <div className="w-full md:w-7/12 p-5 md:p-8 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="mb-5 md:mb-6">
         <div className="flex items-center gap-2 mb-2">
           {config.logoUrl ? (
             <img src={config.logoUrl} alt="Logo" className="h-8 md:h-10 w-auto object-contain" />
           ) : (
             <div className="h-8 w-8 md:h-10 md:w-10 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
               {config.shopName.charAt(0)}
             </div>
           )}
           <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">{config.shopName}</h1>
         </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight leading-tight">
          {t('start.welcome', config)} <span className="text-brand-600 dark:text-brand-400">ID Photo Pro</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs md:text-sm">{t('start.subtitle', config)}</p>
      </div>

      <div className="space-y-6 md:space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{t('start.step1', config)}</label>
          <div className="grid grid-cols-1 gap-3 md:gap-3">
            {photoTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => onSizeSelect(type.id)}
                className={`relative flex items-center p-4 md:p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${
                  selectedSize === type.id 
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md' 
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-200 dark:hover:border-brand-700'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 ${selectedSize === type.id ? 'bg-white dark:bg-gray-700 shadow-sm' : 'bg-gray-50 dark:bg-gray-700'}`}>{type.icon}</div>
                <div className="text-left flex-1">
                  <div className={`font-bold text-base ${selectedSize === type.id ? 'text-brand-700 dark:text-brand-300' : 'text-gray-800 dark:text-gray-200'}`}>{type.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{type.dimensions}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedSize === type.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-300 dark:border-gray-600 text-transparent'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{t('start.step2', config)}</label>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl gap-1">
              <button onClick={() => onBgSelect(BackgroundType.WHITE)} className={`flex-1 py-3 md:py-2 rounded-lg text-xs font-bold transition-all ${selectedBg === BackgroundType.WHITE ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>{t('start.bg_white', config)}</button>
              <button onClick={() => onBgSelect(BackgroundType.BLUE)} className={`flex-1 py-3 md:py-2 rounded-lg text-xs font-bold transition-all ${selectedBg === BackgroundType.BLUE ? 'bg-brand-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400'}`}>{t('start.bg_blue', config)}</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{t('start.step3', config)}</label>
            <div className="flex items-center bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden h-[48px] md:h-[40px]">
              <button onClick={() => onQuantityChange(Math.max(4, quantity - 1))} className="w-14 md:w-10 h-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 font-bold border-r dark:border-gray-700 active:bg-gray-200 text-lg">-</button>
              <div className="flex-1 text-center font-bold text-gray-800 dark:text-white text-base md:text-sm">{quantity}</div>
              <button onClick={() => onQuantityChange(quantity + 1)} className="w-14 md:w-10 h-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 font-bold border-l dark:border-gray-700 active:bg-gray-200 text-lg">+</button>
            </div>
          </div>
        </div>
      </div>

      <button onClick={onStart} className="w-full mt-8 md:mt-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-lg md:text-base shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95">
        <span>{t('btn.start', config)}</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </button>
    </div>
  );
};

export default StartSelection;
