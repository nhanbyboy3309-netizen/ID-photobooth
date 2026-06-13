
import React from 'react';
import { AppConfig } from '../types';
import { COLORS } from './AdminShared';
import { t } from '../services/i18n';

interface AdminDesignTabProps {
  form: AppConfig;
  onChange: (field: keyof AppConfig, value: any) => void;
}

const AdminDesignTab: React.FC<AdminDesignTabProps> = ({ form, onChange }) => (
  <div className="space-y-6 animate-fadeIn">
      {/* Brand Colors */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">{t('admin.design.colors', form)}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {COLORS.map(color => (
            <button 
              key={color.hex} 
              onClick={() => onChange('themeColorHex', color.hex)} 
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all active:scale-95 ${
                form.themeColorHex === color.hex 
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-lg' 
                : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:border-brand-300'
              }`}
            >
              <div className="w-12 h-12 rounded-full ring-4 ring-white dark:ring-gray-700 shadow-md" style={{ backgroundColor: color.hex }}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${form.themeColorHex === color.hex ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500'}`}>
                {color.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Mode Selection */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">{t('admin.design.theme', form)}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[
             { id: 'light', label: t('theme.light', form), icon: '☀️', desc: 'Giao diện sáng mặc định' },
             { id: 'dark', label: t('theme.dark', form), icon: '🌙', desc: 'Giao diện tối (Dark Mode)' },
             { id: 'system', label: t('theme.system', form), icon: '⚙️', desc: 'Theo cài đặt thiết bị' }
           ].map(mode => (
             <button 
                key={mode.id}
                onClick={() => onChange('themeMode', mode.id)}
                className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 active:scale-95 ${
                    form.themeMode === mode.id 
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md' 
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:border-brand-200'
                }`}
             >
                <span className="text-3xl">{mode.icon}</span>
                <div>
                   <div className={`font-black text-sm uppercase tracking-tight ${form.themeMode === mode.id ? 'text-brand-700 dark:text-brand-400' : 'text-gray-900 dark:text-gray-300'}`}>{mode.label}</div>
                   <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1">{mode.desc}</div>
                </div>
                {form.themeMode === mode.id && (
                    <div className="ml-auto bg-brand-500 text-white p-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg>
                    </div>
                )}
             </button>
           ))}
        </div>
      </div>
  </div>
);

export default AdminDesignTab;
