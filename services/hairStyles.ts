import { AppConfig, HairStyleOption } from '../types';

// Default ID-photo hairstyles; admins can add, edit or remove them (AppConfig.hairStyleOptions).
// `prompt` describes only the target style: hairline, hair color and texture are kept by the
// hair edit in geminiService.
export const DEFAULT_HAIR_STYLES: HairStyleOption[] = [
  { id: 'm_side_part', label: 'Rẽ ngôi lệch', gender: 'male', prompt: 'a classic short side-part haircut, neatly combed to one side' },
  { id: 'm_slick_back', label: 'Vuốt ngược', gender: 'male', prompt: 'short sides with the top neatly combed back, forehead fully visible' },
  { id: 'm_crop', label: 'Ngắn gọn', gender: 'male', prompt: 'a short, neat textured crop with a short fringe well above the eyebrows' },
  { id: 'm_crew_cut', label: 'Húi cua', gender: 'male', prompt: 'a very short, tidy crew cut' },
  { id: 'm_undercut', label: 'Undercut', gender: 'male', prompt: 'short faded sides with a longer top neatly combed to the side' },
  { id: 'f_tied_back', label: 'Buộc gọn sau', gender: 'female', prompt: 'hair pulled back neatly into a low ponytail behind the head, forehead and ears visible' },
  { id: 'f_low_bun', label: 'Búi thấp', gender: 'female', prompt: 'hair gathered neatly into a low bun at the back of the head, forehead and ears visible' },
  { id: 'f_long_tucked', label: 'Dài, vén tai', gender: 'female', prompt: 'long straight hair, neatly tucked behind the ears and falling behind the shoulders' },
  { id: 'f_shoulder', label: 'Ngang vai', gender: 'female', prompt: 'neat straight shoulder-length hair, tucked behind the ears' },
  { id: 'f_bob', label: 'Bob ngắn', gender: 'female', prompt: 'a neat short bob ending just below the jawline, tucked behind the ears' },
];

// The cloud config is used as-is (not merged with defaults), so it may predate hairstyles.
export const getHairStyles = (config?: Partial<AppConfig> | null): HairStyleOption[] =>
  Array.isArray(config?.hairStyleOptions) ? config!.hairStyleOptions! : DEFAULT_HAIR_STYLES;

export const findHairStyle = (config: Partial<AppConfig> | null | undefined, id?: string) =>
  getHairStyles(config).find((s) => s.id === id);
