
import React from 'react';
import { t } from '../services/i18n';
import { AppConfig } from '../types';

interface PrintSheetViewProps {
  sheetImages: string[];
  isSaving: boolean;
  config: AppConfig;
}

const PrintSheetView: React.FC<PrintSheetViewProps> = ({ sheetImages, isSaving, config }) => {
  return (
    <div className="h-full overflow-auto flex flex-col items-center justify-start scrollbar-hide pb-20 w-full">
        {sheetImages.length > 0 ? (
            sheetImages.map((src, idx) => (
                <div 
                    key={idx}
                    className="bg-white shadow-2xl mb-8 transform transition hover:scale-[1.01] max-w-full"
                    style={{ aspectRatio: '130/180', width: '130mm', height: 'auto' }}
                >
                    <img src={src} className="w-full h-full object-contain" alt={`Preview ${idx}`} />
                </div>
            ))
        ) : (
            <div className="w-full max-w-[130mm] aspect-[130/180] bg-white dark:bg-gray-800 shadow-xl flex flex-col items-center justify-center gap-4 p-4 text-center">
                <div className="w-12 h-12 border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 dark:border-t-brand-400 rounded-full animate-spin"></div>
                <p className="text-gray-400 text-sm font-bold animate-pulse">
                    {isSaving ? t('print.msg.saving_cloud', config) : t('print.msg.generating', config)}
                </p>
            </div>
        )}
    </div>
  );
};

export default PrintSheetView;
