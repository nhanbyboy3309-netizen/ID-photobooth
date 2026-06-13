
import React, { useState, useEffect, useMemo } from 'react';
import { AppConfig, BackgroundType, PhotoSize } from '../types';
import StartSelection from './StartSelection';
import StartRegulations from './StartRegulations';
import { t } from '../services/i18n';

interface StartScreenProps {
  onStart: (config: { size: PhotoSize; background: BackgroundType; quantity: number }) => void;
  onHome: () => void;
  config: AppConfig;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, onHome, config }) => {
  const [selectedSize, setSelectedSize] = useState<PhotoSize>(PhotoSize.SIZE_4X6);
  const [selectedBg, setSelectedBg] = useState<BackgroundType>(BackgroundType.WHITE);
  const [quantity, setQuantity] = useState<number>(8);

  useEffect(() => {
    switch (selectedSize) {
      case PhotoSize.SIZE_3X4: setQuantity(16); break;
      case PhotoSize.SIZE_5X5: setQuantity(6); break;
      case PhotoSize.SIZE_4X6: 
      default: setQuantity(8); break;
    }
  }, [selectedSize]);

  const photoTypes = useMemo(() => [
    {
      id: PhotoSize.SIZE_4X6,
      label: t('photo.type.passport', config),
      dimensions: '4x6 cm',
      defaultBg: BackgroundType.WHITE,
      icon: (
        <svg className="w-6 h-6 md:w-8 md:h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
      )
    },
    {
      id: PhotoSize.SIZE_3X4,
      label: t('photo.type.id', config),
      dimensions: '3x4 cm',
      defaultBg: BackgroundType.BLUE,
      icon: (
        <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
      )
    },
    {
      id: PhotoSize.SIZE_5X5,
      label: t('photo.type.visa', config),
      dimensions: '5x5 cm (2x2 inch)',
      defaultBg: BackgroundType.WHITE,
      icon: (
        <svg className="w-6 h-6 md:w-8 md:h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )
    }
  ], [config]);

  const handleSizeSelect = (size: PhotoSize) => {
    setSelectedSize(size);
    const type = photoTypes.find(t => t.id === size);
    if (type) setSelectedBg(type.defaultBg);
  };

  const handleStart = () => {
    onStart({ size: selectedSize, background: selectedBg, quantity: quantity });
  };

  return (
    <div className="min-h-[100dvh] h-auto bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-3 md:p-6 pb-20 md:pb-6">
      <div className="absolute top-2 left-2 md:top-4 md:left-4 flex gap-3 z-20">
        <button onClick={onHome} className="px-3 py-2 md:px-4 md:py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-white dark:hover:bg-gray-700 hover:text-brand-600 dark:hover:text-brand-400 transition flex items-center gap-2 shadow-sm text-sm">
          <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l-7 7m-7 7h18"></path></svg>
          <span className="hidden sm:inline">{t('btn.home', config)}</span>
        </button>
      </div>

      <div className="max-w-6xl w-full bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row ring-1 ring-gray-100 dark:ring-gray-800 mt-12 md:mt-0 mb-safe">
        <StartSelection 
            config={config}
            selectedSize={selectedSize}
            selectedBg={selectedBg}
            quantity={quantity}
            photoTypes={photoTypes}
            onSizeSelect={handleSizeSelect}
            onBgSelect={setSelectedBg}
            onQuantityChange={setQuantity}
            onStart={handleStart}
        />
        <StartRegulations 
            config={config}
            selectedSize={selectedSize}
            photoTypes={photoTypes}
        />
      </div>
    </div>
  );
};

export default StartScreen;
