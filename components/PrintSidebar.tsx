
import React from 'react';
import { PhotoSettings, AppConfig } from '../types';
import { t } from '../services/i18n';

interface PrintSidebarProps {
  photoId: string | null;
  isSaving: boolean;
  sheetImages: string[];
  qrUrl: string;
  settings: PhotoSettings;
  config: AppConfig;
  onPrint: () => void;
  onDownload: () => void;
  onHome: () => void;
}

const PrintSidebar: React.FC<PrintSidebarProps> = ({
  photoId, isSaving, sheetImages, qrUrl, settings, config, onPrint, onDownload, onHome
}) => {
  return (
    <div className="w-full md:w-80 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-xl flex flex-col gap-4 md:gap-6 md:h-fit md:sticky md:top-6">
      <div>
        <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-gray-800 dark:text-white">{t('print.main_actions', config)}</h3>
           <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-bold">{settings.printQuantity} photos</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3 mb-3">
            <button 
              onClick={onDownload}
              disabled={sheetImages.length === 0}
              className="group w-full py-3 bg-white dark:bg-gray-700 border-2 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/50 hover:border-brand-300 dark:hover:border-brand-700 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs md:text-sm"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
               <span>{t('print.btn.download', config)}</span>
            </button>

            <button 
              onClick={onPrint}
              disabled={isSaving || sheetImages.length === 0}
              className="group w-full py-3 md:py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm md:text-lg shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-1 disabled:bg-gray-400"
            >
              <div className="flex items-center gap-2">
                {sheetImages.length === 0 ? <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>}
                <span>{isSaving ? t('print.btn.saving', config) : sheetImages.length === 0 ? t('print.btn.processing', config) : t('print.btn.print', config)}</span>
              </div>
            </button>
        </div>
        
        <div className="hidden md:block bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900/30 text-xs text-yellow-800 dark:text-yellow-400 mb-4">
            <strong>{t('print.note.title', config)}</strong> {t('print.note.text', config)}
        </div>

        <div className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl p-3 text-center flex flex-row md:flex-col items-center justify-between md:justify-center gap-4">
           <div className="text-left md:text-center">
               <h3 className="font-bold text-gray-800 dark:text-white mb-1 text-xs uppercase tracking-wider">{t('print.qr.title', config)}</h3>
               <div className="flex flex-col items-start md:items-center">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                    ID: {photoId || '...'}
                  </span>
               </div>
           </div>
           
           {qrUrl ? (
               <div className="relative w-16 h-16 md:w-28 md:h-28">
                   <img src={qrUrl} alt="QR" className="w-full h-full mix-blend-multiply dark:mix-blend-normal dark:bg-white dark:p-1 dark:rounded-lg" />
                    {config.logoUrl && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 md:w-7 md:h-7 bg-white rounded-full p-0.5 border border-gray-100 shadow-sm flex items-center justify-center">
                            <img src={config.logoUrl} className="w-full h-full object-contain rounded-full" alt="Mini Logo" />
                        </div>
                    )}
               </div>
           ) : (
               <div className="w-16 h-16 md:w-28 md:h-28 flex items-center justify-center text-xs text-gray-400 bg-gray-100 dark:bg-gray-600 rounded">...</div>
           )}
        </div>
      </div>
      
      <button onClick={onHome} className="w-full p-2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">{t('btn.home', config)}</button>
    </div>
  );
};

export default PrintSidebar;
