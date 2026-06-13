
import React, { useRef } from 'react';
import { AppConfig } from '../types';
import { InputGroup, iconInputClass, baseInputClass } from './AdminShared';

interface AdminCustomTabProps {
  form: AppConfig;
  onChange: (field: keyof AppConfig, value: any) => void;
}

const AdminCustomTab: React.FC<AdminCustomTabProps> = ({ form, onChange }) => {
  const adImageInputRef = useRef<HTMLInputElement>(null);

  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert("Ảnh quá lớn (Tối đa 2MB)!"); return; }
      const reader = new FileReader();
      reader.onloadend = () => onChange('customContentImageUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-gray-800 pb-4 flex items-center gap-3">
            <span className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl">📢</span>
            BANNER QUẢNG CÁO (START SCREEN)
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-3 text-center lg:text-left">ẢNH BANNER HIỂN THỊ</label>
            <div 
                className="group relative w-full aspect-video border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 overflow-hidden cursor-pointer hover:border-brand-500 hover:bg-brand-50/30 transition-all duration-300 shadow-inner" 
                onClick={() => adImageInputRef.current?.click()}
            >
              {form.customContentImageUrl ? (
                <>
                    <img src={form.customContentImageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Banner" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="px-4 py-2 bg-white text-black text-xs font-black rounded-full uppercase tracking-widest shadow-xl">Thay đổi ảnh</span>
                    </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <span className="text-5xl mb-4 block animate-bounce">🖼️</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Kéo thả hoặc nhấn để chọn ảnh</span>
                  <p className="text-[10px] text-gray-400 mt-2">Đề xuất: 1200x600px (PNG/JPG)</p>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" ref={adImageInputRef} onChange={handleAdImageUpload} className="hidden" />
            {form.customContentImageUrl && (
                <div className="flex justify-center mt-4">
                    <button onClick={() => onChange('customContentImageUrl', '')} className="text-[10px] font-black text-red-500 uppercase hover:underline tracking-widest bg-red-50 dark:bg-red-900/20 px-4 py-1.5 rounded-full">Gỡ ảnh hiện tại</button>
                </div>
            )}
          </div>
          
          <div className="space-y-6">
            <InputGroup label="Link liên kết khi nhấn" icon="🔗">
              <input 
                type="text" 
                value={form.customContentLinkUrl || ''} 
                onChange={e => onChange('customContentLinkUrl', e.target.value)} 
                className={`${iconInputClass} bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold`} 
                placeholder="https://facebook.com/shop..."
              />
            </InputGroup>
            
            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 leading-relaxed">
                    💡 <b>Mẹo:</b> Sử dụng ảnh banner đẹp mắt để thu hút khách hàng xem các chương trình khuyến mãi ngay khi họ vừa chạm vào màn hình.
                </p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">NỘI DUNG VĂN BẢN (HTML)</h3>
        <div className="relative">
            <textarea 
                value={form.customContentHtml || ''} 
                onChange={e => onChange('customContentHtml', e.target.value)} 
                className={`${baseInputClass} h-40 font-mono text-xs bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-6 leading-relaxed`} 
                placeholder="Nhập nội dung HTML của bạn tại đây..."
            />
            <div className="absolute bottom-4 right-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white dark:bg-gray-900 px-2 py-1 rounded shadow-sm">HTML Editor</div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomTab;
