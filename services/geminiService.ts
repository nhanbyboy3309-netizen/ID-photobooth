import { BackgroundType, BeautySettings, PhotoSize } from "../types";
import { getConfig } from "./configService";
import type { BiometricMetric } from "../utils/faceBiometrics";

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
  const hasSkinEdit =
    (safeBeauty.smoothSkin || 0) > 0 || (safeBeauty.blemishIntensity || 0) > 0 || Boolean(safeBeauty.removeSkinMarks);
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

  const hasPosture = Boolean(safeBeauty.fixPosture);

  const isComplex = hasClothing || hasSkinEdit || hasMakeup || hasHairEdit || hasPosture;

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
    if (hasPosture) reasons.push("sửa tư thế");

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
// The always-on skin cleanup lives in the base edits; the sliders only describe
// what they add on top of it, so the two never repeat or contradict each other.
const smoothPrompt = (v: number) =>
  `strength exactly ${v}% on a 0–100% scale, scaled proportionally between these anchors: ` +
  `1% = a very light extra smoothing over the clean skin; ` +
  `50% = noticeably smoother, softer and more refined skin; ` +
  `100% = very smooth, refined, flawless-looking skin that is still unmistakably real human skin, keeping a faint natural grain and the natural light and shadow of the face.`;

const blemishPrompt = (v: number) =>
  `strength exactly ${v}% on a 0–100% scale, scaled proportionally between these anchors: ` +
  `1% = barely reduce under-eye darkness and uneven pigmentation; ` +
  `100% = fully remove under-eye darkness, sun spots and melasma.`;

const skinMarksPrompt = (removeAll: boolean) =>
  removeAll
    ? "Moles, scars, birthmarks and any remaining dark spots: remove them completely, leaving clean, flawless-looking natural skin in their place."
    : "Moles: keep them in place but fade them slightly. Scars: keep them but fade them slightly. Birthmarks and freckles: keep them.";

// A 2K output from a small capture (e.g. 480x720 cropped from a 720p webcam) is a 3.5x
// upscale: the model invents mushy, painted detail and the photo looks blurry. Ask for
// 1K unless the input really has the pixels; 1K is still far above 300 dpi for ID sizes.
const outputSizeFor = (imageBase64: string): Promise<"1K" | "2K"> =>
  new Promise((resolve) => {
    if (typeof Image === "undefined") return resolve("2K");
    const img = new Image();
    img.onload = () => resolve(Math.max(img.width, img.height) > 1400 ? "2K" : "1K");
    img.onerror = () => resolve("2K");
    img.src = imageBase64;
  });

export const processIDPhoto = async (
  imageBase64: string,
  bgType: BackgroundType,
  bgHex: string | undefined,
  clothingPrompt: string | undefined,
  beauty: BeautySettings,
  size: PhotoSize,
  targetModel?: string,
  // Measured on the original photo before the call (utils/faceBiometrics), or null if unavailable.
  faceMetrics?: BiometricMetric[] | null
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

  // Built first because the base skin-tone edit has to say makeup goes on top of it.
  const makeupParts: string[] = [];
  if ((safeBeauty.lipstickIntensity || 0) > 0) makeupParts.push(`${safeBeauty.lipstickColor} lip color, ${level(safeBeauty.lipstickIntensity)}, exactly inside the existing lip outline`);
  if ((safeBeauty.blushIntensity || 0) > 0) makeupParts.push(`${safeBeauty.blushColor} blush on the cheeks, ${level(safeBeauty.blushIntensity)}`);
  if (contour > 0) makeupParts.push(`${level(contour)} soft contour shading (color only, no reshaping)`);
  if (eyebrow > 0) makeupParts.push(`fill and define the eyebrows within their exact existing shape, ${level(eyebrow)}`);
  if (eyelash > 0) makeupParts.push(`darken and define the existing eyelashes, ${level(eyelash)}`);

  // Always applied: color & light, skin color, clean natural skin and DSLR-like image quality.
  const edits: string[] = [
    `Color & light: correct it the way a photo editor would — neutral white balance (remove any yellow, orange, green or blue cast), even exposure. Natural, soft studio light: like a large softbox in front of the face, evenly lit with gentle natural shading that keeps the face's 3D shape, no flat or overexposed look, no harsh shadows. This is a tonal adjustment of the existing pixels, not a redraw.`,
    `Skin color: one even, consistent skin color across the forehead, cheeks, nose, chin, neck and ears, with no color break between face and neck. Shift it gently toward a fair, healthy tone with a light rosy-pink undertone — a moderate, subtle change that stays close to the original skin color. Not red, no overall pink or magenta cast, not yellow or orange, not pale or grey. Even out redness, dull areas and color blotches.${makeupParts.length ? " Any makeup listed below is applied on top of this even base." : ""}`,
    `Clean, beautiful natural skin: remove skin defects — acne, pimples, red spots, dark acne marks, flaky or rough patches, visibly enlarged pores and oily shine. The skin surface becomes beautiful, healthy natural skin texture: a fine, even natural grain like real healthy skin up close — not the original rough or damaged texture, and never plastic, waxy, blurred, painted or airbrushed. ${skinMarksPrompt(Boolean(safeBeauty.removeSkinMarks))}`,
    `Image quality: the look of a photo taken with a professional DSLR camera and a sharp portrait lens — crisp focus on the eyes, eyelashes, eyebrows, lip outline and hair strands, natural micro-contrast, realistic colors, no noise, no smartphone over-processing, no beauty-filter or AI look. The sharpness must not bring out skin imperfections: skin stays clean and smooth-looking, with only its fine natural texture. Achieve this like a mild clarity/sharpening adjustment of the existing pixels, never by redrawing or inventing detail.`,
  ];

  const fixPosture = Boolean(safeBeauty.fixPosture);

  const skinExtras: string[] = [];
  if (blemish > 0) skinExtras.push(`Complexion cleanup: ${blemishPrompt(blemish)}`);
  if (smoothSkin > 0) skinExtras.push(`Smoothing: ${smoothPrompt(smoothSkin)}`);
  if (skinExtras.length) {
    edits.push(`Extra skin retouch on top of the clean skin above (face, neck and any visible chest). ${skinExtras.join(" ")} The natural-skin rule of the clean-skin edit above applies at every strength.`);
  }

  if (makeupParts.length) edits.push(`Makeup: ${makeupParts.join("; ")}.`);

  // Always present: the tidy-up is the default, and each hair option replaces only
  // the matching "keep the original ..." clause, so default and options never overlap.
  const hairColor = safeBeauty.hairColor;
  const hasHairColor = Boolean(hairColor && !/^(original|màu gốc)$/i.test(hairColor));
  // The caller passes the style description (resolved from the admin hairstyle list), or "original".
  const hairStyle = safeBeauty.hairStyle && safeBeauty.hairStyle !== "original" ? safeBeauty.hairStyle : "";
  const hairVolume = safeBeauty.hairVolume || 0;
  const hairParts = [
    "tidy for an ID photo: smooth down flyaways and stray frizzy strands, keep loose strands off the eyes",
    hairStyle
      ? `restyle it into: ${hairStyle} — adapted naturally to this person's head shape and hair texture`
      : `keep the original hairstyle, length${hairVolume > 0 ? " and part" : ", part and volume"}`,
    hairVolume > 0 ? `add ${level(hairVolume)} volume` : "",
    hasHairColor ? `recolor it to ${hairColor} with natural shading` : "keep the original hair color",
  ].filter(Boolean);
  edits.push(`Hair: ${hairParts.join("; ")}. Keep the same hairline, and do not cover or change the outline of the face.`);

  // Listed first and worded as a complete replacement: behind the "keep the pixels" identity
  // rules the model otherwise only half-did it (a faint white haze around the shoulders while
  // the room behind stayed visible).
  const replaceBackground = bgType !== BackgroundType.ORIGINAL && Boolean(bgHex);
  edits.unshift(
    replaceBackground
      ? `Background — replace it completely: every pixel that is not the person (walls, furniture, shelves, objects, floor, shadows) becomes one perfectly flat, uniform solid color ${bgHex}, edge to edge and corner to corner. Nothing of the old background may remain, not even faintly — no haze, gradient, vignette, shadow or texture. Clean, natural edges around the hair strands, shoulders and arms, with no halo or color fringe.`
      : "Background: keep the original background unchanged."
  );

  /* =========================================================
     ONE CALL, TWO ORDERED STEPS
     Real tests showed that whenever the model has to redraw the body (new clothing
     or a new pose) it redraws the face too — slimmer, "idealized", a different person.
     So the prompt orders the work: step 1 retouches the face, skin, hair and background;
     step 2 (only when clothing or posture is requested) changes the body with the face
     from step 1 locked.
     Short, positive and edit-oriented on purpose: wording like "re-render",
     "add fine detail" or "apply fully" makes image models regenerate the face.
  ========================================================= */

  // Stated explicitly when the clothing stays: with only "everything else stays" the model
  // has dropped the person's top entirely (bare shoulders) when restyling long hair.
  if (!clothingPrompt) {
    edits.push("Clothing: keep the person's original clothing exactly — same garment, neckline, color and coverage. Never remove, shrink or uncover it, also when the hair is restyled.");
  }

  const bodyEdits: string[] = [];
  // Stated as required: as a plain list item the model kept the original pose (it reads the
  // face lock as "don't move anything"). The head moves as one rigid piece, so the face is untouched.
  if (fixPosture) {
    bodyEdits.push(`Posture — required, do not skip: correct the pose to ID-photo standard, fitted to this person's own build. Rotate and move the whole head as one rigid piece, with its content unchanged, so it is upright and level (eyes on a horizontal line, no sideways tilt), chin neither raised nor lowered, facing the camera. Redraw the neck, shoulders and upper body as needed: neck straight and natural; shoulders level, symmetric and square to the camera; body centered, with the head at the usual ID-photo position and size in the frame. Keep the person's real shoulder width, neck length and body proportions, with no stretched or twisted neck, no unnatural joints and no missing or extra body parts. If the head is turned sideways, turn it toward the camera only as far as possible without changing any facial feature.`);
  }
  if (clothingPrompt) {
    bodyEdits.push(`Clothing — replace it completely: new clothing as described: "${clothingPrompt}", fitted naturally to the person's shoulders and body and covering both shoulders and the upper body down to the bottom edge of the photo. No part of the old clothing (straps, fabric, color) or of bare shoulders may show through. Natural fabric folds and soft shadows that match the light on the face.`);
  }

  const hasBodyStep = bodyEdits.length > 0;
  const bodyChanges = [fixPosture && "pose", clothingPrompt && "clothing"].filter(Boolean).join(" and ");

  const identity = `IDENTITY — highest priority, overrides every other instruction:
- The face stays geometrically identical to the input: same face outline, jawline, chin, cheek width, forehead, hairline, and ear shape and position.
- Same eyes (size, shape, spacing, eyelid folds, iris color, gaze), same nose (length, width, nostrils), same mouth (lip shape, thickness, width), same eyebrow shape and position, same natural facial asymmetry.
- Moles, freckles, scars and birthmarks are handled only as the skin edit below says. ${fixPosture ? "Keep the exact expression; head pose and framing change only in step 2." : "Keep the exact expression, head pose, head size, framing and camera angle."}
- Do not slim, enlarge, lift, symmetrize or "idealize" any feature. Do not redraw or regenerate the face, and do not invent facial detail that is not in the input.
- Compare with the original input photo throughout: after every edit, check the face side by side with the original, biometric point by point, and restore from the original anything that drifted:
  • Face structure: face length, width at the cheekbones and at the jaw, jaw angle and fullness of the cheeks, chin length and shape, forehead height.
  • Eyes: size, shape, distance between the pupils, eyelid folds, eye corners.
  • Nose: length, bridge width, nostril width and shape, tip shape.
  • Mouth: width, upper and lower lip thickness, lip shape, philtrum.
  • Proportions between them: eye spacing to face width, nose width to mouth width, eye-to-nose and nose-to-mouth distances must match the original.
  Only what the edits below explicitly change (skin, color, light, makeup tint, hair) may differ.${faceMetrics?.length ? `
- Measured biometrics of the original face (each distance divided by the distance between the pupils). The finished face must reproduce these proportions within about ±3%; check it against them before finishing:
${faceMetrics.map((m) => `  • ${m.name}: ${m.value.toFixed(3)}`).join("\n")}` : ""}
- The result must pass a face-recognition match against the original. If an edit below would require changing face geometry, skip that edit.${fixPosture ? " Rotating or moving the whole head as one rigid piece is not a change of face geometry." : ""}`;

  const step1 = `${edits.map((e, i) => `${i + 1}. ${e}`).join("\n")}
${replaceBackground ? "\nThe background edit must be done completely; the identity rules above protect the person, not the old background." : ""}`;

  const systemPrompt = hasBodyStep
    ? `Edit the provided ID photo. This is a retouch of a real photo of a real person, not a new picture. Work in two steps, strictly in this order, and output only the final result.

${identity}

STEP 1 — FACE, SKIN, HAIR AND BACKGROUND. Do these on the original photo; leave the ${bodyChanges} for step 2:
${step1}

STEP 2 — ${fixPosture && clothingPrompt ? "POSTURE AND CLOTHING" : fixPosture ? "POSTURE" : "CLOTHING"} ONLY, on the result of step 1.

CRITICAL IDENTITY PRESERVATION — overrides everything in step 2:
Use the original input photo as the identity reference. DO NOT regenerate, redraw, reinterpret, beautify or modify the person's face.
PROTECTED ZONE — keep exactly as finished in step 1:
- Facial identity and facial geometry: face outline, jaw, chin, cheeks, forehead.
- Eyes, eyebrows, nose, mouth and ears.
- Skin texture, skin color and natural facial details, with the same light and sharpness.
- The original expression and gaze direction.
- Hairline and hairstyle.
${fixPosture ? "- The head may only be rotated or moved as one rigid piece, exactly as the posture edit says; nothing inside it changes." : "- The head's exact position, size and angle, and the same framing — no zoom, crop or reframing."}
EDITABLE ZONE — the only area step 2 may change:
${clothingPrompt ? "- The clothing: shirt, collar, jacket or vest, tie.\n" : ""}- The shoulders and upper body${fixPosture ? ", and the neck as the posture edit needs" : ", only as far as the new clothing needs"}.
${clothingPrompt ? "- Fabric folds, stitching and shadows on the clothing.\n" : ""}Do not modify any pixels outside the editable zone. When step 2 is done, compare the face once more with the original input photo: it must be the same person with the same features, and only the step-1 retouch may differ.

${bodyEdits.map((e, i) => `${i + 1}. ${e}`).join("\n")}
The background from step 1 stays as it is${replaceBackground ? ` (the flat solid color ${bgHex})` : ""}; the new edges of the body${clothingPrompt ? " and clothing" : ""} blend cleanly into it, with no halo or color fringe. Step 2 must be done completely; the protected zone keeps the face and hair, not the old ${bodyChanges}.

Everything about the person not listed above stays exactly as in the input. Output one photorealistic, camera-quality image with the same aspect ratio${fixPosture ? "" : " and composition"} as the input, no text or watermark.`
    : `Edit the provided ID photo. This is a retouch of a real photo of a real person, not a new picture: the person's face and body stay exactly where and how they are, and only the edits listed below are made.

${identity}

EDITS TO APPLY:
${step1}

Everything about the person not listed above stays exactly as in the input. Output one photorealistic, camera-quality image with the same aspect ratio and composition as the input, no text or watermark.`;

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
        imageSize: await outputSizeFor(imageBase64),
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
