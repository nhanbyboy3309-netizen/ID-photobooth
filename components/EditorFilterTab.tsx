
import React from "react";
import { PhotoSettings, SkinToneType } from "../types";
import { t } from "../services/i18n";
import { getConfig } from "../services/configService";

interface EditorFilterTabProps {
  settings: PhotoSettings;
  onClientBeautyChange: (
    key: keyof PhotoSettings["beauty"],
    value: any,
  ) => void;
  isHealingBrushActive?: boolean;
  setIsHealingBrushActive?: (active: boolean) => void;
  healingBrushSize?: number;
  setHealingBrushSize?: (size: number) => void;
}

const EditorFilterTab: React.FC<EditorFilterTabProps> = ({
  settings,
  onClientBeautyChange,
  isHealingBrushActive = false,
  setIsHealingBrushActive,
  healingBrushSize = 15,
  setHealingBrushSize,
}) => {
  const config = getConfig();

  const SkinToneOptions = [
    { id: SkinToneType.NATURAL, label: "Tự nhiên", color: "#e5cba6" },
    { id: SkinToneType.FAIR, label: "Trắng Sáng", color: "#fcebe3" },
    { id: SkinToneType.ROSY, label: "Trắng Hồng", color: "#ffdee8" },
    { id: SkinToneType.TAN, label: "Ngăm Khỏe", color: "#cd9b75" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-6">
      {/* 🔴 CO CÔNG CỤ TẨY MỤN / SPOT HEALING BRUSH (AFFINITY NON-AI) */}
      <div className="p-5 rounded-3xl border border-brand-500/10 bg-brand-950/20 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🩹</span>
          <div>
            <h3 className="text-xs font-black uppercase text-brand-400 tracking-wider">
              Cọ Tẩy mụn & Khuyết điểm
            </h3>
            <p className="text-[9px] text-gray-500 font-medium">
              Sử dụng cọ vẽ (Affinity) thay thế vùng da sẹo/mụn thủ công
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => setIsHealingBrushActive?.(!isHealingBrushActive)}
              className={`flex-1 py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                isHealingBrushActive
                  ? "bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/20 animate-pulse"
                  : "bg-dark-900 border-white/5 text-gray-400 hover:text-white"
              }`}
            >
              <span>{isHealingBrushActive ? "🛑 Đang bật" : "🩹 Bật Cọ Vẽ"}</span>
            </button>
          </div>

          {isHealingBrushActive && (
            <div className="p-3 bg-dark-950/40 rounded-xl space-y-3 border border-white/5 animate-fadeIn">
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Kích thước đầu cọ</span>
                <span className="text-brand-400 font-mono">
                  {healingBrushSize}px
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="2"
                value={healingBrushSize}
                onChange={(e) => setHealingBrushSize?.(Number(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <p className="text-[9.5px] text-brand-300/80 leading-relaxed font-black text-center bg-brand-500/5 py-2 px-3 rounded-lg border border-brand-500/5">
                👉 Nhấp trực tiếp lên khuyết điểm trên ảnh bên phải để tẩy mụn!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 🔴 LÀM MỊN DA (AFFINITY BILATERAL BEAUTIFY) */}
      <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
        <div className="flex justify-between text-[10px] font-black text-gray-300 mb-3 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span>✨</span>
            <span>Mịn Da (Smoothing)</span>
          </div>
          <span className="text-[9px] font-bold text-emerald-400">
            {settings.beauty.smoothSkin}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={settings.beauty.smoothSkin}
          onChange={(e) =>
            onClientBeautyChange("smoothSkin", Number(e.target.value))
          }
          className="w-full accent-emerald-500"
        />
        <p className="text-[8.5px] text-gray-500 mt-1">
          Thuật toán lọc song phương Bilateral Filter chỉ xử lý làm mịn vùng da, không chạm nền.
        </p>
      </div>

      {/* 🔴 ÁNH SÁNG & TƯƠNG PHẢN (CLIENT-SIDE) */}
      <div className="space-y-6">
        <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
          <div className="flex justify-between text-[10px] font-black text-gray-300 mb-3 uppercase tracking-widest">
            <span>{t("editor.filter.lighting", config)}</span>
            <span
              className={`px-2 py-0.5 rounded text-[9px] ${settings.beauty.lighting > 0 ? "bg-orange-500/20 text-orange-400" : settings.beauty.lighting < 0 ? "bg-blue-500/20 text-blue-400" : "bg-gray-700 text-gray-400"}`}
            >
              {settings.beauty.lighting > 0
                ? `+${settings.beauty.lighting}`
                : settings.beauty.lighting}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={settings.beauty.lighting}
            onChange={(e) =>
              onClientBeautyChange("lighting", Number(e.target.value))
            }
            className="w-full accent-brand-500"
          />
        </div>

        <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
          <div className="flex justify-between text-[10px] font-black text-gray-300 mb-3 uppercase tracking-widest">
            <span>{t("editor.filter.contrast", config)}</span>
            <span className="text-[9px] font-bold text-gray-400">
              {settings.beauty.contrast}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={settings.beauty.contrast}
            onChange={(e) =>
              onClientBeautyChange("contrast", Number(e.target.value))
            }
            className="w-full accent-purple-500"
          />
        </div>
      </div>

      {/* 🔴 TÔNG MÀU DA / SKINTONE (ONLY APPLIES TO DETECTED SKIN PIXELS) */}
      <div className="pt-6 border-t border-white/10">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
          {t("editor.filter.skintone", config)} (Chủ thể)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {SkinToneOptions.map((tone) => (
            <button
              key={tone.id}
              onClick={() => {
                onClientBeautyChange("skinToneType", tone.id);
                if (settings.beauty.skinToneIntensity === 0)
                  onClientBeautyChange("skinToneIntensity", 30);
              }}
              className={`
                flex items-center gap-3 p-3 rounded-2xl border-2 transition-all active:scale-95
                ${
                  settings.beauty.skinToneType === tone.id
                    ? "border-brand-500 bg-brand-900/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                    : "border-white/5 bg-white/5 hover:bg-white/10"
                }
              `}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm shrink-0"
                style={{ backgroundColor: tone.color }}
              ></div>
              <span
                className={`text-[10px] font-black uppercase ${settings.beauty.skinToneType === tone.id ? "text-brand-400" : "text-gray-400"}`}
              >
                {tone.label}
              </span>
            </button>
          ))}
        </div>

        {settings.beauty.skinToneIntensity > 0 && (
          <div className="mt-6 px-2 animate-fadeIn">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">
              <span>Cường độ màu da</span>
              <span>{settings.beauty.skinToneIntensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={settings.beauty.skinToneIntensity}
              onChange={(e) =>
                onClientBeautyChange("skinToneIntensity", Number(e.target.value))
              }
              className="w-full accent-orange-400"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorFilterTab;
