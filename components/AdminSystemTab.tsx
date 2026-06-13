
import React, { useState } from 'react';
import { AppConfig } from '../types';
import AdminGeneralTab from './AdminGeneralTab';
import AdminDesignTab from './AdminDesignTab';
import AdminCustomTab from './AdminCustomTab';
import AdminRulesTab from './AdminRulesTab';
import AdminTestingTab from './AdminTestingTab';
import { t } from '../services/i18n';

interface AdminSystemTabProps {
  form: AppConfig;
  setForm: React.Dispatch<React.SetStateAction<AppConfig>>;
  onChange: (field: keyof AppConfig, value: any) => void;
}

type SubTab = 'general' | 'design' | 'custom' | 'rules' | 'testing';

const AdminSystemTab: React.FC<AdminSystemTabProps> = ({ form, setForm, onChange }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('general');

  const subTabs = [
    { id: 'general', label: t('admin.sub.general', form), icon: '🏢' },
    { id: 'design', label: t('admin.sub.design', form), icon: '🎨' },
    { id: 'custom', label: t('admin.sub.custom', form), icon: '📢' },
    { id: 'rules', label: t('admin.sub.rules', form), icon: '📋' },
    { id: 'testing', label: t('admin.sub.testing', form), icon: '🧪' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub-navigation inside the System Tab */}
      <div className="flex bg-white dark:bg-gray-900 p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-hide">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as SubTab)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 whitespace-nowrap ${
              activeSubTab === tab.id 
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeSubTab === 'general' && <AdminGeneralTab form={form} onChange={onChange} />}
        {activeSubTab === 'design' && <AdminDesignTab form={form} onChange={onChange} />}
        {activeSubTab === 'custom' && <AdminCustomTab form={form} onChange={onChange} />}
        {activeSubTab === 'rules' && <AdminRulesTab form={form} setForm={setForm} />}
        {activeSubTab === 'testing' && <AdminTestingTab form={form} />}
      </div>
    </div>
  );
};

export default AdminSystemTab;
