
import React, { useState } from 'react';
import StartScreen from './StartScreen';
import CameraCapture from './CameraCapture';
import ImageEditor from './ImageEditor';
import PrintPreview from './PrintPreview';
import { AppStep, BackgroundType, PhotoSettings, PhotoSize, SavedPhoto, AppConfig, SkinToneType } from '../types';

interface PhotoBoothProps {
  onSaveToGallery?: () => void;
  initialPhoto?: SavedPhoto | null;
  onHome: () => void;
  config: AppConfig;
}

const PhotoBooth: React.FC<PhotoBoothProps> = ({ onSaveToGallery, initialPhoto, onHome, config }) => {
  // If loading from gallery, skip config and capture, go to print
  const [step, setStep] = useState<AppStep>(initialPhoto ? AppStep.PRINT : AppStep.CONFIG);
  
  // Data State
  const [currentPhotoId, setCurrentPhotoId] = useState<string>(initialPhoto ? initialPhoto.id : '');
  const [capturedImage, setCapturedImage] = useState<string>(initialPhoto ? initialPhoto.dataUrl : '');
  const [baseImage, setBaseImage] = useState<string>(initialPhoto ? initialPhoto.dataUrl : '');
  const [processedImage, setProcessedImage] = useState<string>(initialPhoto ? initialPhoto.dataUrl : '');
  const [editHistory, setEditHistory] = useState<any[]>([]);
  
  // Settings State
  const [settings, setSettings] = useState<PhotoSettings>(initialPhoto ? initialPhoto.settings : {
    size: PhotoSize.SIZE_4X6, // Default
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
      
      lipstickColor: 'pink', // ID chuẩn
      lipstickIntensity: 0,
      blushColor: 'pink_soft', // ID chuẩn
      eyebrowIntensity: 0,
      eyelashIntensity: 0,
      contourIntensity: 0,
      blushIntensity: 0
    },
    printQuantity: 4,
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
    setStep(AppStep.CONFIG); 
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
