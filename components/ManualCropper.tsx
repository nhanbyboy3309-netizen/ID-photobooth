
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoSize } from '../types';

interface ManualCropperProps {
  imageSrc: string;
  photoSize: PhotoSize;
  onCancel: () => void;
  onConfirm: (croppedImage: string) => void;
}

const ManualCropper: React.FC<ManualCropperProps> = ({ imageSrc, photoSize, onCancel, onConfirm }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // Any degree: -180 to 180 or more
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Calculate Aspect Ratio
  const getAspectRatio = () => {
    switch (photoSize) {
      case PhotoSize.SIZE_3X4: return 3 / 4;
      case PhotoSize.SIZE_5X5: return 1;
      case PhotoSize.SIZE_4X6: 
      default: return 2 / 3; // 4x6 = 2/3
    }
  };

  const ASPECT_RATIO = getAspectRatio();

  // Load image dimensions
  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImgDimensions({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  };

  // --- MOUSE / TOUCH EVENTS FOR PANNING ---
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Mouse
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  
  // Touch
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  // --- ROTATION HANDLERS ---
  const resetRotation = () => setRotation(0);

  // --- CROP LOGIC ---
  const handleCrop = async () => {
    if (!imgRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropBox = containerRef.current.querySelector('#crop-box')?.getBoundingClientRect();
    const imgRect = imgRef.current.getBoundingClientRect();

    if (!cropBox) return;

    // We want high resolution, so we base the canvas size on the crop box 
    // but relative to the image's natural resolution.
    const displayedImgW = imgRect.width;
    const displayedImgH = imgRect.height;
    
    // Scale between displayed size and natural size
    // Note: The displayed width of the img element changes with rotation, 
    // but getBoundingClientRect gives us the actual rendered box.
    // We need to calculate the scale based on the original un-rotated width.
    const scale = imgRef.current.naturalWidth / (displayedImgW / zoom);

    canvas.width = cropBox.width * scale;
    canvas.height = cropBox.height * scale;

    ctx.save();
    
    // 1. Move to the center of the canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // 2. Apply the rotation
    ctx.rotate((rotation * Math.PI) / 180);
    
    // 3. Calculate the position of the image center relative to the crop box center
    const cropBoxCenterX = cropBox.left + cropBox.width / 2;
    const cropBoxCenterY = cropBox.top + cropBox.height / 2;
    
    // We need to find the image center. 
    // Since we applied CSS transform: translate(offset.x, offset.y), the center of the image
    // is its original center + offset.
    // However, the CSS transform also includes rotation which affects getBoundingClientRect.
    // A more reliable way is to track the offset separately.
    
    // Displayed center point (relative to viewport)
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;
    
    const imgCenterX = containerCenterX + offset.x;
    const imgCenterY = containerCenterY + offset.y;

    const dx = (imgCenterX - cropBoxCenterX) * scale;
    const dy = (imgCenterY - cropBoxCenterY) * scale;

    // 4. Draw the image centered at the calculated offset
    // Apply zoom to the dimensions
    const drawW = imgRef.current.naturalWidth * zoom;
    const drawH = imgRef.current.naturalHeight * zoom;
    
    ctx.drawImage(
      imgRef.current,
      dx - (drawW / 2),
      dy - (drawH / 2),
      drawW,
      drawH
    );

    ctx.restore();

    onConfirm(canvas.toDataURL('image/png', 1.0));
  };

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-20">
        <button onClick={onCancel} className="text-white font-bold text-sm px-4 py-2 rounded-full bg-white/10 hover:bg-white/20">
          Hủy
        </button>
        <span className="text-white font-black uppercase text-sm tracking-widest">CẮT & XOAY ẢNH</span>
        <button onClick={handleCrop} className="text-white font-bold text-sm px-6 py-2 rounded-full bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/30">
          Xong
        </button>
      </div>

      {/* Workspace */}
      <div 
        className="flex-1 relative overflow-hidden flex items-center justify-center cursor-move touch-none bg-gray-900"
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handleEnd}
      >
        {/* The Image */}
        <img 
          ref={imgRef}
          src={imageSrc} 
          onLoad={onImgLoad}
          alt="Crop source"
          className="absolute max-w-none origin-center transition-transform duration-75 ease-linear pointer-events-none select-none"
          style={{ 
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            height: '60%', // Base height fit
          }}
          draggable={false}
        />

        {/* The Crop Box Overlay */}
        <div 
          id="crop-box"
          className="relative z-10 pointer-events-none border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
          style={{
            aspectRatio: `${ASPECT_RATIO}`,
            height: '65%', // Height relative to container
          }}
        >
           {/* Grid Lines */}
           <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
              <div className="border-r border-b border-white"></div>
              <div className="border-r border-b border-white"></div>
              <div className="border-b border-white"></div>
              <div className="border-r border-b border-white"></div>
              <div className="border-r border-b border-white"></div>
              <div className="border-b border-white"></div>
              <div className="border-r border-white"></div>
              <div className="border-r border-white"></div>
              <div></div>
           </div>
           
           {/* Info Tag */}
           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-mono whitespace-nowrap">
              {photoSize}
           </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-gray-900 p-6 pb-safe border-t border-gray-800 z-20">
         <div className="max-w-md mx-auto space-y-5">
            
            {/* Zoom Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest items-center">
                 <span className="flex items-center gap-1">🔍 Thu phóng</span>
                 <span className="bg-gray-800 px-2 py-0.5 rounded text-white">{Math.round(zoom * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="4" 
                step="0.01" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))} 
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            {/* Rotation Slider (Fine Tuning) */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest items-center">
                 <span className="flex items-center gap-1">🔄 Xoay chi tiết</span>
                 <button onClick={resetRotation} className="bg-gray-800 px-2 py-0.5 rounded text-white hover:text-brand-400 transition-colors">{rotation}° (Reset)</button>
              </div>
              <input 
                type="range" 
                min="-180" 
                max="180" 
                step="0.5" 
                value={rotation % 360} 
                onChange={(e) => setRotation(parseFloat(e.target.value))} 
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <p className="text-center text-[9px] text-gray-600 pt-2 uppercase tracking-tighter">
               Vuốt ảnh để di chuyển • Thanh trượt để zoom & xoay
            </p>
         </div>
      </div>
    </div>
  );
};

export default ManualCropper;
