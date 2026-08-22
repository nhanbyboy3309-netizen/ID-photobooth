
import React, { useState } from 'react';
import { AppConfig, ClothingItem } from '../types';
import { InputGroup, baseInputClass } from './AdminShared';

interface AdminClothingTabProps {
  form: AppConfig;
  setForm: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const AdminClothingTab: React.FC<AdminClothingTabProps> = ({ form, setForm }) => {
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [showClothingModal, setShowClothingModal] = useState(false);
  const [tempClothing, setTempClothing] = useState<ClothingItem>({
    id: '', label: '', gender: 'male', icon: '👔', prompt: '', color: 'border-gray-300'
  });

  const clothingOptions = form.clothingOptions || [];

  const openAddClothing = () => {
    setEditingItem(null);
    setTempClothing({ id: `custom_${Date.now()}`, label: '', gender: 'male', icon: '👔', prompt: '', color: 'border-blue-500' });
    setShowClothingModal(true);
  };

  const openEditClothing = (item: ClothingItem) => {
    setEditingItem(item);
    setTempClothing({ ...item });
    setShowClothingModal(true);
  };

  const saveClothingItem = () => {
    let newOptions = [...clothingOptions];
    if (editingItem) newOptions = newOptions.map(item => item.id === editingItem.id ? tempClothing : item);
    else newOptions.push(tempClothing);
    setForm(prev => ({ ...prev, clothingOptions: newOptions }));
    setShowClothingModal(false);
  };

  const deleteClothingItem = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa trang phục này?')) {
      setForm(prev => ({ ...prev, clothingOptions: clothingOptions.filter(item => item.id !== id) }));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Thư viện Trang phục AI</h2>
        <button 
            onClick={openAddClothing} 
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-500/30 transition-all active:scale-95"
        >
            + Thêm trang phục
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {['male', 'female'].map(gender => (
          <div key={gender} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="font-black mb-6 uppercase text-[10px] tracking-[0.3em] text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 pb-3">
                {gender === 'male' ? 'DANH MỤC NAM 👔' : 'DANH MỤC NỮ 👚'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clothingOptions.filter(c => c.gender === gender).map(item => (
                <div key={item.id} className="group p-4 border-2 border-gray-50 dark:border-gray-800 rounded-2xl flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:border-brand-400 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{item.icon}</span>
                    <div className="leading-tight">
                        <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.label}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase truncate max-w-[120px]">{item.prompt}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditClothing(item)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => deleteClothingItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
              
              {clothingOptions.filter(c => c.gender === gender).length === 0 && (
                  <div className="col-span-full py-6 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                      Chưa có dữ liệu
                  </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showClothingModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-fadeIn">
           <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 w-full max-w-xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10">
              <h3 className="text-2xl font-black mb-8 text-gray-900 dark:text-white uppercase tracking-tight text-center">
                  {editingItem ? 'Sửa' : 'Thêm'} trang phục mới
              </h3>
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <InputGroup label="Tên nhãn hiển thị" icon="🏷️">
                        <input type="text" className={`${baseInputClass} bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold pl-12`} value={tempClothing.label} onChange={e => setTempClothing({...tempClothing, label: e.target.value})} placeholder="VD: Vest Đen" />
                    </InputGroup>
                    <InputGroup label="Biểu tượng (Emoji)" icon="🎨">
                        <input type="text" className={`${baseInputClass} bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold pl-12`} value={tempClothing.icon} onChange={e => setTempClothing({...tempClothing, icon: e.target.value})} placeholder="🕴️" />
                    </InputGroup>
                 </div>

                 <InputGroup label="Prompt AI (Mô tả chi tiết bằng Tiếng Anh)" icon="🤖">
                    <textarea 
                        className={`${baseInputClass} h-32 bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold pl-12 p-6 leading-relaxed`} 
                        value={tempClothing.prompt} 
                        onChange={e => setTempClothing({...tempClothing, prompt: e.target.value})} 
                        placeholder="VD: wearing a formal black business suit with white shirt and tie"
                    />
                 </InputGroup>

                 <InputGroup label="Giới tính mục tiêu" icon="🚻">
                    <select 
                        value={tempClothing.gender} 
                        onChange={e => setTempClothing({...tempClothing, gender: e.target.value as any})} 
                        className={`${baseInputClass} bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold pl-12 appearance-none`}
                    >
                       <option value="male">NAM GIỚI (MALE)</option>
                       <option value="female">NỮ GIỚI (FEMALE)</option>
                    </select>
                 </InputGroup>
              </div>
              
              <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
                 <button onClick={() => setShowClothingModal(false)} className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Hủy bỏ</button>
                 <button onClick={saveClothingItem} className="px-10 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl shadow-brand-500/30 uppercase tracking-widest transition-all active:scale-95">Lưu trang phục</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminClothingTab;
