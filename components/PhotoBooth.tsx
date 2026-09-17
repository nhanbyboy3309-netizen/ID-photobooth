
import React, { useState } from 'react';
import StartScreen from './StartScreen';
import CameraCapture from './CameraCapture';
import ImageEditor from './ImageEditor';
import PrintPreview from './PrintPreview';
import { AppStep, BackgroundType, PhotoSettings, PhotoSize, SavedPhoto, AppConfig, SkinToneType } from '../types';

export interface ServiceSession {
  size: PhotoSize;
  quantity: number;
}

interface PhotoBoothProps {
  onSaveToGallery?: () => void;
  initialPhoto?: SavedPhoto | null;
  onHome: () => void;
  config: AppConfig;
  // Đơn dịch vụ đã xác minh "paid" từ photo-moments — bỏ qua màn hình
  // chọn khổ/nền/số lượng thủ công, vào thẳng bước chụp với cấu hình đã mua.
  serviceSession?: ServiceSession | null;
}

const PhotoBooth: React.FC<PhotoBoothProps> = ({ onSaveToGallery, initialPhoto, onHome, config, serviceSession }) => {
  // Nếu có serviceSession, bỏ qua CONFIG luôn vào CAPTURE. Nếu load từ gallery, vào thẳng PRINT.
  const [step, setStep] = useState<AppStep>(
    initialPhoto ? AppStep.PRINT : (serviceSession ? AppStep.CAPTURE : AppStep.CONFIG)
  );
  
  // Data State
  const [currentPhotoId, setCurrentPhotoId] = useState<string>(initialPhoto ? initialPhoto.id : '');
  const [capturedImage, setCapturedImage] = useState<string>(initialPhoto ? initialPhoto.dataUrl : '');
  const [baseImage, setBaseImage] = useState<string>(initialPhoto ? initialPhoto.dataUrl : '');
  const [processedImage, setProcessedImage] = useState<string>(initialPhoto ? initialPhoto.dataUrl : '');
  const [editHistory, setEditHistory] = useState<any[]>([]);
  
  // Settings State
  const [settings, setSettings] = useState<PhotoSettings>(initialPhoto ? initialPhoto.settings : {
    size: serviceSession?.size || PhotoSize.SIZE_4X6, // Default
    background: BackgroundType.WHITE,
    backgroundHex: '#ffffff', // Default hex
    clothingPrompt: undefined,
    beauty: {
      smoothSkin: 0,
      blemishIntensity: 0,
      
      // Hair defaults
      hairVolume: 0,
      hairStyle: 'original',

      makeupStyle: 'natural',
      
      skinToneType: SkinToneType.NATURAL,
      skinToneIntensity: 0,
      
      lighting: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      midtones: 0,
      cyan: 0,
      magenta: 0,
      yellow: 0,
      keyBlack: 0,

      lipstickColor: 'pink', // ID chuẩn
      lipstickIntensity: 0,
      blushColor: 'pink_soft', // ID chuẩn
      eyebrowIntensity: 0,
      eyelashIntensity: 0,
      contourIntensity: 0,
      blushIntensity: 0
    },
    printQuantity: serviceSession?.quantity || 4,
    phoneNumber: config.contactZalo // Default phone from config
  });

  const generatePhotoId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like 0, O, 1, I
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleStartConfig = (config: { size: PhotoSize; background: BackgroundType; quantity: number }) => {
    // Find default hex for selected background type from config if available, otherwise fallback
    // This is simple logic, assumes standard types map to standard defaults if not custom selected later
    let defaultHex = '#ffffff';
    if (config.background === BackgroundType.BLUE) defaultHex = '#2792ff';
    if (config.background === BackgroundType.GRAY) defaultHex = '#d1d5db';

    setSettings({
      ...settings,
      size: config.size,
      background: config.background,
      backgroundHex: defaultHex,
      printQuantity: config.quantity
    });
    setStep(AppStep.CAPTURE);
  };

  const handleCapture = (imageSrc: string) => {
    setCurrentPhotoId(generatePhotoId());
    setCapturedImage(imageSrc);
    setBaseImage(imageSrc);
    setStep(AppStep.EDIT);
  };

  const handleProcessedImage = (img: string) => {
    setProcessedImage(img);
  };

  const resetFlow = () => {
    setCurrentPhotoId('');
    setCapturedImage('');
    setBaseImage('');
    setProcessedImage('');
    setEditHistory([]);
    // Đơn dịch vụ đã khoá khổ/số lượng theo gói đã mua — không cho chọn lại từ đầu.
    setStep(serviceSession ? AppStep.CAPTURE : AppStep.CONFIG);
  };

  const handleRetake = () => {
    setCurrentPhotoId('');
    setCapturedImage('');
    setBaseImage('');
    setEditHistory([]);
    setStep(AppStep.CAPTURE);
  };

  return (
    <div className="h-full w-full">
      {step === AppStep.CONFIG && (
        <StartScreen 
          onStart={handleStartConfig} 
          onHome={onHome} 
          config={config} 
        />
      )}

      {step === AppStep.CAPTURE && (
        <CameraCapture 
          onCapture={handleCapture}
          selectedSize={settings.size}
          onSizeChange={(s) => setSettings({...settings, size: s})}
        />
      )}
      
      {step === AppStep.EDIT && (
        <ImageEditor 
          photoId={currentPhotoId}
          originalImage={capturedImage}
          initialBaseImage={baseImage}
          initialProcessedImage={processedImage}
          initialHistory={editHistory}
          settings={settings}
          onUpdateSettings={setSettings}
          onProcessedImage={(img) => {
            setProcessedImage(img);
          }}
          onUpdateBaseImage={setBaseImage}
          onUpdateHistory={setEditHistory}
          onNext={() => setStep(AppStep.PRINT)}
          onRetake={handleRetake}
          config={config}
        />
      )}
      
      {step === AppStep.PRINT && (
        <PrintPreview 
          photoId={currentPhotoId}
          processedImage={processedImage}
          size={settings.size}
          settings={settings}
          onBack={() => setStep(AppStep.EDIT)}
          onNew={resetFlow}
          onSaved={onSaveToGallery}
          onHome={onHome}
          config={config}
        />
      )}
    </div>
  );
};

export default PhotoBooth;
