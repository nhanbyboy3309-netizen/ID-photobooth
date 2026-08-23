
import React, { useState, useEffect } from 'react';
import PhotoBooth, { ServiceSession } from './components/PhotoBooth';
import AdminDashboard from './components/AdminDashboard';
import PhotoViewer from './components/PhotoViewer';
import MobileCaptureClient from './components/MobileCaptureClient';
import { AppConfig, PhotoSize } from './types';
import { getConfig, applyTheme, applyThemeMode, updateFavicon, saveConfig } from './services/configService';
import { getAppConfigFromCloud } from './services/databaseService';
import { t } from './services/i18n';
import { decodeServiceToken, verifyOrderPaid, SERVICE_ENTRY_API_KEY } from './services/photoMomentsBridge';

const App: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [config, setConfig] = useState<AppConfig>(getConfig());
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  
  const [viewerPhotoId, setViewerPhotoId] = useState<string | null>(null);
  const [mobileSessionId, setMobileSessionId] = useState<string | null>(null);
  const [mobileInitialSize, setMobileInitialSize] = useState<PhotoSize>(PhotoSize.SIZE_4X6);

  const [boothKey, setBoothKey] = useState(0);

  // Đơn dịch vụ chuyển sang từ photo-moments (?mode=service&orderId=&token=&apiKey=)
  const [serviceEntryStatus, setServiceEntryStatus] = useState<'idle' | 'verifying' | 'ready' | 'error'>('idle');
  const [serviceEntryError, setServiceEntryError] = useState('');
  const [serviceSession, setServiceSession] = useState<ServiceSession | null>(null);

  useEffect(() => {
    const loadedConfig = getConfig();
    let finalConfig = { ...loadedConfig };
    
    const params = new URLSearchParams(window.location.search);

    const querySurl = params.get('surl');
    if (querySurl) {
        finalConfig.googleScriptUrl = decodeURIComponent(querySurl);
        saveConfig(finalConfig);
    }

    setConfig(finalConfig);
    applyTheme(finalConfig.themeColorHex);
    applyThemeMode(finalConfig.themeMode);
    updateFavicon(finalConfig.logoUrl);

    const syncCloudConfig = async () => {
        if (finalConfig.googleScriptUrl) {
            const cloudConfig = await getAppConfigFromCloud();
            if (cloudConfig) {
                const mergedConfig = { ...cloudConfig, googleScriptUrl: finalConfig.googleScriptUrl };
                setConfig(mergedConfig);
                saveConfig(mergedConfig);
                applyTheme(mergedConfig.themeColorHex);
                applyThemeMode(mergedConfig.themeMode);
                updateFavicon(mergedConfig.logoUrl);
            }
        }
    };
    syncCloudConfig();
    
    const photoId = params.get('photoId');
    if (photoId) setViewerPhotoId(photoId);

    const mobileSession = params.get('mobileSession');
    if (mobileSession) {
        setMobileSessionId(mobileSession);
        const sizeParam = params.get('size') as PhotoSize;
        if (sizeParam && Object.values(PhotoSize).includes(sizeParam)) {
            setMobileInitialSize(sizeParam);
        }
    }

    // Đơn dịch vụ đã thanh toán từ photo-moments — xác minh rồi vào thẳng bước chụp.
    // Hỗ trợ 2 dạng URL, cả 2 đều BẮT BUỘC verifyOrderPaid trước khi cho vào chụp:
    //  1) ?mode=service&orderId=&token=&apiKey=  (chuẩn, dùng từ photo-moments Cart.tsx)
    //  2) ?orderId=&size=&qty=                   (dạng đơn giản — "integration mode" cũ,
    //     trước đây KHÔNG xác minh thanh toán, đây là bản xây lại có xác minh)
    const mode = params.get('mode');
    const rawOrderId = params.get('orderId');

    if (mode === 'service' || rawOrderId) {
        const tokenParam = params.get('token');
        const apiKeyParam = params.get('apiKey');

        const runVerification = async () => {
            setServiceEntryStatus('verifying');

            let orderIdParam: string | null;
            let sizeParam: string;
            let qtyParam: number;

            if (mode === 'service') {
                // Dạng chuẩn: bắt buộc apiKey + token hợp lệ.
                if (apiKeyParam !== SERVICE_ENTRY_API_KEY) {
                    setServiceEntryError('Liên kết không hợp lệ (sai apiKey).');
                    setServiceEntryStatus('error');
                    return;
                }
                if (!rawOrderId || !tokenParam) {
                    setServiceEntryError('Liên kết thiếu thông tin đơn hàng.');
                    setServiceEntryStatus('error');
                    return;
                }
                const decoded = decodeServiceToken(tokenParam);
                if (!decoded || decoded.orderId !== rawOrderId) {
                    setServiceEntryError('Liên kết không hợp lệ (token sai định dạng).');
                    setServiceEntryStatus('error');
                    return;
                }
                orderIdParam = rawOrderId;
                sizeParam = decoded.size;
                qtyParam = decoded.qty || 4;
            } else {
                // Dạng đơn giản: chỉ có orderId/size/qty trực tiếp trên URL.
                orderIdParam = rawOrderId;
                sizeParam = params.get('size') || '4x6';
                qtyParam = params.get('qty') ? parseInt(params.get('qty')!, 10) : 4;
            }

            // Bước xác minh THẬT — đây là chỗ bản cũ bị thiếu, đã sửa: dù vào theo
            // dạng URL nào cũng phải xác nhận đơn hàng đã thanh toán mới cho chụp.
            const isPaid = await verifyOrderPaid(orderIdParam!);
            if (!isPaid) {
                setServiceEntryError(`Không tìm thấy đơn hàng ${orderIdParam} đã thanh toán. Vui lòng liên hệ nhân viên hỗ trợ.`);
                setServiceEntryStatus('error');
                return;
            }

            const size = Object.values(PhotoSize).includes(sizeParam as PhotoSize)
                ? (sizeParam as PhotoSize)
                : PhotoSize.SIZE_4X6;

            setServiceSession({ size, quantity: qtyParam || 4 });
            setServiceEntryStatus('ready');
            setBoothKey(prev => prev + 1);
            setIsStarted(true);
        };

        runVerification();
    }
  }, []);

  const handleStart = () => {
    setBoothKey(prev => prev + 1);
    setIsStarted(true);
  };

  const handleHome = () => {
    setIsStarted(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPass = config.adminPassword || 'admin';
    if (adminPass === targetPass) {
      setIsAdminMode(true);
      setShowAdminLogin(false);
      setAdminPass('');
    } else {
      alert('Sai mật khẩu!');
    }
  };

  if (serviceEntryStatus === 'verifying') {
      return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-300 font-medium">Đang xác minh đơn hàng...</p>
          </div>
        </div>
      );
  }

  if (serviceEntryStatus === 'error') {
      return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl">!</div>
            <h2 className="text-xl font-bold text-white">Không thể mở phiên chụp</h2>
            <p className="text-slate-400 text-sm">{serviceEntryError}</p>
          </div>
        </div>
      );
  }

  if (mobileSessionId) {
      return <MobileCaptureClient sessionId={mobileSessionId} config={config} initialSize={mobileInitialSize} />;
  }

  if (viewerPhotoId) {
    return <PhotoViewer photoId={viewerPhotoId} config={config} />;
  }

  if (isAdminMode) {
    return (
      <AdminDashboard 
        currentConfig={config}
        onUpdateConfig={(newConfig) => {
          setConfig(newConfig);
          applyTheme(newConfig.themeColorHex);
          applyThemeMode(newConfig.themeMode);
          updateFavicon(newConfig.logoUrl);
        }}
        onExit={() => setIsAdminMode(false)}
      />
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-6 relative overflow-x-hidden font-sans">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-600/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3"></div>

        <div className="text-center space-y-10 animate-fadeIn z-10 max-w-2xl w-full relative">
          <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto group">
             {config.logoUrl ? (
                <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl flex items-center justify-center transform rotate-6 group-hover:rotate-0 transition-all duration-500 ease-out border-4 border-slate-50 overflow-hidden">
                   <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                </div>
             ) : (
                <>
                  <div className="absolute inset-0 bg-brand-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl flex items-center justify-center transform rotate-6 group-hover:rotate-0 transition-all duration-500 ease-out border-4 border-slate-50">
                      <svg className="w-16 h-16 md:w-24 md:h-24 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </div>
                </>
             )}
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">{config.welcomeTitle} <span className="text-brand-500">Pro</span></h1>
            <p className="text-slate-400 text-base md:text-xl max-w-lg mx-auto leading-relaxed">{config.welcomeSubtitle}</p>
          </div>

          <button onClick={handleStart} className="group relative px-8 py-4 md:px-10 md:py-5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-2xl font-bold text-xl md:text-2xl shadow-xl transition-all duration-300 flex items-center gap-4 mx-auto overflow-hidden ring-4 ring-white/10 active:scale-95">
            <span>{t('btn.start', config)}</span>
            <svg className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </div>
        
        <button onClick={() => setShowAdminLogin(true)} className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white rounded-full transition-all backdrop-blur-sm border border-white/5 hover:border-white/20 group z-50">
          <span className="text-[10px] font-black uppercase tracking-wider">Admin</span>
        </button>

        {showAdminLogin && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl w-80 shadow-2xl dark:bg-gray-800 border dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">{t('btn.login', config)}</h3>
                <button onClick={() => setShowAdminLogin(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
              </div>
              <form onSubmit={handleAdminLogin}>
                <input type="password" autoFocus placeholder="Mật khẩu..." value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full border border-gray-300 rounded-xl py-2.5 px-4 mb-4 focus:ring-2 focus:ring-brand-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                <button type="submit" className="w-full py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg transform active:scale-95">{t('btn.login', config)}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full font-sans flex flex-col overflow-hidden bg-white dark:bg-gray-900">
      <PhotoBooth key={boothKey} config={config} onHome={handleHome} serviceSession={serviceSession} />
    </div>
  );
};

export default App;
