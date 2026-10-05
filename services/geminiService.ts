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

// Must match the camera/crop ratios, otherwise the model may return a different
// shape that later gets stretched into the print cell and distorts the face.
const ASPECT_RATIO_BY_SIZE: Record<PhotoSize, string> = {
  [PhotoSize.SIZE_3X4]: "3:4",
  [PhotoSize.SIZE_4X6]: "2:3",
  [PhotoSize.SIZE_5X5]: "1:1",
};

// Exact slider percentage plus anchor points, so the model scales the effect
// continuously with every 1% instead of jumping between fixed levels.
const smoothPrompt = (v: number) =>
  `strength exactly ${v}% on a 0–100% scale, scaled proportionally between these anchors: ` +
  `1% = only even out the skin tone slightly and reduce oily shine, pores and natural skin texture fully kept as in the original; ` +
  `50% = noticeably smoother, more even skin with pores slightly refined but still clearly visible; ` +
  `100% = the most beautiful, flawless-looking skin that is still unmistakably real human skin — very smooth and even with pores mostly refined, yet keeping a faint natural skin grain and the natural light and shadow of the face.`;

const blemishPrompt = (v: number) =>
  `strength exactly ${v}% on a 0–100% scale, scaled proportionally between these anchors: ` +
  `1% = remove only the single most noticeable acne spot; ` +
  `100% = remove all temporary blemishes — acne, red spots, marks, redness and under-eye darkness — for a clean, even complexion.`;

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
  const smoothSkin = safeBeauty.smoothSkin || 0;
  const blemish = safeBeauty.blemishIntensity || 0;
  const contour = Math.round(((safeBeauty.contourIntensity || 0) / 100) * 40);
  const eyebrow = Math.round(((safeBeauty.eyebrowIntensity || 0) / 100) * 60);
  const eyelash = Math.round(((safeBeauty.eyelashIntensity || 0) / 100) * 50);

  // Image models follow verbal strength far more reliably than "N/100" scores.
  const level = (v: number) =>
    v <= 30 ? "subtle" : v <= 60 ? "moderate" : "clearly visible but still natural";

  /* ---------------- EDIT LIST (only what was requested) ---------------- */

  const edits: string[] = [
    `Color & light: correct it the way a photo editor would — neutral white balance (remove any yellow, orange, green or blue cast), even exposure, softly lift harsh shadows on the face, true-to-life skin color. This is a tonal adjustment of the existing pixels, not a redraw.`,
  ];

  if (smoothSkin > 0 || blemish > 0) {
    const blemishText = blemish > 0 ? `Blemish removal: ${blemishPrompt(blemish)}` : "Blemishes: leave as they are.";
    const smoothText = smoothSkin > 0
      ? `Smoothing: ${smoothPrompt(smoothSkin)}`
      : "Smoothness: keep the original pores and skin texture unchanged.";
    edits.push(`Skin on the face, neck and any visible chest, retouched consistently with no seam or color break at the jawline. ${blemishText} ${smoothText} At every level the result must look like a real person's skin, never plastic, waxy, blurred or airbrushed.`);
  }

  const makeupParts: string[] = [];
  if ((safeBeauty.lipstickIntensity || 0) > 0) makeupParts.push(`${safeBeauty.lipstickColor} lip color, ${level(safeBeauty.lipstickIntensity)}, exactly inside the existing lip outline`);
  if ((safeBeauty.blushIntensity || 0) > 0) makeupParts.push(`${safeBeauty.blushColor} blush on the cheeks, ${level(safeBeauty.blushIntensity)}`);
  if (contour > 0) makeupParts.push(`${level(contour)} soft contour shading (color only, no reshaping)`);
  if (eyebrow > 0) makeupParts.push(`fill and define the eyebrows within their exact existing shape, ${level(eyebrow)}`);
  if (eyelash > 0) makeupParts.push(`darken and define the existing eyelashes, ${level(eyelash)}`);
  if (makeupParts.length) edits.push(`Makeup: ${makeupParts.join("; ")}.`);

  const hairColor = safeBeauty.hairColor;
  const hasHairColor = Boolean(hairColor && !/^(original|màu gốc)$/i.test(hairColor));
  const hairParts: string[] = [];
  if ((safeBeauty.hairVolume || 0) > 0) hairParts.push(`tidy flyaways and add ${level(safeBeauty.hairVolume)} volume`);
  if (safeBeauty.hairStyle === "short") hairParts.push("make the hair look neatly shorter and tidier");
  if (safeBeauty.hairStyle === "long") hairParts.push("extend the hair naturally to a longer length with the same color and texture");
  if (hasHairColor) hairParts.push(`recolor the hair to ${hairColor} with natural shading`);
  if (hairParts.length) edits.push(`Hair: ${hairParts.join("; ")}. Keep the same hairline and part, and do not cover or change the outline of the face.`);

  edits.push(
    bgType === BackgroundType.ORIGINAL || !bgHex
      ? "Background: keep the original background unchanged."
      : `Background: replace it with a perfectly flat, uniform solid color ${bgHex} — no gradient, shadow, texture or vignette. Clean, natural edges around the hair and shoulders, no halo or color fringe.`
  );

  if (clothingPrompt) {
    edits.push(`Clothing: replace only the clothing below the neckline with: "${clothingPrompt}". Fit it naturally to the existing shoulders and body. Do not alter the neck, jaw, face or hair.`);
  }

  /* =========================================================
     FINAL PROMPT
     Short, positive and edit-oriented on purpose: wording like "re-render",
     "add fine detail" or "apply fully" makes image models regenerate the
     face, which is what breaks biometric identity.
  ========================================================= */

  const systemPrompt = `Edit the provided ID photo. This is a retouch of a real photo of a real person, not a new picture: every part of the person's anatomy stays exactly where and how it is, and only surface color, tone and texture change as listed below.

IDENTITY — highest priority, overrides every other instruction:
- The face stays geometrically identical to the input: same face outline, jawline, chin, cheek width, forehead, hairline, and ear shape and position.
- Same eyes (size, shape, spacing, eyelid folds, iris color, gaze), same nose (length, width, nostrils), same mouth (lip shape, thickness, width), same eyebrow shape and position, same natural facial asymmetry.
- Keep moles, freckles, scars and birthmarks. Keep the exact expression, head pose, head size, framing and camera angle.
- Do not slim, enlarge, lift, symmetrize or "idealize" any feature. Do not redraw or regenerate the face, and do not invent detail that is not in the input.
- The result must pass a face-recognition match against the original. If an edit below would require changing face geometry, skip that edit.

EDITS TO APPLY:
${edits.map((e, i) => `${i + 1}. ${e}`).join("\n")}

Everything not listed above stays exactly as in the input. Output one photorealistic image with the same aspect ratio and composition as the input, no text or watermark.`;

  try {
    const apiKey = getConfig().geminiApiKey;
    const response = await fetch("/api/gemini/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64,
        systemPrompt,
        model: targetModel,
        aspectRatio: ASPECT_RATIO_BY_SIZE[size],
        apiKey: apiKey || undefined,
      })
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
