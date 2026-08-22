
import React from 'react';
import { AppConfig, PhotoSize } from '../types';
import { t } from '../services/i18n';

interface StartRegulationsProps {
  config: AppConfig;
  selectedSize: PhotoSize;
  photoTypes: any[];
}

const StartRegulations: React.FC<StartRegulationsProps> = ({ config, selectedSize, photoTypes }) => {
  const currentRules = (config && config.photoRules && config.photoRules[selectedSize]) || [];
  const selectedType = photoTypes ? photoTypes.find(t => t.id === selectedSize) : undefined;

  return (
    <div className="w-full md:w-5/12 bg-slate-50 dark:bg-gray-900 p-5 md:p-8 flex flex-col border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800">
      <h3 className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <span className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </span>
        {t('start.regulations', config)}
      </h3>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col relative overflow-hidden mb-3">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
        <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-[11px] md:text-xs">
          {t('start.standard', config)} {selectedType?.label}
        </h4>
        <ul className="space-y-1.5 mb-3">
          {currentRules.map((rule, idx) => (
            <li key={idx} className="flex gap-1.5 text-[10px] md:text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              <svg className="w-3 h-3 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30 flex gap-2">
          <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <div>
             <p className="text-[9px] md:text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase leading-none mb-1">{t('start.important', config)}</p>
             <p className="text-[9px] md:text-[10px] text-amber-700 dark:text-amber-300 leading-tight">{t('start.important_text', config)}</p>
          </div>
        </div>
      </div>

      {(config.customContentHtml || config.customContentImageUrl) && (
          <div 
            className="rounded-xl p-3 md:p-4 shadow-sm border border-slate-100 dark:border-gray-700 mt-2 overflow-hidden"
            style={{ 
                backgroundColor: config.customContentBgColor || '#f8fafc', 
                color: config.customContentTextColor || '#475569',
                fontSize: config.customContentSize === 'sm' ? '10px' : config.customContentSize === 'lg' ? '13px' : '11px'
            }}
          >
              {config.customContentImageUrl && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm">
                      {config.customContentLinkUrl ? (
                          <a href={config.customContentLinkUrl} target="_blank" rel="noopener noreferrer">
                              <img src={config.customContentImageUrl} alt="Banner" className="w-full h-auto object-cover hover:opacity-90 transition-opacity" />
                          </a>
                      ) : (
                          <img src={config.customContentImageUrl} alt="Banner" className="w-full h-auto object-cover" />
                      )}
                  </div>
              )}
              {config.customContentHtml && <div dangerouslySetInnerHTML={{ __html: config.customContentHtml }} />}
          </div>
      )}
    </div>
  );
};

export default StartRegulations;
