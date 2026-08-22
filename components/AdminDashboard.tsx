
import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { saveConfig, applyTheme } from '../services/configService';
import { saveAppConfigToCloud } from '../services/databaseService';
import { t } from '../services/i18n';

// Import split tab components
import AdminSystemTab from './AdminSystemTab';
import AdminAIExtrasTab from './AdminAIExtrasTab';
import AdminSecurityTab from './AdminSecurityTab';

interface AdminDashboardProps {
  currentConfig: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentConfig, onUpdateConfig, onExit }) => {
  const [form, setForm] = useState<AppConfig>(currentConfig);
  const [activeTab, setActiveTab] = useState<'system' | 'ai_beauty' | 'security'>('system');
  const [saveStatus, setSaveStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    applyTheme(form.themeColorHex);
  }, [form.themeColorHex]);

  const handleChange = (field: keyof AppConfig, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSyncing(true);
    setSaveStatus(t('status.syncing', form));
    
    if (!form.googleScriptUrl || !form.googleScriptUrl.startsWith('https://script.google.com')) {
        setIsSyncing(false);
        setSaveStatus('Lỗi URL');
        alert("Lỗi: URL Google Script không hợp lệ.");
        return;
    }

    saveConfig(form);
    onUpdateConfig(form);

    try {
        const success = await saveAppConfigToCloud(form);
        if (success) setSaveStatus('✔ OK');
        else {
            setSaveStatus('⚠️ Local OK');
        }
    } catch (e) {
        setSaveStatus('❌ Error');
    } finally {
        setIsSyncing(false);
        setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-black flex flex-col font-sans overflow-hidden">
      <header className="flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center shadow-sm z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-brand-500/30">A</div>
          <div className="leading-tight">
            <h1 className="font-black text-gray-900 dark:text-white text-lg tracking-tight uppercase">{t('admin.header', form)}</h1>
            <p className="text-[10px] text-brand-600 dark:text-brand-400 font-black uppercase tracking-[0.2em]">ID Photo Pro Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-[10px] font-black transition-all px-3 py-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 uppercase tracking-widest ${saveStatus ? 'opacity-100' : 'opacity-0'}`}>{saveStatus}</span>
          <button onClick={onExit} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 border border-gray-200 dark:border-gray-700 shadow-sm uppercase tracking-wider active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> 
            <span>{t('btn.exit', form)}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className="w-20 lg:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 space-y-3 shrink-0 overflow-y-auto z-20">
          {[
            { id: 'system', label: t('admin.tab.system', form), icon: '⚙️', desc: t('admin.tab.system.desc', form) },
            { id: 'ai_beauty', label: t('admin.tab.ai_beauty', form), icon: '✨', desc: t('admin.tab.ai_beauty.desc', form) },
            { id: 'security', label: t('admin.tab.security', form), icon: '🔒', desc: t('admin.tab.security.desc', form) }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`w-full flex flex-col lg:flex-row items-center gap-4 px-4 py-4 rounded-3xl font-black transition-all duration-300 text-left relative overflow-hidden ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-xl shadow-brand-500/30' 
                    : 'bg-transparent text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className={`text-2xl transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>{tab.icon}</span> 
                <div className="hidden lg:block">
                  <div className="text-sm uppercase tracking-tight">{tab.label}</div>
                  <div className={`text-[10px] font-bold opacity-60 truncate ${isActive ? 'text-white' : ''}`}>{tab.desc}</div>
                </div>
                {isActive && <div className="absolute top-0 right-0 w-1.5 h-full bg-white/20" />}
              </button>
            )
          })}
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black scrollbar-hide">
          <div className="max-w-4xl mx-auto p-6 lg:p-10 pb-40">
            <div className="animate-fadeIn">
                {activeTab === 'system' && (
                  <AdminSystemTab 
                    form={form} 
                    setForm={setForm} 
                    onChange={handleChange} 
                  />
                )}
                {activeTab === 'ai_beauty' && (
                  <AdminAIExtrasTab 
                    form={form} 
                    setForm={setForm} 
                  />
                )}
                {activeTab === 'security' && <AdminSecurityTab form={form} onChange={handleChange} />}
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-4 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className={`w-2.5 h-2.5 rounded-full ${isSyncing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">{isSyncing ? t('status.syncing', form) : t('status.ready', form)}</span>
               <span className="text-[9px] text-gray-400 font-bold">Version 2.5.2</span>
             </div>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSyncing} 
            className={`px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-3 ${
                isSyncing 
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/40 hover:-translate-y-0.5'
            }`}
          >
            {isSyncing ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V4a1 1 0 10-2 0v7.586l-1.293-1.293z"></path><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"></path></svg>
            )}
            {isSyncing ? t('status.saving', form) : t('btn.save', form)}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
