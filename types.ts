
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
  clientSmoothSkin?: number; // 0-100 (Client-side bilateral filter, Filter tab) — separate from the AI slider
  blemishIntensity: number;  // 0-100 (AI Strength) - Replaced boolean
  removeSkinMarks?: boolean; // AI: fully remove moles, scars, birthmarks (default: only faded)

  // Skin Tone (Client-side)
  skinToneType: SkinToneType;
  skinToneIntensity: number; // 0-100

  // Lighting & Contrast (Client-side)
  lighting: number;          // -50 to +50
  contrast: number;          // -50 to +50

  // Tone range adjustments (Client-side) — like Highlights/Shadows/Midtones in Lightroom
  highlights: number;        // -50 to +50 (Vùng sáng)
  shadows: number;           // -50 to +50 (Vùng tối)
  midtones: number;          // -50 to +50 (Sắc độ trung gian)

  // CMYK ink-style color adjustment (Client-side) — 0 = no ink added
  cyan: number;               // 0-100
  magenta: number;            // 0-100
  yellow: number;             // 0-100
  keyBlack: number;           // 0-100 (K / độ đậm chung)

  sharpness?: number;         // 0-100 (Client-side) DSLR-like sharpening, weak on skin

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
  hairStyle?: string;        // 'original' or an id from AppConfig.hairStyleOptions (resolved to its prompt before the AI call)
  hairColor?: string;        // ID or Label from config

  fixPosture?: boolean;      // AI: straighten head, neck and shoulders to ID-photo standard

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

export interface HairStyleOption {
  id: string;
  label: string;   // Shown in the editor
  gender: 'male' | 'female';
  prompt: string;  // Style description sent to the AI; hairline and hair color are kept separately
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
  hairStyleOptions?: HairStyleOption[]; // Missing in configs saved before hairstyles existed
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
