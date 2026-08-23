// Chọn giọng đọc (SpeechSynthesis) ưu tiên GIỌNG NỮ cho ngôn ngữ chỉ định.
// Web Speech API không có trường "gender" chính thức, nên phải đoán qua tên
// giọng — hầu hết trình duyệt/OS đặt tên giọng theo mẫu người thật hoặc có
// từ khoá "Female"/"Nữ". Nếu không đoán được, rơi về giọng đầu tiên khớp
// ngôn ngữ (hành vi cũ) để không bao giờ bị câm tiếng.
const FEMALE_HINTS = [
  'female', 'nữ', 'woman', 'girl',
  // Tên giọng nữ phổ biến của Vietnamese/English trên Chrome, Edge, macOS, Android
  'hoaimy', 'linh', 'an (natural)', 'mai', 'thu', 'huong',
  'zira', 'susan', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona',
  'google việt nam', 'google tiếng việt',
];

const MALE_HINTS = [
  'male', 'nam', 'man ', 'boy',
  'namminh', 'david', 'mark', 'daniel', 'james', 'alex', 'fred', 'george',
];

export function pickPreferredVoice(
  voices: SpeechSynthesisVoice[],
  lang: string
): SpeechSynthesisVoice | undefined {
  const langMatches = voices.filter(v => v.lang.startsWith(lang));
  if (langMatches.length === 0) return undefined;

  const isFemale = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase();
    return FEMALE_HINTS.some(hint => name.includes(hint));
  };
  const isMale = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase();
    return MALE_HINTS.some(hint => name.includes(hint));
  };

  return (
    langMatches.find(isFemale) ||
    langMatches.find(v => !isMale(v)) ||
    langMatches[0]
  );
}
