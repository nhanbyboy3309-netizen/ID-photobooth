
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BackgroundType, PhotoSettings, PhotoSize, AppConfig, SkinToneType } from '../types';
import { processIDPhoto } from '../services/geminiService';
import { t } from '../services/i18n';

// Sub-components
import EditorBackgroundTab from './EditorBackgroundTab';
import EditorClothingTab from './EditorClothingTab';
import EditorMakeupTab from './EditorMakeupTab';
import EditorFilterTab from './EditorFilterTab';
import ManualCropper from './ManualCropper'; 
import EditorHistory, { HistoryItem } from './EditorHistory'; // Import History Component

interface ImageEditorProps {
  photoId: string;
  originalImage: string;
  initialBaseImage: string;
  initialProcessedImage: string;
  initialHistory: HistoryItem[];
  settings: PhotoSettings;
  onUpdateSettings: (newSettings: PhotoSettings) => void;
  onProcessedImage: (img: string) => void;
  onUpdateBaseImage: (img: string) => void;
  onUpdateHistory: (history: HistoryItem[]) => void;
  onNext: () => void;
  onRetake: () => void;
  config: AppConfig;
}

type EditorTab = 'crop' | 'background' | 'beauty' | 'clothing' | 'makeup';

const ImageEditor: React.FC<ImageEditorProps> = ({ 
  photoId,
  originalImage, 
  initialBaseImage,
  initialProcessedImage,
  initialHistory,
  settings, 
  onUpdateSettings, 
  onProcessedImage,
  onUpdateBaseImage,
  onUpdateHistory,
  onNext,
  onRetake,
  config
}) => {
  // baseImage acts as the source for AI processing. 
  // Initially it is the camera capture, but if cropped, it becomes the cropped image.
  const [baseImage, setBaseImage] = useState<string>(initialBaseImage || originalImage);

  // processedUrl is what is shown to the user (result of AI or just baseImage)
  const [processedUrl, setProcessedUrl] = useState<string>(initialProcessedImage || initialBaseImage || originalImage);
  
  // History State
  const [editHistory, setEditHistory] = useState<HistoryItem[]>(initialHistory);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('background');
  const [loadingAction, setLoadingAction] = useState<string>('');
  
  // Crop State
  const [isCropping, setIsCropping] = useState(false);
  
  const [sliderPosition, setSliderPosition] = useState(50);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Helper to add history
  const addToHistory = useCallback((url: string, label: string) => {
    setEditHistory(prev => {
        // Prevent duplicate consecutive entries if needed, but simplistic check for now
        if (prev.length > 0 && prev[prev.length - 1].url === url) return prev;
        
        return [...prev, {
            id: `ver_${Date.now()}`,
            url,
            label,
            timestamp: Date.now()
        }];
    });
  }, []);

  // Sync history to parent
  useEffect(() => {
    onUpdateHistory(editHistory);
  }, [editHistory, onUpdateHistory]);

  // Initialize history
  useEffect(() => {
    if (editHistory.length === 0) {
        addToHistory(originalImage, 'Ảnh gốc');
    }
  }, [originalImage, addToHistory, editHistory.length]);

  // Sync baseImage to parent
  useEffect(() => {
    onUpdateBaseImage(baseImage);
  }, [baseImage, onUpdateBaseImage]);

  const getAiSettingsHash = useCallback((s: PhotoSettings) => {
    const beauty = s.beauty;
    return JSON.stringify({
       background: s.background,
       bgHex: s.backgroundHex,
       cloth: s.clothingPrompt,
       blemish: beauty.blemishIntensity,
       smooth: beauty.smoothSkin,
       lipCol: beauty.lipstickColor,
       lipInt: beauty.lipstickIntensity,
       blushCol: beauty.blushColor,
       blushInt: beauty.blushIntensity,
       brow: beauty.eyebrowIntensity,
       lash: beauty.eyelashIntensity,
       contour: beauty.contourIntensity,
       hair: beauty.hairVolume,
       hairStyle: beauty.hairStyle,
       hairColor: beauty.hairColor 
    });
  }, []);

  const getRawStateHash = useCallback(() => {
     return JSON.stringify({
       background: BackgroundType.ORIGINAL,
       bgHex: undefined,
       cloth: undefined,
       blemish: 0,
       smooth: 0,
       lipCol: settings.beauty.lipstickColor,
       lipInt: 0,
       blushCol: settings.beauty.blushColor,
       blushInt: 0,
       brow: 0,
       lash: 0,
       contour: 0,
       hair: 0,
       hairStyle: 'original',
       hairColor: 'original'
     });
  }, [settings.beauty.lipstickColor, settings.beauty.blushColor]);

  const [appliedHash, setAppliedHash] = useState<string>(getRawStateHash());

  const hasPendingAiChanges = useMemo(() => {
    const currentHash = getAiSettingsHash(settings);
    const safeAppliedHash = appliedHash || getRawStateHash();
    return currentHash !== safeAppliedHash;
  }, [settings, appliedHash, getAiSettingsHash, getRawStateHash]);

  const handleApplyAiChanges = useCallback(async () => {
    const currentHash = getAiSettingsHash(settings);
    setIsProcessing(true);
    setLoadingAction(t('editor.loading', config));
    
    try {
      const isDefault = 
        settings.background === BackgroundType.ORIGINAL && 
        !settings.clothingPrompt && 
        settings.beauty.blemishIntensity === 0 && 
        settings.beauty.smoothSkin === 0 &&
        settings.beauty.lipstickIntensity === 0 && 
        settings.beauty.blushIntensity === 0 &&
        settings.beauty.eyebrowIntensity === 0 &&
        settings.beauty.eyelashIntensity === 0 &&
        settings.beauty.contourIntensity === 0 &&
        settings.beauty.hairVolume === 0 &&
        (settings.beauty.hairStyle === 'original' || !settings.beauty.hairStyle) &&
        (settings.beauty.hairColor === 'original' || !settings.beauty.hairColor || settings.beauty.hairColor === 'Màu gốc');

      if (isDefault) {
        setProcessedUrl(baseImage);
      } else {
        const lipLabel = config.lipstickOptions.find(o => o.id === settings.beauty.lipstickColor)?.label || settings.beauty.lipstickColor;
        const blushLabel = config.blushOptions.find(o => o.id === settings.beauty.blushColor)?.label || settings.beauty.blushColor;
        const hairLabel = config.hairColorOptions.find(o => o.id === settings.beauty.hairColor)?.label || settings.beauty.hairColor;

        const resolvedBeauty = {
            ...settings.beauty,
            lipstickColor: lipLabel,
            blushColor: blushLabel,
            hairColor: hairLabel
        };

        const result = await processIDPhoto(
            baseImage, 
            settings.background,
            settings.backgroundHex, 
            settings.clothingPrompt, 
            resolvedBeauty, 
            settings.size
        );
        setProcessedUrl(result);
        addToHistory(result, 'AI Processed');
      }
      setAppliedHash(currentHash);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'MODEL_NOT_FOUND' || (err.message && err.message.includes('entity was not found'))) {
        alert("Lỗi kết nối AI (404). Vui lòng chọn lại API Key hợp lệ.");
        if ((window as any).aistudio?.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
        }
      } else if (err.message === 'AI_QUOTA_EXCEEDED') {
        alert("Vui lòng thử lại sau.");
      } else {
        alert("Lỗi xử lý ảnh: " + (err.message || "Không xác định"));
      }
    } finally {
      setIsProcessing(false);
      setLoadingAction('');
    }
  }, [settings, baseImage, getAiSettingsHash, config, addToHistory]); 

  const handleBgChange = (bg: BackgroundType, hex?: string) => onUpdateSettings({ ...settings, background: bg, backgroundHex: hex });
  const handleClothingClick = (prompt: string) => onUpdateSettings({ ...settings, clothingPrompt: prompt });
  const handleAiBeautyChange = (key: keyof typeof settings.beauty, value: any) => onUpdateSettings({ ...settings, beauty: { ...settings.beauty, [key]: value } });
  const handleClientBeautyChange = (key: keyof typeof settings.beauty, value: any) => onUpdateSettings({ ...settings, beauty: { ...settings.beauty, [key]: value } });

  const imageFilters = useMemo(() => {
    const { lighting, contrast, skinToneIntensity, skinToneType } = settings.beauty;
    const brightnessVal = 100 + (lighting * 1.5); 
    const contrastVal = 100 + (contrast * 1.5);
    let sepia = 0, hue = 0, saturate = 100;
    if (skinToneIntensity > 0) {
        if (skinToneType === SkinToneType.TAN) { sepia = skinToneIntensity * 0.3; saturate = 100 - (skinToneIntensity * 0.1); }
        else if (skinToneType === SkinToneType.ROSY) { sepia = skinToneIntensity * 0.15; hue = -10; saturate = 100 + (skinToneIntensity * 0.1); }
        else if (skinToneType === SkinToneType.FAIR) { saturate = 100 - (skinToneIntensity * 0.1); }
    }
    return `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturate}%) sepia(${sepia}%) hue-rotate(${hue}deg)`;
  }, [settings.beauty]);

  const handleFinish = () => {
    const finishExport = (imgSrc: string) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imgSrc;
        img.onload = () => {
            canvas.width = img.width; canvas.height = img.height;
            if (ctx) { ctx.filter = imageFilters; ctx.drawImage(img, 0, 0, canvas.width, canvas.height); onProcessedImage(canvas.toDataURL('image/png', 1.0)); onNext(); }
        };
    };
    if (hasPendingAiChanges) {
        if (confirm("Có thay đổi chưa áp dụng. Áp dụng ngay?")) {
            handleApplyAiChanges().then(() => finishExport(processedUrl));
        } else { finishExport(processedUrl); }
    } else { finishExport(processedUrl); }
  };

  const startCrop = () => {
    setIsCropping(true);
  };

  const handleCropConfirm = (croppedImg: string) => {
    setBaseImage(croppedImg); 
    setProcessedUrl(croppedImg);
    addToHistory(croppedImg, 'Cắt ảnh (Crop)');
    setAppliedHash(''); 
    setIsCropping(false);
  };

  const handleDownloadHistoryItem = (item: HistoryItem) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `History-${item.label}-${item.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setProcessedUrl(item.url);
    // If it's the original or a crop, we might want to reset baseImage too
    // but for now, just changing the view is what "select version" usually means
    // If they select a version and then apply AI, it will apply on top of baseImage.
    // This is a bit tricky. If they select an "AI Processed" version, and then change background,
    // it should ideally apply on the original baseImage with new settings.
  };

  const tabs = [
      {id: 'crop', label: 'Cắt ảnh', icon: '✂️'},
      {id: 'background', label: 'BACKGROUND', icon: '🖼️'},
      {id: 'clothing', label: 'CLOTHING', icon: '👔'},
      {id: 'makeup', label: 'MAKEUP', icon: '✨'},
      {id: 'beauty', label: 'FILTER', icon: '🎨'}
  ];

  return (
    <div className="flex flex-col-reverse lg:flex-row h-[100dvh] w-full bg-dark-950 overflow-hidden font-sans pb-safe text-gray-100"
       onMouseUp={() => { isDraggingRef.current = false; }}
       onTouchEnd={() => { isDraggingRef.current = false; }}
    >
      {isCropping && (
        <ManualCropper 
            imageSrc={processedUrl}
            photoSize={settings.size}
            onCancel={() => setIsCropping(false)}
            onConfirm={handleCropConfirm}
        />
      )}

      {/* CONTROL SIDEBAR */}
      <div className="w-full lg:w-[450px] bg-dark-800 lg:border-r border-white/10 flex flex-col h-[55dvh] lg:h-full shrink-0 shadow-2xl z-20">
        
        {/* Top Navigation Tabs */}
        <div className="p-3 lg:p-4 border-b border-white/5 bg-dark-900/50 backdrop-blur-sm">
            <div className="flex bg-dark-950/50 p-1.5 rounded-2xl gap-1 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => tab.id === 'crop' ? startCrop() : setActiveTab(tab.id as any)}
                        className={`
                            relative flex flex-col items-center justify-center py-3 px-3 min-w-[70px] flex-1 rounded-xl transition-all duration-300
                            ${activeTab === tab.id && tab.id !== 'crop'
                                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <span className="text-lg mb-1">{tab.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider whitespace-nowrap">{tab.label}</span>
                        {tab.id === 'crop' && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 bg-dark-900 scrollbar-hide">
             {activeTab === 'background' && (
                <EditorBackgroundTab config={config} settings={settings} onBgChange={handleBgChange} />
             )}
             {activeTab === 'clothing' && (
                <EditorClothingTab config={config} settings={settings} onClothingClick={handleClothingClick} />
             )}
             {activeTab === 'makeup' && (
                <EditorMakeupTab config={config} settings={settings} onAiBeautyChange={handleAiBeautyChange} />
             )}
             {activeTab === 'beauty' && (
                <EditorFilterTab settings={settings} onClientBeautyChange={handleClientBeautyChange} />
             )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 lg:p-6 bg-dark-800 border-t border-white/10 space-y-3">
             {hasPendingAiChanges && (
                 <button 
                    onClick={handleApplyAiChanges} 
                    disabled={isProcessing} 
                    className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-lg shadow-brand-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                 >
                    {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <span className="group-hover:animate-pulse">✨</span>
                    )}
                    {t('editor.btn.apply', config)}
                 </button>
             )}

             <div className="flex gap-4">
                 <button onClick={onRetake} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-2xl font-bold text-xs uppercase tracking-widest transition-colors border border-white/5">
                    {t('editor.btn.retake', config)}
                 </button>
                 <button onClick={handleFinish} disabled={isProcessing} className="flex-[2] py-4 bg-white hover:bg-gray-100 text-brand-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-transform active:scale-95 disabled:opacity-50">
                    {t('editor.btn.finish', config)}
                 </button>
             </div>
        </div>
      </div>

      {/* IMAGE PREVIEW AREA */}
      <div className="flex-1 bg-dark-950 relative flex flex-col p-6 lg:p-12 overflow-hidden h-[45dvh] lg:h-full">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black opacity-50 pointer-events-none"></div>
         
         {isProcessing && (
            <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fadeIn">
                <div className="bg-dark-800 p-8 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-brand-900 border-t-brand-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-white font-black text-xs uppercase tracking-widest animate-pulse">{loadingAction}</p>
                </div>
            </div>
         )}

         {/* Image Container Flex-1 to take available space */}
         <div className="flex-1 w-full relative flex items-center justify-center min-h-0">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-2 z-20">
                 <span className="px-3 py-1 bg-brand-600/80 backdrop-blur-md text-white text-[10px] font-mono rounded-full border border-white/20 shadow-lg">
                   ID: {photoId}
                 </span>
             </div>
             <div 
                 ref={imageContainerRef} 
                 className="relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] rounded-xl overflow-hidden border-4 border-gray-800 bg-gray-900 cursor-col-resize touch-none max-h-full max-w-full"
                 style={{ aspectRatio: settings.size === PhotoSize.SIZE_5X5 ? '1/1' : '2/3', height: '100%' }}
                 onMouseDown={() => { isDraggingRef.current = true; }}
                 onTouchStart={() => { isDraggingRef.current = true; }}
                 onMouseMove={(e) => {
                   if (isDraggingRef.current && imageContainerRef.current) {
                      const rect = imageContainerRef.current.getBoundingClientRect();
                      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                      setSliderPosition((x / rect.width) * 100);
                   }
                 }}
                 onTouchMove={(e) => {
                   if (isDraggingRef.current && imageContainerRef.current) {
                      const rect = imageContainerRef.current.getBoundingClientRect();
                      const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
                      setSliderPosition((x / rect.width) * 100);
                   }
                 }}
             >
                 <img src={baseImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none" alt="Original" />
                 <div className="absolute inset-0 w-full h-full pointer-events-none border-r-2 border-white shadow-[0_0_20px_rgba(0,0,0,0.5)]" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                     <img src={processedUrl} className="absolute inset-0 w-full h-full object-contain" style={{ filter: imageFilters }} alt="Processed" />
                 </div>
                 
                 {/* Slider Handle */}
                 <div className="absolute top-0 bottom-0 w-1 bg-white/50 cursor-col-resize z-20 backdrop-blur-sm" style={{ left: `${sliderPosition}%` }}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-brand-600 border-2 border-brand-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                    </div>
                 </div>
                 
                 <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur rounded text-[9px] font-bold text-white uppercase tracking-wider">Sau khi xử lý</div>
                 <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur rounded text-[9px] font-bold text-white/70 uppercase tracking-wider">Ảnh gốc</div>
             </div>
         </div>

         {/* History Component at Bottom of Preview Area */}
         <div className="shrink-0 w-full max-w-2xl mx-auto z-10">
            <EditorHistory 
                history={editHistory} 
                onDownload={handleDownloadHistoryItem} 
                onSelect={handleSelectHistoryItem}
                config={config}
            />
         </div>
      </div>
    </div>
  );
};

export default ImageEditor;
