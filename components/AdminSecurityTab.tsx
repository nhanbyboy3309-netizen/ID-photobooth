
import React from 'react';
import { AppConfig } from '../types';
import { InputGroup, iconInputClass } from './AdminShared';
import { t } from '../services/i18n';

interface AdminSecurityTabProps {
  form: AppConfig;
  onChange: (field: keyof AppConfig, value: any) => void;
}

const AdminSecurityTab: React.FC<AdminSecurityTabProps> = ({ form, onChange }) => (
  <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-gray-800 animate-fadeIn">
    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-gray-800 pb-4 uppercase tracking-tight flex items-center gap-3">
        <span className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl">🔒</span>
        {t('admin.security.password', form)}
    </h2>
    <div className="max-w-md space-y-6">
      <InputGroup label={t('admin.security.new_pass', form)} icon="🔑">
        <input 
          type="text" 
          value={form.adminPassword || ''} 
          onChange={e => onChange('adminPassword', e.target.value)} 
          className={`${iconInputClass} bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold`} 
          placeholder="••••••••"
        />
      </InputGroup>
      
      <div className="p-5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 flex gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">{t('admin.security.warning', form)}</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">{t('admin.security.warning_text', form)}</p>
          </div>
      </div>
      
      <div className="pt-4">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] italic opacity-60">ID Photo Pro Security Engine</p>
      </div>
    </div>
  </div>
);

export default AdminSecurityTab;
