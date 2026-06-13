
import React from 'react';
import { AppConfig } from '../types';
import { t } from '../services/i18n';

export interface HistoryItem {
  id: string;
  url: string;
  label: string;
  timestamp: number;
}

interface EditorHistoryProps {
  history: HistoryItem[];
  onDownload: (item: HistoryItem) => void;
  onSelect: (item: HistoryItem) => void;
  config: AppConfig;
}

const EditorHistory: React.FC<EditorHistoryProps> = ({ history, onDownload, onSelect, config }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full mt-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <span className="text-lg">clock_loader_60</span> {t('editor.history.title', config)}
        </h3>
        <span className="text-[9px] font-bold text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full">
          {history.length} {t('editor.history.versions', config)}
        </span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {[...history].reverse().map((item) => (
          <div 
            key={item.id} 
            className="snap-start shrink-0 relative group w-20 h-24 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm hover:border-brand-500 transition-colors"
          >
            <img 
              src={item.url} 
              alt={item.label} 
              className="w-full h-16 object-cover bg-gray-900" 
            />
            
            <div className="p-1.5 bg-gray-800 flex flex-col justify-center h-8">
              <p className="text-[9px] font-bold text-gray-300 truncate leading-none">{item.label}</p>
              <p className="text-[8px] text-gray-500 font-mono mt-0.5">
                {new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
              </p>
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
              <button 
                onClick={() => onSelect(item)}
                className="p-1.5 bg-brand-500 text-white rounded-full hover:bg-brand-400 transition-colors shadow-lg transform hover:scale-110"
                title={t('editor.history.select', config)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </button>
              <button 
                onClick={() => onDownload(item)}
                className="p-1.5 bg-white text-black rounded-full hover:bg-gray-200 transition-colors shadow-lg transform hover:scale-110"
                title={t('editor.history.download', config)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditorHistory;
