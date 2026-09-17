import { BackgroundType, BeautySettings, PhotoSize } from "../types";
import { getConfig } from "./configService";

/* =========================================================
   DETERMINE APPROPRIATE AI MODEL
========================================================= */

export interface AIModelSelectionResult {
  model: string;
  isComplex: boolean;
  reason: string;
}

export const determineAIModel = (
  bgType: BackgroundType,
  bgHex: string | undefined,
  clothingPrompt: string | undefined,
  beauty: BeautySettings,
  aiConfig?: {
    aiModelMode?: 'auto' | 'manual';
    aiManualModel?: string;
    aiSimpleModel?: string;
    aiComplexModel?: string;
  }
): AIModelSelectionResult => {
  const mode = aiConfig?.aiModelMode || 'auto';
  const simpleModel = aiConfig?.aiSimpleModel || 'gemini-3.1-flash-image';
  const complexModel = aiConfig?.aiComplexModel || 'gemini-3-pro-image';
  const manualModel = aiConfig?.aiManualModel || 'gemini-3.1-flash-image';

  const safeBeauty = beauty || ({} as BeautySettings);
  const hasClothing = Boolean(clothingPrompt && clothingPrompt.trim().length > 0);
  const hasSkinEdit = (safeBeauty.smoothSkin || 0) > 0 || (safeBeauty.blemishIntensity || 0) > 0;
  const hasMakeup =
    (safeBeauty.lipstickIntensity || 0) > 0 ||
    (safeBeauty.blushIntensity || 0) > 0 ||
    (safeBeauty.eyebrowIntensity || 0) > 0 ||
    (safeBeauty.eyelashIntensity || 0) > 0 ||
    (safeBeauty.contourIntensity || 0) > 0;
  const hasHairEdit =
    (safeBeauty.hairVolume || 0) > 0 ||
    (safeBeauty.hairStyle && safeBeauty.hairStyle !== 'original') ||
    (safeBeauty.hairColor &&
      safeBeauty.hairColor !== 'original' &&
      safeBeauty.hairColor !== 'Màu gốc');

  const isComplex = hasClothing || hasSkinEdit || hasMakeup || hasHairEdit;

  if (mode === 'manual') {
    return {
      model: manualModel,
      isComplex,
      reason: `Chế độ Admin chọn thủ công: ${manualModel}`,
    };
  }

  if (isComplex) {
    const reasons: string[] = [];
    if (hasClothing) reasons.push("thay trang phục");
    if (hasSkinEdit) reasons.push("làm mịn/sạch mụn");
    if (hasMakeup) reasons.push("trang điểm AI");
    if (hasHairEdit) reasons.push("chỉnh sửa tóc");

    return {
      model: complexModel,
      isComplex: true,
      reason: `Tự động chuyển model ${complexModel} do tác vụ phức tạp (${reasons.join(", ")})`,
    };
  }

  return {
    model: simpleModel,
    isComplex: false,
    reason: `Tự động dùng model mặc định ${simpleModel} xử lý nhanh phông nền & màu sắc`,
  };
};

/* =========================================================
   ANALYZE WEBCAM FRAME (GUIDANCE ONLY)
========================================================= */

export const analyzeIDPhotoFrame = async (
  base64Frame: string
): Promise<{
  isCompliant: boolean;
  status: "VALID" | "ADJUSTING" | "INVALID";
  feedback: string;
  instruction: string;
  faceDetected: boolean;
}> => {
  try {
    const apiKey = getConfig().geminiApiKey;
    const response = await fetch("/api/gemini/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Frame, apiKey: apiKey || undefined })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "SERVER_ERROR");
    }

    return await response.json();
  } catch (err) {
    console.error("Camera analysis error:", err);
    return {
      isCompliant: false,
      status: "ADJUSTING",
      feedback: "AI tạm thời không khả dụng",
      instruction: "Giữ nguyên tư thế",
      faceDetected: false
    };
  }
};

/* =========================================================
   PROCESS ID PHOTO (MAIN PIPELINE)
========================================================= */

export const processIDPhoto = async (
  imageBase64: string,
  bgType: BackgroundType,
  bgHex: string | undefined,
  clothingPrompt: string | undefined,
  beauty: BeautySettings,
  size: PhotoSize,
  targetModel?: string
): Promise<string> => {
  
  /* ---------------- SAFETY CLAMPS ---------------- */

  const safeBeauty = beauty || {} as BeautySettings;
  const smoothSkin = Math.min(safeBeauty.smoothSkin || 0, 70);
  const blemish = Math.min(safeBeauty.blemishIntensity || 0, 80);
  const contour = Math.round(((safeBeauty.contourIntensity || 0) / 100) * 40);
  const eyebrow = Math.round(((safeBeauty.eyebrowIntensity || 0) / 100) * 60);
  const eyelash = Math.round(((safeBeauty.eyelashIntensity || 0) / 100) * 50);

  /* ---------------- BACKGROUND ---------------- */

  const backgroundMode =
    bgType === BackgroundType.ORIGINAL ? "NONE" : "CUSTOM";

  const backgroundColor =
    bgType === BackgroundType.ORIGINAL ? "N/A" : bgHex;

  /* =========================================================
     FINAL SYSTEM PROMPT
  ========================================================= */

  const systemPrompt = `ROLE: Professional ID photo retouching AI. Priority 1 (never violate): preserve biometric identity exactly. Priority 2: apply the requested cosmetic beautification fully and well — do not under-apply it out of excess caution.

IDENTITY LOCK — hard rule, always: face shape, bone structure, proportions, and the exact position/size/shape of eyes, nose, mouth, eyebrows, and ears must stay identical to the original. No reshaping, resizing, or repositioning of any facial feature. Never add or remove moles, freckles, scars, or birthmarks. Never invent skin texture or interpret noise as facial features. Always compare against the original image; do not re-detect or reinterpret geometry. If no face is found or it is incomplete, output the original image unchanged. Apply ONLY the edits specified below, nothing else.

MANDATORY FIRST STEP — RELIGHT THE SUBJECT: the input photo may have colored/directional lighting (sunset, tungsten indoor light, window light, shade). Before anything else, re-render the subject (face, neck, hair, clothing) as if photographed today in a professional ID-photo studio: flat, neutral white (6500K) light from the front, no color cast, no warm/cool tint, no directional shadow on one side of the face. This is a mandatory global relight/white-balance pass, applied even if no other edit is requested — it changes color and light only, identity/geometry/pose stay exactly as in IDENTITY LOCK above.

ALLOWED — cosmetic surface edits (color/texture only, never geometry; this IS the requested beautification, apply it at the given intensity, not just minimally):
- Skin: smoothing ${smoothSkin}/100, blemish cleanup ${blemish}/100 — subtractive retouching that removes blemishes, redness, and uneven texture, preserve identity marks, no new texture/pores added. Keep skin looking natural and photorealistic, never plastic/waxy/airbrushed/CGI-smooth — even at the highest smoothing intensity, retain a subtle, visible layer of natural pore texture and skin grain so the result still reads as real human skin, not a blurred filter. Apply identically to all visible skin, including the neck and any visible chest/décolletage skin, not just the face — tone, smoothness, and the relighting above must match seamlessly across face and neck with no visible seam or color break at the jawline.
- Makeup: lip color=${safeBeauty.lipstickColor || "NONE"} intensity ${safeBeauty.lipstickIntensity || 0}/100; blush intensity ${safeBeauty.blushIntensity || 0}/100; contour (shading only) ${contour}/100.
- Eyebrows: color/definition enhancement along the existing shape, intensity ${eyebrow}/100 — do not reshape. Eyelashes: enhance existing lashes, intensity ${eyelash}/100.
- Hair: tidy the existing hairstyle only, volume ${safeBeauty.hairVolume || 0}/100, color=${safeBeauty.hairColor || "ORIGINAL"}. Do not invent a new hairstyle.
- Posture: global rotation/translation/uniform scale only, no local warping.
- Background: mode=${backgroundMode}, color=${backgroundColor}. Flat solid color — no gradient, shadow, or blur.
- Sharpness: increase overall image clarity and fine detail — crisp eyes, eyebrows, eyelashes, individual hair strands, fabric texture, and edge definition. Remove any camera blur/softness. Do not sharpen past the point of adding noise or halo artifacts, and do not let this counteract the skin smoothing above — sharpen detail elsewhere, keep smoothed skin areas smooth.
Lock facial pixels once Phase 1 is complete.

PHASE 2 — Clothing only, face LOCKED: ${clothingPrompt ? `enabled, prompt="${clothingPrompt}"` : "disabled"}.
Edit strictly below the jawline — the jawline is an absolute boundary. Zero feathering, zero blur, zero overlap with skin. Neck shape and position unchanged. If any facial or neck pixel would be affected, cancel the clothing edit and output the Phase 1 result instead.

OUTPUT: PNG, high quality, base64, no text, no metadata, no explanation.`;

  try {
    const apiKey = getConfig().geminiApiKey;
    const response = await fetch("/api/gemini/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, systemPrompt, model: targetModel, apiKey: apiKey || undefined })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "SERVER_ERROR");
    }

    const data = await response.json();
    return data.image;

  } catch (err: any) {
    console.error("ID photo processing error:", err);

    if (err.message?.includes("429")) throw new Error("AI_QUOTA_EXCEEDED");
    if (err.message?.includes("404")) throw new Error("MODEL_NOT_FOUND");
    if (err.message?.includes("leaked")) throw new Error("API_KEY_LEAKED_CONTACT_ADMIN");

    throw err;
  }
};
