
import { AppConfig, ClothingItem, BackgroundType, PhotoSize, HairColorOption, BlushOption, LipstickOption } from "../types";

const CONFIG_KEY = 'id_photo_booth_config';

const DEFAULT_CLOTHING: ClothingItem[] = [
  { id: 'm_student_scarf', label: 'HS Khăn quàng', gender: 'male', color: 'border-red-500', icon: '🧣', prompt: 'wearing a white shirt with a red neckerchief scarf (vietnamese student uniform style)' },
  { id: 'm_student', label: 'HS Sơ mi trắng', gender: 'male', color: 'border-blue-200', icon: '👔', prompt: 'wearing a clean white formal school uniform shirt' },
  { id: 'm_shirt_blue', label: 'Sơ mi Xanh', gender: 'male', color: 'border-blue-400', icon: '👔', prompt: 'wearing a light blue formal button-down office shirt' },
  { id: 'm_vest_black', label: 'Vest Đen', gender: 'male', color: 'border-gray-800', icon: '🕴️', prompt: 'wearing a formal black business suit with white shirt and tie' },
  { id: 'm_vest_navy', label: 'Vest Navy', gender: 'male', color: 'border-blue-900', icon: '🕴️', prompt: 'wearing a formal navy blue business suit with tie' },
  { id: 'm_police', label: 'Sơ mi Công sở', gender: 'male', color: 'border-green-700', icon: '👮', prompt: 'wearing a formal beige or green professional uniform shirt' },
  { id: 'f_student_scarf', label: 'HS Khăn quàng', gender: 'female', color: 'border-red-500', icon: '🧣', prompt: 'wearing a white shirt with a red neckerchief scarf (vietnamese student uniform style)' },
  { id: 'f_student', label: 'HS Sơ mi trắng', gender: 'female', color: 'border-blue-200', icon: '👚', prompt: 'wearing a clean white formal school uniform blouse' },
  { id: 'f_aodai_white', label: 'Áo Dài Trắng', gender: 'female', color: 'border-pink-200', icon: '👘', prompt: 'wearing a traditional white Vietnamese Ao Dai with high collar' },
  { id: 'f_aodai_color', label: 'Áo Dài Màu', gender: 'female', color: 'border-purple-300', icon: '👘', prompt: 'wearing an elegant colorful traditional Vietnamese Ao Dai' },
  { id: 'f_vest_black', label: 'Vest Đen', gender: 'female', color: 'border-gray-800', icon: '💼', prompt: 'wearing a formal black women business blazer and white shirt' },
  { id: 'f_shirt_office', label: 'Sơ mi Nữ', gender: 'female', color: 'border-blue-300', icon: '👚', prompt: 'wearing a professional blue office blouse' },
];

const DEFAULT_HAIR_COLORS: HairColorOption[] = [
    { id: 'original', label: 'Màu gốc', hex: 'transparent' },
    { id: 'black', label: 'Đen Tuyền', hex: '#09090b' },
    { id: 'brown_dark', label: 'Nâu Đen', hex: '#3f2e27' },
    { id: 'brown', label: 'Nâu Hạt Dẻ', hex: '#6b4e3d' },
    { id: 'brown_light', label: 'Nâu Sáng', hex: '#8d6e63' },
    { id: 'red_dark', label: 'Đỏ Trầm', hex: '#4a0404' },
    { id: 'blonde', label: 'Vàng Sẫm', hex: '#b08d55' },
];

const DEFAULT_BLUSH: BlushOption[] = [
  { id: 'pink_soft', label: 'Hồng Nhạt', hex: '#fbcfe8' },
  { id: 'peach', label: 'Cam Đào', hex: '#fdba74' },
  { id: 'rose', label: 'Hồng Rose', hex: '#fb7185' },
];

const DEFAULT_LIPSTICKS: LipstickOption[] = [
  { id: 'red', label: 'Đỏ', hex: '#ef4444' },
  { id: 'pink', label: 'Hồng', hex: '#ec4899' },
  { id: 'orange', label: 'Cam', hex: '#f97316' },
  { id: 'nude', label: 'Nude', hex: '#d6a692' },
];

export const DEFAULT_CONFIG: AppConfig = {
  shopName: "ID Photo Booth Pro",
  welcomeTitle: "ID Photo Booth",
  welcomeSubtitle: "Giải pháp chụp ảnh thẻ tự động chuẩn sinh trắc học.",
  contactPhone: "0909000111",
  contactZalo: "0909000111",
  printFooterText: "Dịch vụ chụp ảnh thẻ lấy ngay",
  themeColorHex: "#3b82f6", 
  themeMode: 'light', // Default theme
  language: 'vi', // Default language
  clothingOptions: DEFAULT_CLOTHING,
  
  lipstickOptions: DEFAULT_LIPSTICKS,
  blushOptions: DEFAULT_BLUSH,
  hairColorOptions: DEFAULT_HAIR_COLORS,

  backgroundConfig: [
    { type: BackgroundType.WHITE, label: 'Trắng (Visa/ID)', hexColor: '#ffffff' },
    { type: BackgroundType.BLUE, label: 'Xanh (Hồ sơ)', hexColor: '#2792ff' },
    { type: BackgroundType.GRAY, label: 'Xám (CV)', hexColor: '#d1d5db' },
  ],

  photoRules: {
    [PhotoSize.SIZE_4X6]: [
      'Tỉ lệ diện tích khuôn mặt chiếm khoảng 75% diện tích ảnh.',
      'Chiều cao từ mắt lên mép trên ~2/3 chiều cao từ mắt xuống mép dưới.',
      'Mặt nhìn thẳng, lộ 2 vành tai, đầu để trần, không đeo kính.',
      'Phông nền trắng bắt buộc.',
      'Độ phân giải tối thiểu 300dpi.'
    ],
    [PhotoSize.SIZE_3X4]: [
      'Tỉ lệ diện tích khuôn mặt chiếm khoảng 75% diện tích ảnh.',
      'Mặt nhìn thẳng, lộ 2 vành tai, đầu để trần, không đeo kính.',
      'Phông nền xanh (chuẩn hồ sơ) hoặc trắng tùy đơn vị.',
      'Ảnh mới chụp không quá 6 tháng.',
      'Độ phân giải tối thiểu 300dpi.'
    ],
    [PhotoSize.SIZE_5X5]: [
      'Kích thước 51x51 mm. Ảnh vuông.',
      'Tỷ lệ khuôn mặt: 50%–69% tính từ đỉnh đầu đến cằm.',
      'Phông nền trắng tuyệt đối.',
      'Không đeo kính mắt (kể cả kính thuốc).',
      'File ảnh định dạng PNG/JPEG, tối thiểu 600x600 px.',
      'Không cười, mắt mở to, nhìn thẳng.'
    ]
  },

  adminPassword: "admin",
  logoUrl: "",
  googleScriptUrl: "https://script.google.com/macros/s/AKfycbx_azcS4UUpm8j65Z7Vv50QXY7gUBZ2TlI0zGcGk2571aUR0vY2FqwkiftG83-VLf74/exec",

  // Print sheet footer branding toggles (shown at the bottom of every printed 13x18 sheet)
  printShowLogo: true,
  printShowQr: true,

  // AI Model Defaults
  aiModelMode: 'auto',
  aiManualModel: 'gemini-3.1-flash-image',
  aiSimpleModel: 'gemini-3.1-flash-image',
  aiComplexModel: 'gemini-3-pro-image',

  // New Custom Content Defaults
  customContentHtml: "<p><b>Ưu đãi hôm nay:</b> Giảm 10% khi in từ 2 combo ảnh trở lên. Nhận file gốc miễn phí qua mã QR.</p>",
  customContentBgColor: "#eff6ff",
  customContentTextColor: "#1e40af",
  customContentSize: 'md'
};

export const saveConfig = (config: AppConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  applyTheme(config.themeColorHex);
  applyThemeMode(config.themeMode); // Apply mode
  updateFavicon(config.logoUrl);
};

export const getConfig = (): AppConfig => {
  const saved = localStorage.getItem(CONFIG_KEY);
  let config = { ...DEFAULT_CONFIG };

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge items carefully to ensure arrays and photoRules always exist
      config = {
        ...DEFAULT_CONFIG,
        ...parsed,
        clothingOptions: Array.isArray(parsed?.clothingOptions) ? parsed.clothingOptions : DEFAULT_CONFIG.clothingOptions,
        lipstickOptions: Array.isArray(parsed?.lipstickOptions) ? parsed.lipstickOptions : DEFAULT_CONFIG.lipstickOptions,
        blushOptions: Array.isArray(parsed?.blushOptions) ? parsed.blushOptions : DEFAULT_CONFIG.blushOptions,
        hairColorOptions: Array.isArray(parsed?.hairColorOptions) ? parsed.hairColorOptions : DEFAULT_CONFIG.hairColorOptions,
        backgroundConfig: Array.isArray(parsed?.backgroundConfig) ? parsed.backgroundConfig : DEFAULT_CONFIG.backgroundConfig,
        photoRules: {
          ...DEFAULT_CONFIG.photoRules,
          ...(parsed?.photoRules || {})
        }
      };
    } catch (e) {}
  }

  return config;
};

const hexToRgb = (hex?: string) => {
  if (!hex || typeof hex !== 'string') return "59 130 246";
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  return `${r} ${g} ${b}`;
};

export const applyTheme = (hexColor: string) => {
  if (!hexColor) return;
  const rgb = hexToRgb(hexColor);
  const root = document.documentElement;
  root.style.setProperty('--brand-500', rgb);
  root.style.setProperty('--brand-600', rgb);
  root.style.setProperty('--brand-700', rgb);
  root.style.setProperty('--brand-50', rgb);
  root.style.setProperty('--brand-100', rgb);
  root.style.setProperty('--brand-200', rgb);
};

export const applyThemeMode = (mode: 'light' | 'dark' | 'system') => {
  const root = document.documentElement;
  
  if (mode === 'dark') {
    root.classList.add('dark');
  } else if (mode === 'light') {
    root.classList.remove('dark');
  } else {
    // System
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

export const updateFavicon = (logoUrl?: string) => {
  const link = document.getElementById('dynamic-favicon') as HTMLLinkElement;
  if (link) {
    link.href = logoUrl || "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📸</text></svg>";
  }
};
