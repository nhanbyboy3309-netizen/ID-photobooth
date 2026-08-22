
import React, { useState } from 'react';
import { AppConfig } from '../types';
import { InputGroup, baseInputClass } from './AdminShared';

interface AdminMakeupTabProps {
  form: AppConfig;
  setForm: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const AdminMakeupTab: React.FC<AdminMakeupTabProps> = ({ form, setForm }) => {
  const [showColorModal, setShowColorModal] = useState(false);
  const [colorContext, setColorContext] = useState<'lipstick' | 'blush' | 'hair'>('lipstick');
  const [editingColor, setEditingColor] = useState<any | null>(null);
  const [tempColor, setTempColor] = useState({ id: '', label: '', hex: '#000000' });

  const openAddColor = (context: 'lipstick' | 'blush' | 'hair') => {
    setColorContext(context);
    setEditingColor(null);
    setTempColor({ id: `col_${Date.now()}`, label: '', hex: '#ef4444' });
    setShowColorModal(true);
  };

  const openEditColor = (context: 'lipstick' | 'blush' | 'hair', item: any) => {
    setColorContext(context);
    setEditingColor(item);
    setTempColor({ ...item });
    setShowColorModal(true);
  };

  const saveColorItem = () => {
    const listKey = colorContext === 'lipstick' ? 'lipstickOptions' : colorContext === 'blush' ? 'blushOptions' : 'hairColorOptions';
    let newList = [...((form[listKey] || []) as any[])];
    if (editingColor) newList = newList.map(item => item.id === editingColor.id ? tempColor : item);
    else newList.push(tempColor);
    setForm(prev => ({ ...prev, [listKey]: newList }));
    setShowColorModal(false);
  };

  const deleteColorItem = (context: 'lipstick' | 'blush' | 'hair', id: string) => {
    if (confirm('Xóa màu làm đẹp này?')) {
      const listKey = context === 'lipstick' ? 'lipstickOptions' : context === 'blush' ? 'blushOptions' : 'hairColorOptions';
      setForm(prev => ({ ...prev, [listKey]: ((prev[listKey] || []) as any[]).filter(item => item.id !== id) }));
    }
  };

  const sections = [
    { id: 'lipstick', label: 'BẢNG MÀU MÔI (LIPSTICKS)', icon: '💄', list: form.lipstickOptions || [] },
    { id: 'blush', label: 'BẢNG MÀU MÁ HỒNG (BLUSH)', icon: '🌸', list: form.blushOptions || [] },
    { id: 'hair', label: 'BẢNG MÀU TÓC (HAIR COLORS)', icon: '💇', list: form.hairColorOptions || [] }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {sections.map(section => (
        <div key={section.id} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
           <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                  <span className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-lg flex items-center justify-center text-sm">{section.icon}</span>
                  {section.label}
              </h3>
              <button 
                onClick={() => openAddColor(section.id as any)} 
                className="text-[10px] font-black bg-brand-600 text-white px-5 py-2.5 rounded-xl uppercase tracking-widest shadow-xl shadow-brand-500/30 hover:bg-brand-700 transition-all active:scale-95"
              >
                + Thêm màu
              </button>
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {section.list.map((item: any) => (
                 <div key={item.id} className="group relative p-4 border-2 border-gray-50 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center gap-3 hover:border-brand-400 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300">
                    <div className="w-12 h-12 rounded-full border-4 border-white dark:border-gray-700 shadow-lg" style={{ backgroundColor: item.hex === 'transparent' ? '#ccc' : item.hex }}>
                        {item.id === 'original' && <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-500 uppercase">ORIG</div>}
                    </div>
                    <span className="text-[11px] font-black text-gray-800 dark:text-gray-300 truncate w-full text-center uppercase tracking-tight">{item.label}</span>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => openEditColor(section.id as any, item)} className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow-md text-blue-500 hover:text-blue-700 border border-gray-100 dark:border-gray-600">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                       </button>
                       <button onClick={() => deleteColorItem(section.id as any, item.id)} className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow-md text-red-500 hover:text-red-700 border border-gray-100 dark:border-gray-600">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                       </button>
                    </div>
                 </div>
              ))}
              
              {section.list.length === 0 && (
                  <div className="col-span-full py-10 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Danh sách trống</p>
                  </div>
              )}
           </div>
        </div>
      ))}

      {showColorModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-fadeIn">
           <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 w-full max-w-sm shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10">
              <h3 className="text-xl font-black mb-10 text-gray-900 dark:text-white uppercase tracking-widest text-center">
                  {editingColor ? 'Sửa' : 'Thêm'} màu sắc mới
              </h3>
              <div className="space-y-8">
                 <InputGroup label="Tên nhãn màu sắc" icon="🏷️">
                    <input type="text" className={`${baseInputClass} bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold pl-12`} value={tempColor.label} onChange={e => setTempColor({...tempColor, label: e.target.value})} placeholder="VD: Hồng Cam" />
                 </InputGroup>
                 
                 <div className="flex flex-col items-center gap-4">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">CHỌN MÀU TỪ BẢNG</label>
                    <input 
                        type="color" 
                        className="w-24 h-24 p-1 rounded-full bg-white dark:bg-gray-700 shadow-xl cursor-pointer border-4 border-white dark:border-gray-600" 
                        value={tempColor.hex} 
                        onChange={e => setTempColor({...tempColor, hex: e.target.value})} 
                    />
                 </div>

                 <InputGroup label="Mã màu HEX" icon="#️⃣">
                    <input type="text" className={`${baseInputClass} bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold pl-12 text-center`} value={tempColor.hex} onChange={e => setTempColor({...tempColor, hex: e.target.value})} placeholder="#FF0000" />
                 </InputGroup>
              </div>
              
              <div className="flex justify-between gap-4 mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                 <button onClick={() => setShowColorModal(false)} className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Hủy</button>
                 <button onClick={saveColorItem} className="px-10 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl shadow-brand-500/30 uppercase tracking-widest transition-all active:scale-95">Xác nhận lưu</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminMakeupTab;
