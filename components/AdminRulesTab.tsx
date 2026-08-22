
import React from 'react';
import { AppConfig, PhotoSize } from '../types';
import { baseInputClass } from './AdminShared';

interface AdminRulesTabProps {
  form: AppConfig;
  setForm: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const AdminRulesTab: React.FC<AdminRulesTabProps> = ({ form, setForm }) => {
  const photoRules = form.photoRules || {};

  const handleRuleChange = (size: string, index: number, value: string) => {
    const newRules = { ...photoRules };
    if (!newRules[size]) newRules[size] = [];
    newRules[size][index] = value;
    setForm(prev => ({ ...prev, photoRules: newRules }));
  };

  const addRule = (size: string) => {
    const newRules = { ...photoRules };
    newRules[size] = [...(newRules[size] || []), 'Nhập quy định mới...'];
    setForm(prev => ({ ...prev, photoRules: newRules }));
  };

  const removeRule = (size: string, index: number) => {
    const newRules = { ...photoRules };
    if (newRules[size]) {
      const updatedList = [...newRules[size]];
      updatedList.splice(index, 1);
      newRules[size] = updatedList;
      setForm(prev => ({ ...prev, photoRules: newRules }));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {Object.values(PhotoSize).map(size => (
        <div key={size} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center text-sm">📏</span>
                QUY ĐỊNH ẢNH {size}
            </h3>
            <button 
                onClick={() => addRule(size)} 
                className="text-[10px] font-black bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all shadow-sm active:scale-95 border border-brand-200 dark:border-brand-800"
            >
                + Thêm mục mới
            </button>
          </div>
          
          <div className="space-y-4">
            {(photoRules[size] || []).map((rule, idx) => (
              <div key={idx} className="flex gap-4 items-center group">
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 text-[10px] font-black text-gray-400 dark:text-gray-500 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700">
                    {idx + 1}
                </div>
                <input 
                  type="text" 
                  value={rule} 
                  onChange={(e) => handleRuleChange(size, idx, e.target.value)} 
                  className={`${baseInputClass} text-sm py-3 bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold group-hover:border-brand-300 dark:group-hover:border-brand-800`} 
                />
                <button 
                    onClick={() => removeRule(size, idx)} 
                    className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0 opacity-40 group-hover:opacity-100"
                    title="Xóa mục này"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            ))}
            
            {(!photoRules || !photoRules[size] || photoRules[size].length === 0) && (
                <div className="py-10 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chưa có quy định nào được thiết lập</p>
                </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminRulesTab;
