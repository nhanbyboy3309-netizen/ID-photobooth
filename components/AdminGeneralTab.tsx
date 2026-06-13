
import React, { useRef } from 'react';
import { AppConfig } from '../types';
import { InputGroup, iconInputClass } from './AdminShared';
import { t } from '../services/i18n';

interface AdminGeneralTabProps {
  form: AppConfig;
  onChange: (field: keyof AppConfig, value: any) => void;
}

const AdminGeneralTab: React.FC<AdminGeneralTabProps> = ({ form, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { alert("Ảnh quá lớn!"); return; }
      const reader = new FileReader();
      reader.onloadend = () => onChange('logoUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-gray-900 dark:text-white">
      {/* Cloud Sync Section */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-xl">☁️</span> {t('admin.general.sync', form)}
        </h3>
        <InputGroup label="GOOGLE APPS SCRIPT URL" icon="🔗">
          <input 
            type="text" 
            value={form.googleScriptUrl || ''} 
            onChange={e => onChange('googleScriptUrl', e.target.value)} 
            className={`${iconInputClass} bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold`} 
            placeholder="https://script.google.com/..."
          />
        </InputGroup>
      </div>

      {/* Language Section */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-2">
           {t('admin.general.language', form)}
        </h3>
        <div className="flex gap-4">
           {[
             { id: 'vi', label: 'Tiếng Việt', sub: 'Vietnamese', flag: '🇻🇳' },
             { id: 'en', label: 'English', sub: 'Tiếng Anh', flag: '🇺🇸' }
           ].map(lang => (
             <button 
                key={lang.id}
                onClick={() => onChange('language', lang.id)}
                className={`flex-1 p-5 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${
                  form.language === lang.id 
                    ? 'border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-[1.02]' 
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-brand-300'
                }`}
             >
               <span className="text-3xl">{lang.flag}</span>
               <div className="text-left">
                  <div className="font-black text-sm uppercase tracking-tight">{lang.label}</div>
                  <div className={`text-[10px] font-bold opacity-70 ${form.language === lang.id ? 'text-white' : ''}`}>{lang.sub}</div>
               </div>
               {form.language === lang.id && (
                 <div className="ml-auto bg-white/20 p-1 rounded-full">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                 </div>
               )}
             </button>
           ))}
        </div>
      </div>

      {/* Branding Section */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-2">
          {t('admin.general.branding', form)}
        </h3>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 text-center">
            <div 
              className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-3xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden relative group cursor-pointer hover:border-brand-500 transition-colors" 
              onClick={() => fileInputRef.current?.click()}
            >
              {form.logoUrl ? (
                <img src={form.logoUrl} className="w-full h-full object-contain p-2" alt="Logo preview" />
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-1">🖼️</span>
                  <span className="text-[10px] text-gray-400 font-black uppercase">{t('admin.general.logo', form)}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/10 transition-colors" />
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
            {form.logoUrl && (
              <button 
                onClick={() => onChange('logoUrl', '')} 
                className="text-[10px] font-black text-red-500 mt-2 uppercase hover:underline"
              >
                {t('admin.general.remove_logo', form)}
              </button>
            )}
          </div>
          <div className="flex-1 space-y-5">
            <InputGroup label={t('admin.general.shop_name', form)} icon="🏷️">
              <input 
                type="text" 
                value={form.shopName} 
                onChange={e => onChange('shopName', e.target.value)} 
                className={`${iconInputClass} bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold`} 
              />
            </InputGroup>
            <InputGroup label="Tiêu đề màn hình chờ (Welcome Title)" icon="📝">
              <input 
                type="text" 
                value={form.welcomeTitle || ''} 
                onChange={e => onChange('welcomeTitle', e.target.value)} 
                className={`${iconInputClass} bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold`} 
              />
            </InputGroup>
            <InputGroup label="Phụ đề màn hình chờ (Welcome Subtitle)" icon="📄">
              <input 
                type="text" 
                value={form.welcomeSubtitle || ''} 
                onChange={e => onChange('welcomeSubtitle', e.target.value)} 
                className={`${iconInputClass} bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold`} 
              />
            </InputGroup>
            <InputGroup label={t('admin.general.footer', form)} icon="📜">
              <input 
                type="text" 
                value={form.printFooterText} 
                onChange={e => onChange('printFooterText', e.target.value)} 
                className={`${iconInputClass} bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold`} 
              />
            </InputGroup>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGeneralTab;
