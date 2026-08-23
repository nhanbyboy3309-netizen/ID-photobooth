
export enum PhotoSize {
  SIZE_3X4 = '3x4',
  SIZE_4X6 = '4x6',
  SIZE_5X5 = '5x5' // US Visa / International
}

export enum BackgroundType {
  WHITE = 'white',
  BLUE = 'blue',
  GRAY = 'gray', // Added neutral gray
  ORIGINAL = 'original'
}

export enum AppStep {
  CONFIG = 'config', // New start screen
  CAPTURE = 'capture',
  EDIT = 'edit',
  PRINT = 'print'
}

export enum SkinToneType {
  NATURAL = 'natural', // Tự nhiên
  FAIR = 'fair',       // Trắng sáng
  ROSY = 'rosy',       // Trắng hồng
  TAN = 'tan'          // Ngăm khỏe
}

export interface BeautySettings {
  // Skin
  smoothSkin: number;        // 0-100 (AI Strength)
  blemishIntensity: number;  // 0-100 (AI Strength) - Replaced boolean
  
  // Skin Tone (Client-side)
  skinToneType: SkinToneType;
  skinToneIntensity: number; // 0-100

  // Lighting & Contrast (Client-side)
  lighting: number;          // -50 to +50
  contrast: number;          // -50 to +50

  // Detailed Makeup (AI)
  lipstickColor: string;     // ID or Label from config
  lipstickIntensity: number; // 0-100
  
  blushColor: string;        // ID or Label from config
  blushIntensity: number;    // 0-100
  
  // New Features
  eyebrowIntensity: number;  // 0-100 (Kẻ chân mày)
  eyelashIntensity: number;  // 0-100 (Kẻ lông mi) - NEW
  contourIntensity: number;  // 0-100 (Tạo khối)
  
  // Hair Features
  hairVolume: number;        // 0-100 (Làm dày/đều tóc)
  hairStyle?: 'original' | 'short' | 'long'; // New Hair Style Option
  hairColor?: string;        // ID or Label from config
  
  makeupStyle: 'natural' | 'grooming'; // Basic vs Full
}

export interface PhotoSettings {
  size: PhotoSize;
  background: BackgroundType;
  backgroundHex?: string; // New: Supports custom hex colors from config
  clothingPrompt?: string;
  beauty: BeautySettings; 
  printQuantity: number;
  phoneNumber?: string; 
}

export interface SavedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
  settings: PhotoSettings;
}

export interface ClothingItem {
  id: string;
  label: string;
  gender: 'male' | 'female';
  icon: string; // Emoji or URL
  prompt: string;
  color: string; // Tailwind class for border/bg
}

export interface LipstickOption {
  id: string;
  label: string;
  hex: string;
}

export interface BlushOption {
  id: string;
  label: string;
  hex: string;
}

export interface HairColorOption {
  id: string;
  label: string; // Used for AI Prompt
  hex: string;   // Used for UI Display
}

export interface BackgroundConfigItem {
  id?: string; // Optional ID for management
  type: BackgroundType;
  label: string;
  hexColor: string; // For UI preview and AI generation
}

export type AIModelType = 'gemini-3.1-flash-lite-image' | 'gemini-3.1-flash-image' | 'gemini-3-pro-image';
export type AIModelSelectionMode = 'auto' | 'manual';

export interface AppConfig {
  shopName: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  contactPhone: string;
  contactZalo: string;
  printFooterText: string;
  themeColorHex: string; // Base HEX color to generate brand palette
  themeMode: 'light' | 'dark' | 'system'; // New: Theme Mode
  language: 'vi' | 'en'; // New: Language
  clothingOptions: ClothingItem[];
  
  lipstickOptions: LipstickOption[];
  blushOptions: BlushOption[];
  hairColorOptions: HairColorOption[]; 
  backgroundConfig: BackgroundConfigItem[];
  photoRules: Record<string, string[]>; 

  adminPassword?: string;
  logoUrl?: string;

  googleScriptUrl?: string;

  // Print sheet footer branding toggles
  printShowLogo?: boolean; // default true
  printShowQr?: boolean;   // default true

  // AI Model Configurations
  geminiApiKey?: string; // Ghi đè GEMINI_API_KEY trên server nếu có; để trống thì server dùng biến môi trường
  aiModelMode?: AIModelSelectionMode; // 'auto' | 'manual'
  aiManualModel?: AIModelType; // default 'gemini-3.1-flash-image'
  aiSimpleModel?: AIModelType; // default 'gemini-3.1-flash-image'
  aiComplexModel?: AIModelType; // default 'gemini-3-pro-image'

  // Custom Content Section for StartScreen
  customContentHtml?: string;
  customContentBgColor?: string;
  customContentTextColor?: string;
  customContentSize?: 'sm' | 'md' | 'lg';
  customContentImageUrl?: string; // New: Image for ads
  customContentLinkUrl?: string;  // New: Link for ads
}
