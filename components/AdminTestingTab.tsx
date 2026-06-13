


import React, { useState } from 'react';
import { AppConfig, PhotoSettings, PhotoSize, BackgroundType, SkinToneType } from '../types';
import CameraCapture from './CameraCapture';
import ImageEditor from './ImageEditor';
import PrintPreview from './PrintPreview';

interface AdminTestingTabProps {
  form: AppConfig;
}

const SAMPLE_IMAGE = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop";

const AdminTestingTab: React.FC<AdminTestingTabProps> = ({ form }) => {
  const [testView, setTestView] = useState<'camera' | 'editor' | 'print' | null>(null);
  const [testSettings, setTestSettings] = useState<PhotoSettings>({
    size: PhotoSize.SIZE_4X6,
    background: BackgroundType.WHITE,
    printQuantity: 8,
    beauty: {
      smoothSkin: 0,
      blemishIntensity: 0,
      skinToneType: SkinToneType.NATURAL,
      skinToneIntensity: 0,
      lighting: 0,
      contrast: 0,
      lipstickColor: 'Đỏ',
      lipstickIntensity: 0,
      blushColor: 'Hồng Nhạt',
      blushIntensity: 0,
      eyebrowIntensity: 0,
      eyelashIntensity: 0,
      contourIntensity: 0,
      hairVolume: 0,
      makeupStyle: 'natural'
    }
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
           <span className="p-2 bg-brand-50 text-brand-600 rounded-lg text-lg">🧪</span>
           Kiểm tra hệ thống
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-2xl bg-slate-50 space-y-4 hover:shadow-md transition-shadow group">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">📷</div>
            <div>
               <h3 className="font-bold text-gray-800">Camera & AI Biometric</h3>
               <p className="text-xs text-gray-400 mt-1">Kiểm tra khả năng nhận diện mặt và hướng dẫn của AI.</p>
            </div>
            <button onClick={() => setTestView('camera')} className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition shadow-lg shadow-brand-500/20">Mở Camera Test</button>
          </div>
          <div className="p-6 border rounded-2xl bg-slate-50 space-y-4 hover:shadow-md transition-shadow group">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">✨</div>
            <div>
               <h3 className="font-bold text-gray-800">Trình biên tập AI</h3>
               <p className="text-xs text-gray-400 mt-1">Kiểm tra tính năng tách nền, thay áo và makeup AI.</p>
            </div>
            <button onClick={() => setTestView('editor')} className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-500/20">Mở Editor Test</button>
          </div>
          <div className="p-6 border rounded-2xl bg-slate-50 space-y-4 hover:shadow-md transition-shadow group">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">🖨️</div>
            <div>
               <h3 className="font-bold text-gray-800">In ấn & QR</h3>
               <p className="text-xs text-gray-400 mt-1">Kiểm tra dàn trang in 13x18 và tạo mã QR Cloud.</p>
            </div>
            <button onClick={() => setTestView('print')} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">Mở Print Test</button>
          </div>
        </div>
      </div>

      {testView && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fadeIn">
          {/* Enhanced Test Toolbar */}
          <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-[210] bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
             <div className="flex items-center gap-3 pointer-events-auto">
                <div className="bg-yellow-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg animate-pulse uppercase tracking-widest border border-white/20">
                   TESTING MODE
                </div>
                <div className="text-white/60 text-xs font-medium hidden md:block">
                   Đang kiểm tra: <span className="text-white font-bold">{testView.toUpperCase()}</span>
                </div>
             </div>
             
             <button 
                onClick={() => setTestView(null)} 
                className="group pointer-events-auto flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-xl active:scale-95 border border-red-400"
             >
                <span className="text-sm">Đóng Test</span>
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
             </button>
          </div>

          {/* Full Screen Content Area */}
          <div className="flex-1 w-full h-full">
            {testView === 'camera' && (
               <div className="w-full h-full flex items-center justify-center p-0">
                  <CameraCapture 
                     onCapture={() => alert('Đã chụp thành công trong chế độ Test!')} 
                     selectedSize={testSettings.size} 
                     onSizeChange={s => setTestSettings({...testSettings, size: s})} 
                  />
               </div>
            )}
            {testView === 'editor' && (
               <ImageEditor 
                  originalImage={SAMPLE_IMAGE} 
                  settings={testSettings} 
                  onUpdateSettings={setTestSettings} 
                  onProcessedImage={() => {}} 
                  onNext={() => {}} 
                  onRetake={() => setTestView('camera')} 
                  config={form} 
               />
            )}
            {testView === 'print' && (
               <PrintPreview 
                  processedImage={SAMPLE_IMAGE} 
                  size={testSettings.size} 
                  settings={testSettings} 
                  onBack={() => setTestView('editor')} 
                  onNew={() => setTestView(null)} 
                  onHome={() => setTestView(null)} 
                  config={form} 
               />
            )}
          </div>
          
          {/* Subtle instructions overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[210] pointer-events-none opacity-40">
             <p className="text-white text-[10px] uppercase tracking-[0.2em] font-light">Trình giả lập ID Photo Pro v2.5</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestingTab;
