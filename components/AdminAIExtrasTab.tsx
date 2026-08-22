
import React, { useState } from 'react';
import { AppConfig } from '../types';
import AdminClothingTab from './AdminClothingTab';
import AdminMakeupTab from './AdminMakeupTab';
import AdminBackgroundTab from './AdminBackgroundTab';
import AdminAIModelTab from './AdminAIModelTab';
import { t } from '../services/i18n';

interface AdminAIExtrasTabProps {
  form: AppConfig;
  setForm: React.Dispatch<React.SetStateAction<AppConfig>>;
}

type SubTab = 'models' | 'clothing' | 'makeup' | 'background';

const AdminAIExtrasTab: React.FC<AdminAIExtrasTabProps> = ({ form, setForm }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('models');

  const subTabs = [
    { id: 'models', label: 'Cấu hình AI Model', icon: '🤖' },
    { id: 'clothing', label: t('admin.sub.clothing', form), icon: '👔' },
    { id: 'makeup', label: t('admin.sub.makeup', form), icon: '💄' },
    { id: 'background', label: t('admin.sub.background', form), icon: '🖼️' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub-navigation inside the AI Extras Tab */}
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
        {activeSubTab === 'models' && <AdminAIModelTab form={form} setForm={setForm} />}
        {activeSubTab === 'clothing' && <AdminClothingTab form={form} setForm={setForm} />}
        {activeSubTab === 'makeup' && <AdminMakeupTab form={form} setForm={setForm} />}
        {activeSubTab === 'background' && <AdminBackgroundTab form={form} setForm={setForm} />}
      </div>
    </div>
  );
};

export default AdminAIExtrasTab;
