
import React, { useEffect, useState } from 'react';
import { getPhotosFromCloud, deletePhotoFromCloud } from '../services/databaseService';
import { SavedPhoto } from '../types';
import { t } from '../services/i18n';
import { getConfig } from '../services/configService';

interface GalleryProps {
  onSelectPhoto: (photo: SavedPhoto) => void;
  onBack?: () => void;
}

const Gallery: React.FC<GalleryProps> = ({ onSelectPhoto, onBack }) => {
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const config = getConfig();

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    const data = await getPhotosFromCloud();
    setPhotos(data);
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(t('btn.delete', config) + "?")) {
      await deletePhotoFromCloud(id, config.adminPassword);
      loadPhotos();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
             {onBack && (
                 <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition">
                     <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 </button>
             )}
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
            {t('gallery.title', config)}
            </h2>
        </div>
        <button onClick={loadPhotos} className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-200 font-medium px-4 py-2 border border-brand-200 dark:border-brand-800 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 transition">
          {t('gallery.refresh', config)}
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 dark:border-t-brand-400"></div>
          <p className="text-gray-500 font-medium">{t('gallery.loading', config)}</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <p>{t('gallery.empty', config)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 overflow-y-auto pb-10 pr-2">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              onClick={() => onSelectPhoto(photo)}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 relative">
                <img 
                  src={photo.dataUrl} 
                  alt="ID Photo" 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                        {t('gallery.reprint', config)}
                    </span>
                </div>
              </div>
              
              <div className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">{photo.settings.size}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(photo.timestamp).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                
                <div className="mt-2 flex gap-1">
                   <span className={`text-[10px] px-1.5 py-0.5 rounded border ${photo.settings.background === 'white' ? 'bg-white border-gray-200' : photo.settings.background === 'blue' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                      {photo.settings.background === 'white' ? t('start.bg_white', config) : photo.settings.background === 'blue' ? t('start.bg_blue', config) : t('start.bg_gray', config)}
                   </span>
                </div>
              </div>

              <button 
                onClick={(e) => handleDelete(e, photo.id)}
                className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                title={t('btn.delete', config)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;
