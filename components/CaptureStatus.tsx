
import React from 'react';
import { t } from '../services/i18n';
import { AppConfig } from '../types';

interface CaptureStatusProps {
  validationStatus: 'searching' | 'analyzing' | 'adjusting' | 'valid';
  feedbackMessage: string;
  instruction: string;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onDeviceChange: (id: string) => void;
  config?: AppConfig;
}

const CaptureStatus: React.FC<CaptureStatusProps> = ({
  validationStatus, feedbackMessage, instruction, devices, selectedDeviceId, onDeviceChange, config = { language: 'vi' } as AppConfig
}) => {
  
  const getTranslatedFeedback = (msg: string) => {
    if (msg === 'ĐẠT CHUẨN') return t('capture.status.valid', config);
    if (msg === 'Cần điều chỉnh') return t('capture.status.adjusting', config);
    if (msg === 'Không tìm thấy mặt') return t('capture.msg.no_face', config);
    if (msg === 'Đang xử lý') return t('capture.label.processing', config);
    return msg;
  };

  const getTranslatedInstruction = (ins: string) => {
    if (ins === 'Giữ nguyên tư thế!') return t('capture.msg.valid', config);
    if (ins === 'Chỉnh lại tư thế') return t('capture.status.adjusting', config);
    if (ins === 'Di chuyển vào khung hình') return t('capture.msg.move_in', config);
    return ins;
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pb-12">
      <div className="flex gap-2 pointer-events-auto">
          <select 
            value={selectedDeviceId}
            onChange={(e) => onDeviceChange(e.target.value)}
            className="bg-black/50 text-white text-xs border border-gray-600 rounded-lg px-3 py-2 outline-none backdrop-blur-md hover:bg-black/70 transition-colors max-w-[150px] sm:max-w-xs truncate cursor-pointer"
          >
            <option value="">{t('capture.device.select', config)}</option>
            {devices.map((device, idx) => (
              <option key={device.deviceId || idx} value={device.deviceId}>
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
            <option value="mobile-link">📱 {t('capture.device.mobile', config)}</option>
          </select>
      </div>
      
      <div className={`
        absolute top-16 left-1/2 transform -translate-x-1/2
        px-6 py-3 rounded-xl backdrop-blur-md border-2 flex flex-col items-center gap-1 transition-all duration-300 min-w-[280px] text-center shadow-lg
        ${validationStatus === 'valid' ? 'bg-green-600/90 border-green-400 text-white scale-110' : 
          validationStatus === 'adjusting' ? 'bg-yellow-600/80 border-yellow-400 text-white' :
          validationStatus === 'analyzing' ? 'bg-brand-600/80 border-brand-400 text-white' :
          'bg-red-600/80 border-red-500 text-white'}
      `}>
        <div className="flex items-center gap-2">
           {validationStatus === 'valid' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
           ) : (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
           )}
           <span className="font-bold text-sm tracking-wide uppercase">{getTranslatedFeedback(feedbackMessage)}</span>
        </div>
        <span className="text-xs font-medium opacity-90">{getTranslatedInstruction(instruction)}</span>
      </div>
    </div>
  );
};

export default CaptureStatus;
