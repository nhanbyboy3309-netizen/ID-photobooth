
import React, { useState } from 'react';
import { AppConfig, HairStyleOption } from '../types';
import { InputGroup, baseInputClass } from './AdminShared';
import { getHairStyles } from '../services/hairStyles';

interface AdminHairStyleTabProps {
  form: AppConfig;
  setForm: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const AdminHairStyleTab: React.FC<AdminHairStyleTabProps> = ({ form, setForm }) => {
  const [editingItem, setEditingItem] = useState<HairStyleOption | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [tempStyle, setTempStyle] = useState<HairStyleOption>({ id: '', label: '', gender: 'male', prompt: '' });

  const hairStyles = getHairStyles(form);
  const canSave = tempStyle.label.trim() !== '' && tempStyle.prompt.trim() !== '';

  const openAdd = () => {
    setEditingItem(null);
    setTempStyle({ id: `hair_${Date.now()}`, label: '', gender: 'male', prompt: '' });
    setShowModal(true);
  };

  const openEdit = (item: HairStyleOption) => {
    setEditingItem(item);
    setTempStyle({ ...item });
    setShowModal(true);
  };

  const saveItem = () => {
    if (!canSave) return;
    const cleaned = { ...tempStyle, label: tempStyle.label.trim(), prompt: tempStyle.prompt.trim() };
    const next = editingItem
      ? hairStyles.map(item => item.id === editingItem.id ? cleaned : item)
      : [...hairStyles, cleaned];
    setForm(prev => ({ ...prev, hairStyleOptions: next }));
    setShowModal(false);
  };

  const deleteItem = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa kiểu tóc này?')) {
      setForm(prev => ({ ...prev, hairStyleOptions: hairStyles.filter(item => item.id !== id) }));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Thư viện Kiểu tóc AI</h2>
          <p className="text-[10px] text-gray-400 font-bold mt-1">Bấm "Lưu" ở cuối trang để áp dụng thay đổi.</p>
        </div>
        <button
            onClick={openAdd}
            className="shrink-0 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-500/30 transition-all active:scale-95"
        >
            + Thêm kiểu tóc
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {(['male', 'female'] as const).map(gender => (
          <div key={gender} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="font-black mb-6 uppercase text-[10px] tracking-[0.3em] text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 pb-3">
                {gender === 'male' ? 'KIỂU TÓC NAM 💇‍♂️' : 'KIỂU TÓC NỮ 💇‍♀️'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hairStyles.filter(s => s.gender === gender).map(item => (
                <div key={item.id} className="group p-4 border-2 border-gray-50 dark:border-gray-800 rounded-2xl flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/50 hover:border-brand-400 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300">
                  <div className="leading-tight min-w-0">
                    <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.label}</div>
                    <div className="text-[10px] text-gray-400 font-bold line-clamp-2">{item.prompt}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(item)} aria-label="Sửa" className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => deleteItem(item.id)} aria-label="Xóa" className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              ))}

              {hairStyles.filter(s => s.gender === gender).length === 0 && (
                  <div className="col-span-full py-6 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                      Chưa có dữ liệu
                  </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-fadeIn">
           <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 w-full max-w-xl max-h-full overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10">
              <h3 className="text-2xl font-black mb-8 text-gray-900 dark:text-white uppercase tracking-tight text-center">
                  {editingItem ? 'Sửa' : 'Thêm'} kiểu tóc
              </h3>
              <div className="space-y-6">
                 <InputGroup label="Tên kiểu tóc hiển thị" icon="🏷️">
                    <input type="text" className={`${baseInputClass} bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold pl-12`} value={tempStyle.label} onChange={e => setTempStyle({ ...tempStyle, label: e.target.value })} placeholder="VD: Rẽ ngôi lệch" />
                 </InputGroup>

                 <InputGroup label="Mô tả kiểu tóc cho AI (nên viết Tiếng Anh)" icon="🤖">
                    <textarea
                        className={`${baseInputClass} h-32 bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold pl-12 p-6 leading-relaxed`}
                        value={tempStyle.prompt}
                        onChange={e => setTempStyle({ ...tempStyle, prompt: e.target.value })}
                        placeholder="VD: a classic short side-part haircut, neatly combed to one side"
                    />
                 </InputGroup>
                 <p className="text-[10px] text-gray-400 font-bold -mt-3">
                    Chỉ mô tả kiểu tóc (độ dài, ngôi, cách chải). Màu tóc và đường chân tóc được giữ tự động; không cần nhắc tới khuôn mặt.
                 </p>

                 <InputGroup label="Giới tính" icon="🚻">
                    <select
                        value={tempStyle.gender}
                        onChange={e => setTempStyle({ ...tempStyle, gender: e.target.value as 'male' | 'female' })}
                        className={`${baseInputClass} bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold pl-12 appearance-none`}
                    >
                       <option value="male">NAM GIỚI (MALE)</option>
                       <option value="female">NỮ GIỚI (FEMALE)</option>
                    </select>
                 </InputGroup>
              </div>

              <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
                 <button onClick={() => setShowModal(false)} className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Hủy bỏ</button>
                 <button onClick={saveItem} disabled={!canSave} className="px-10 py-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-xl shadow-brand-500/30 uppercase tracking-widest transition-all active:scale-95">Lưu kiểu tóc</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminHairStyleTab;
