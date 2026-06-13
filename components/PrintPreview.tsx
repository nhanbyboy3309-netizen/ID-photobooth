
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PhotoSettings, PhotoSize, AppConfig, BackgroundType } from '../types';
import { savePhotoToCloud } from '../services/databaseService';
import { t } from '../services/i18n';

// Sub-components
import PrintSidebar from './PrintSidebar';
import PrintSheetView from './PrintSheetView';

interface PrintPreviewProps {
  photoId: string;
  processedImage: string;
  size: PhotoSize;
  settings: PhotoSettings;
  onBack: () => void;
  onNew: () => void;
  onSaved?: () => void;
  onHome: () => void;
  config: AppConfig;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ 
  photoId: passedPhotoId, processedImage, size, settings, onBack, onNew, onHome, config
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [realPhotoId, setRealPhotoId] = useState<string | null>(passedPhotoId);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [sheetImages, setSheetImages] = useState<string[]>([]);
  const [printImages, setPrintImages] = useState<string[]>([]); // New state for print-optimized images

  const layout = size === PhotoSize.SIZE_3X4 ? { cols: 4, rows: 4, photoW_mm: 30, photoH_mm: 40, rotated: false, maxOnSheet: 16 }
              : size === PhotoSize.SIZE_5X5 ? { cols: 2, rows: 3, photoW_mm: 50, photoH_mm: 50, rotated: false, maxOnSheet: 6 }
              : { cols: 2, rows: 4, photoW_mm: 60, photoH_mm: 40, rotated: true, maxOnSheet: 8 };

  const totalSheets = Math.ceil(settings.printQuantity / layout.maxOnSheet);

  const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((res, rej) => { const img = new Image(); img.crossOrigin="anonymous"; img.onload=()=>res(img); img.onerror=rej; img.src=src; });

  const generateSheetCanvas = async (sheetIdx: number, photoImg: HTMLImageElement, logoImg: HTMLImageElement | null, qrImg: HTMLImageElement | null, optimizeHeight: boolean = false): Promise<string> => {
        const DPI = 300; const MM_TO_PX = DPI / 25.4;
        
        // Calculate dynamic height if optimization is enabled
        const end = Math.min((sheetIdx + 1) * layout.maxOnSheet, settings.printQuantity);
        const count = end - (sheetIdx * layout.maxOnSheet);
        const rowsUsed = Math.ceil(count / layout.cols);
        
        // Base dimensions
        const SHEET_WIDTH_MM = 130;
        let sheetHeightMm = 180;

        if (optimizeHeight) {
            // Top margin (5mm) + Content + Footer (15mm)
            const contentHeightMm = 5 + (rowsUsed * layout.photoH_mm);
            sheetHeightMm = contentHeightMm + 15;
            // Cap at 180mm
            sheetHeightMm = Math.min(sheetHeightMm, 180);
        }

        const canvas = document.createElement('canvas'); 
        canvas.width = Math.ceil(SHEET_WIDTH_MM * MM_TO_PX); 
        canvas.height = Math.ceil(sheetHeightMm * MM_TO_PX);
        
        const ctx = canvas.getContext('2d'); if (!ctx) throw new Error();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const cellW = layout.photoW_mm * MM_TO_PX; const cellH = layout.photoH_mm * MM_TO_PX;
        const startX = (canvas.width - (layout.cols * cellW)) / 2; const startY = 5 * MM_TO_PX; 
        
        // Use backgroundHex if available, otherwise try fallback lookup (legacy support), or default to white
        const bgCol = settings.background === BackgroundType.ORIGINAL 
            ? null 
            : (settings.backgroundHex || config.backgroundConfig.find(b => b.type === settings.background)?.hexColor || '#ffffff');
        
        for (let i = 0; i < count; i++) {
            const x = startX + (i % layout.cols) * cellW; const y = startY + Math.floor(i / layout.cols) * cellH;
            ctx.save(); ctx.beginPath(); ctx.rect(x, y, cellW, cellH); ctx.clip();
            if (bgCol) { ctx.fillStyle = bgCol; ctx.fillRect(x, y, cellW, cellH); }
            if (layout.rotated) { ctx.translate(x + cellW/2, y + cellH/2); ctx.rotate(-Math.PI/2); ctx.drawImage(photoImg, -cellH/2, -cellW/2, cellH, cellW); }
            else ctx.drawImage(photoImg, x, y, cellW, cellH);
            ctx.restore(); ctx.strokeStyle = '#d1d5db'; ctx.setLineDash([15, 15]); ctx.strokeRect(x, y, cellW, cellH);
        }
        
        // Footer always at the bottom of the canvas
        const footerY = canvas.height - 15 * MM_TO_PX; 
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, footerY, canvas.width, 15 * MM_TO_PX);
        ctx.beginPath(); ctx.moveTo(0, footerY); ctx.lineTo(canvas.width, footerY); ctx.strokeStyle = '#000000'; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.stroke();
        let lo = 5 * MM_TO_PX; if (logoImg) { const lh = 10 * MM_TO_PX; const lw = logoImg.width * (lh / logoImg.height); ctx.drawImage(logoImg, lo, footerY + 2.5 * MM_TO_PX, lw, lh); lo += lw + 3 * MM_TO_PX; }
        ctx.fillStyle = '#000000'; ctx.font = `bold ${5 * MM_TO_PX}px sans-serif`; ctx.fillText(config.shopName, lo, footerY + 7 * MM_TO_PX);
        if (qrImg) ctx.drawImage(qrImg, canvas.width - 17 * MM_TO_PX, footerY + 1.5 * MM_TO_PX, 12 * MM_TO_PX, 12 * MM_TO_PX);
        return canvas.toDataURL('image/png');
  };

  useEffect(() => {
     if (!qrUrl) return; 
     (async () => {
         try {
             const [p, l, q] = await Promise.all([loadImage(processedImage), config.logoUrl ? loadImage(config.logoUrl).catch(() => null) : null, loadImage(qrUrl).catch(() => null)]);
             
             // Generate Full Sheets for Preview/Download
             const sheets = []; 
             for (let i = 0; i < totalSheets; i++) sheets.push(await generateSheetCanvas(i, p, l, q, false));
             setSheetImages(sheets);

             // Generate Optimized Sheets for Printing
             const optimizedSheets = [];
             for (let i = 0; i < totalSheets; i++) optimizedSheets.push(await generateSheetCanvas(i, p, l, q, true));
             setPrintImages(optimizedSheets);

         } catch {}
     })();
  }, [qrUrl, processedImage, totalSheets, config]);

  useEffect(() => {
    (async () => {
      setIsSaving(true); 
      const id = await savePhotoToCloud({ 
        id: passedPhotoId, 
        dataUrl: processedImage, 
        timestamp: Date.now(), 
        settings 
      });
      if (id) { 
        setRealPhotoId(id); 
        const v = `${window.location.href.split('?')[0]}?photoId=${id}`; 
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(v)}&ecc=H`); 
      }
      setIsSaving(false);
    })();
  }, []); 

  const handleDownload = () => { sheetImages.forEach((d, i) => { const l = document.createElement('a'); l.href = d; l.download = `Photo-Sheet-${i+1}.png`; l.click(); }); };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-gray-900 relative min-h-[100dvh]">
      {/* Print Portal uses the OPTIMIZED (dynamic height) images */}
      {document.getElementById('print-mount') && createPortal(<div className="print-portal-root">{printImages.map((s, i) => <div key={i} className="sheet-page"><img src={s} alt="" /></div>)}</div>, document.getElementById('print-mount')!)}
      
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center z-20 shrink-0 sticky top-0">
        <h1 className="text-lg md:text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">🖨️ {t('print.header', config)}</h1>
        <button onClick={onBack} className="px-3 py-1.5 md:px-4 md:py-2 text-sm font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg">{t('btn.back', config)}</button>
      </header>
      
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto flex flex-col md:flex-row p-4 md:p-8 gap-8 bg-slate-100 dark:bg-gray-900 pb-safe">
        
        {/* Preview Area (Shows FULL 13x18 images) */}
        <div className="w-full flex-1 flex flex-col items-center">
             <PrintSheetView sheetImages={sheetImages} isSaving={isSaving} config={config} />
        </div>
        
        {/* Controls Area (Stacked at bottom on mobile) */}
        <div className="w-full md:w-80 shrink-0">
            <PrintSidebar 
                photoId={realPhotoId}
                isSaving={isSaving}
                sheetImages={sheetImages}
                qrUrl={qrUrl}
                settings={settings}
                config={config}
                onPrint={() => window.print()}
                onDownload={handleDownload}
                onHome={onHome}
            />
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;
