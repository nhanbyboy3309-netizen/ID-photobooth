import React from 'react';
import { AppConfig, AIModelType, AIModelSelectionMode } from '../types';

interface AdminAIModelTabProps {
  form: AppConfig;
  setForm: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const AdminAIModelTab: React.FC<AdminAIModelTabProps> = ({ form, setForm }) => {
  const currentMode: AIModelSelectionMode = form.aiModelMode || 'auto';
  const manualModel: AIModelType = form.aiManualModel || 'gemini-3.1-flash-image';
  const simpleModel: AIModelType = form.aiSimpleModel || 'gemini-3.1-flash-image';
  const complexModel: AIModelType = form.aiComplexModel || 'gemini-3-pro-image';

  const updateConfig = (key: keyof AppConfig, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 animate-fadeIn text-gray-900 dark:text-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/20">
              Cấu hình AI Studio Engine
            </span>
            <span className="px-3 py-1 bg-emerald-400/30 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Dual-Model Active
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Hệ thống xử lý song song 2 Model AI</h2>
          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
            Tự động chuyển đổi giữa <strong className="text-white">gemini-3.1-flash-image</strong> (mặc định cho xử lý phông nền, màu sắc) và <strong className="text-white">gemini-3-pro-image</strong> (cho xử lý trang phục, trang điểm & chi tiết phức tạp). Admin có thể chọn chế độ tự động thông minh hoặc gán cố định thủ công.
          </p>
        </div>
      </div>

      {/* Mode Selection Cards */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <span>⚙️</span> Chế độ điều phối AI Model
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Chọn cách hệ thống quyết định sử dụng Model AI khi người dùng chỉnh sửa ảnh
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AUTO MODE OPTION */}
          <button
            type="button"
            onClick={() => updateConfig('aiModelMode', 'auto')}
            className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden ${
              currentMode === 'auto'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 shadow-lg shadow-brand-500/10 scale-[1.01]'
                : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:border-brand-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                ⚡
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                currentMode === 'auto' 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {currentMode === 'auto' ? 'Đang kích hoạt' : 'Chọn chế độ này'}
              </span>
            </div>
            <h4 className="font-black text-base text-gray-900 dark:text-white uppercase tracking-tight mb-1">
              1. Chuyển đổi Tự động (AUTO)
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              Hệ thống tự động phát hiện loại tác vụ để sử dụng model tối ưu nhất. Giúp tối đa hóa tốc độ xử lý phông nền và giữ chất lượng vượt trội cho các tác vụ phức tạp.
            </p>
            <div className="space-y-2 text-[11px] font-bold">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                <span>🟢 Đơn giản (Chỉ nền, màu sắc):</span>
                <code className="ml-auto font-mono bg-white dark:bg-gray-900 px-2 py-0.5 rounded text-[10px] text-emerald-700 dark:text-emerald-300">
                  {simpleModel}
                </code>
              </div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 p-2 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                <span>🔵 Phức tạp (Áo, Makeup, Tóc, Da):</span>
                <code className="ml-auto font-mono bg-white dark:bg-gray-900 px-2 py-0.5 rounded text-[10px] text-purple-700 dark:text-purple-300">
                  {complexModel}
                </code>
              </div>
            </div>
          </button>

          {/* MANUAL MODE OPTION */}
          <button
            type="button"
            onClick={() => updateConfig('aiModelMode', 'manual')}
            className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden ${
              currentMode === 'manual'
                ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 shadow-lg shadow-purple-500/10 scale-[1.01]'
                : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:border-purple-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                🎯
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                currentMode === 'manual' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {currentMode === 'manual' ? 'Đang kích hoạt' : 'Chọn chế độ này'}
              </span>
            </div>
            <h4 className="font-black text-base text-gray-900 dark:text-white uppercase tracking-tight mb-1">
              2. Cố định Thủ công (MANUAL)
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              Khóa cố định một Model AI duy nhất cho tất cả yêu cầu xử lý ảnh, bất kể thao tác đơn giản hay phức tạp.
            </p>
            <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Model cố định hiện tại:</span>
              <div className="flex items-center gap-2 text-xs font-black text-purple-600 dark:text-purple-300">
                <span>🤖</span> {manualModel}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* DETAILED CONFIGURATION PANELS */}
      {currentMode === 'auto' ? (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-6">
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
            <span>⚙️</span> Cấu hình Quy tắc Tự động (AUTO Matrix)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Simple Operations Rule */}
            <div className="p-5 bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-gray-800 dark:to-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  Nhóm 1: Tác vụ đơn giản
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  (Khuyên dùng)
                </span>
              </div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                Chỉ đổi phông nền, cân bằng màu sắc & độ sáng
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Áp dụng khi người dùng chỉ đổi màu phông nền (trắng, xanh, xám, custom hex) hoặc chỉnh độ sáng/tương phản. Không sửa trang phục hay khuôn mặt.
              </p>
              <div className="pt-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Model đảm nhận tác vụ đơn giản:
                </label>
                <select
                  value={simpleModel}
                  onChange={(e) => updateConfig('aiSimpleModel', e.target.value as AIModelType)}
                  className="w-full p-3 bg-white dark:bg-gray-900 border border-emerald-300 dark:border-emerald-700 rounded-xl font-mono text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="gemini-3.1-flash-image">gemini-3.1-flash-image (Khuyên dùng mặc định)</option>
                  <option value="gemini-3.1-flash-lite-image">gemini-3.1-flash-lite-image (Siêu tiết kiệm token)</option>
                  <option value="gemini-3-pro-image">gemini-3-pro-image (Chất lượng cao)</option>
                </select>
              </div>
            </div>

            {/* Complex Operations Rule */}
            <div className="p-5 bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-800/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  Nhóm 2: Tác vụ phức tạp
                </span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  (Deep AI Processing)
                </span>
              </div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                Thay trang phục, Trang điểm AI, Tóc & Chi tiết khuôn mặt
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Tự động kích hoạt ngay khi chọn sơ mi/vest/áo dài, tô son môi, má hồng, vẽ chân mày, làm mịn da, xóa mụn, làm dày/đổi màu tóc.
              </p>
              <div className="pt-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Model đảm nhận tác vụ phức tạp:
                </label>
                <select
                  value={complexModel}
                  onChange={(e) => updateConfig('aiComplexModel', e.target.value as AIModelType)}
                  className="w-full p-3 bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-700 rounded-xl font-mono text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="gemini-3-pro-image">gemini-3-pro-image (Khuyên dùng cho xử lý phức tạp)</option>
                  <option value="gemini-3.1-flash-image">gemini-3.1-flash-image (Thử nghiệm)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-6">
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
            <span>🎯</span> Chọn Model Cố Định (Manual Override)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Flash Lite Model Option */}
            <button
              type="button"
              onClick={() => updateConfig('aiManualModel', 'gemini-3.1-flash-lite-image')}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                manualModel === 'gemini-3.1-flash-lite-image'
                  ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                  gemini-3.1-flash-lite-image
                </span>
                {manualModel === 'gemini-3.1-flash-lite-image' && (
                  <span className="text-amber-500 font-bold">✓ Đã chọn</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Siêu tiết kiệm chi phí & nhanh nhất. Phù hợp tác vụ đơn giản (đổi nền, màu sắc).
              </p>
            </button>

            {/* Flash Model Option */}
            <button
              type="button"
              onClick={() => updateConfig('aiManualModel', 'gemini-3.1-flash-image')}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                manualModel === 'gemini-3.1-flash-image'
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                  gemini-3.1-flash-image
                </span>
                {manualModel === 'gemini-3.1-flash-image' && (
                  <span className="text-emerald-500 font-bold">✓ Đã chọn</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mẫu mới nhất được tối ưu hóa cho tốc độ xử lý nhanh, phản hồi tức thì và phông nền sắc nét.
              </p>
            </button>

            {/* Pro Model Option */}
            <button
              type="button"
              onClick={() => updateConfig('aiManualModel', 'gemini-3-pro-image')}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                manualModel === 'gemini-3-pro-image'
                  ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-black text-sm text-purple-600 dark:text-purple-400">
                  gemini-3-pro-image
                </span>
                {manualModel === 'gemini-3-pro-image' && (
                  <span className="text-purple-500 font-bold">✓ Đã chọn</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mẫu AI sinh ảnh hàng đầu với khả năng giữ nét sinh trắc học và chi tiết trang phục chất lượng cao nhất.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Information Footer Box */}
      <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl border border-slate-800 space-y-3">
        <h4 className="font-black text-white text-xs uppercase tracking-widest flex items-center gap-2">
          <span>💡</span> Cơ chế bảo vệ và Fallback sinh trắc học
        </h4>
        <p className="text-xs leading-relaxed text-slate-400">
          Mọi request gửi tới API server đều tuân thủ nguyên tắc khóa vùng mặt sinh trắc học (Immutable Face Layer). Việc chuyển đổi tự động giúp cửa hàng vừa tiết kiệm thời gian phản hồi cho khách khi chỉ sửa phông nền đơn giản, vừa đảm bảo chất lượng sắc nét tuyệt đối khi nâng cấp áo vest, son môi hay kiểu tóc.
        </p>
      </div>
    </div>
  );
};

export default AdminAIModelTab;
