
import React, { useState } from 'react';
import { AppConfig, BackgroundConfigItem, BackgroundType } from '../types';
import { InputGroup, baseInputClass } from './AdminShared';

interface AdminBackgroundTabProps {
  form: AppConfig;
  setForm: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const AdminBackgroundTab: React.FC<AdminBackgroundTabProps> = ({ form, setForm }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BackgroundConfigItem | null>(null);
  
  // Temporary state for the modal form
  const [tempBg, setTempBg] = useState<BackgroundConfigItem>({
    type: BackgroundType.WHITE,
    label: '',
    hexColor: '#ffffff'
  });

  const openAddModal = () => {
    setEditingItem(null);
    setTempBg({
      id: `bg_${Date.now()}`,
      type: BackgroundType.WHITE,
      label: '',
      hexColor: '#ffffff'
    });
    setShowModal(true);
  };

  const openEditModal = (item: BackgroundConfigItem) => {
    setEditingItem(item);
    setTempBg({ ...item });
    setShowModal(true);
  };

  const saveItem = () => {
    let newOptions = [...(form.backgroundConfig || [])];
    if (editingItem) {
        // Find by object reference or id if available, since id is optional, using map + reference check is safer if no id
        const idx = newOptions.findIndex(i => i === editingItem || (i.id && i.id === editingItem.id));
        if (idx >= 0) newOptions[idx] = tempBg;
    } else {
        newOptions.push(tempBg);
    }
    setForm(prev => ({ ...prev, backgroundConfig: newOptions }));
    setShowModal(false);
  };

  const deleteItem = (item: BackgroundConfigItem) => {
    if (confirm('Bạn có chắc muốn xóa phông nền này?')) {
       // Filter out by reference
       const newOptions = (form.backgroundConfig || []).filter(i => i !== item);
       setForm(prev => ({ ...prev, backgroundConfig: newOptions }));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Thư viện Phông nền</h2>
        <button 
            onClick={openAddModal} 
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-500/30 transition-all active:scale-95"
        >
            + Thêm phông nền
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {(form.backgroundConfig || []).map((bg, index) => (
           <div key={index} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center gap-4 hover:shadow-md transition-all">
              <div 
                className="w-full h-24 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700" 
                style={{ backgroundColor: bg.hexColor }} 
              />
              <div className="text-center w-full">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{bg.label}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{bg.hexColor}</span>
                      <span className="text-[9px] font-bold text-gray-400 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded uppercase">{bg.type}</span>
                  </div>
              </div>
              <div className="flex gap-2 w-full mt-2">
                  <button onClick={() => openEditModal(bg)} className="flex-1 py-2 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl transition-colors">Sửa</button>
                  <button onClick={() => deleteItem(bg)} className="flex-1 py-2 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-xl transition-colors">Xóa</button>
              </div>
           </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-fadeIn">
           <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 w-full max-w-sm shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10">
              <h3 className="text-xl font-black mb-8 text-gray-900 dark:text-white uppercase tracking-widest text-center">
                  {editingItem ? 'Sửa' : 'Thêm'} phông nền
              </h3>
              
              <div className="space-y-6">
                 <InputGroup label="Tên hiển thị" icon="🏷️">
                    <input 
                        type="text" 
                        className={`${baseInputClass} bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold pl-12`} 
                        value={tempBg.label} 
                        onChange={e => setTempBg({...tempBg, label: e.target.value})} 
                        placeholder="VD: Xanh Dương Đậm" 
                    />
                 </InputGroup>

                 <div className="flex flex-col items-center gap-4">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">MÀU SẮC (HEX)</label>
                    <div className="flex gap-4 items-center">
                        <input 
                            type="color" 
                            className="w-16 h-16 p-1 rounded-full bg-white dark:bg-gray-700 shadow-lg cursor-pointer border-4 border-white dark:border-gray-600" 
                            value={tempBg.hexColor} 
                            onChange={e => setTempBg({...tempBg, hexColor: e.target.value})} 
                        />
                        <input 
                            type="text" 
                            className={`${baseInputClass} w-32 text-center text-sm`} 
                            value={tempBg.hexColor} 
                            onChange={e => setTempBg({...tempBg, hexColor: e.target.value})} 
                        />
                    </div>
                 </div>

                 <InputGroup label="Loại (Quy định kích thước/AI)" icon="📐">
                    <select 
                        value={tempBg.type} 
                        onChange={e => setTempBg({...tempBg, type: e.target.value as BackgroundType})} 
                        className={`${baseInputClass} bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold pl-12 appearance-none`}
                    >
                       <option value={BackgroundType.WHITE}>Trắng (White)</option>
                       <option value={BackgroundType.BLUE}>Xanh (Blue)</option>
                       <option value={BackgroundType.GRAY}>Xám (Gray)</option>
                    </select>
                 </InputGroup>
              </div>
              
              <div className="flex justify-between gap-4 mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
                 <button onClick={() => setShowModal(false)} className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Hủy</button>
                 <button onClick={saveItem} className="px-10 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl shadow-brand-500/30 uppercase tracking-widest transition-all active:scale-95">Lưu</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminBackgroundTab;
