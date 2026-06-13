import { BackgroundType, BeautySettings, PhotoSize } from "../types";

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
    const response = await fetch("/api/gemini/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Frame })
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
  size: PhotoSize
): Promise<string> => {
  
  /* ---------------- SAFETY CLAMPS ---------------- */

  const smoothSkin = Math.min(beauty.smoothSkin, 70);
  const blemish = Math.min(beauty.blemishIntensity, 80);
  const contour = Math.round((beauty.contourIntensity / 100) * 40);
  const eyebrow = Math.round((beauty.eyebrowIntensity / 100) * 60);
  const eyelash = Math.round((beauty.eyelashIntensity / 100) * 50);

  /* ---------------- BACKGROUND ---------------- */

  const backgroundMode =
    bgType === BackgroundType.ORIGINAL ? "NONE" : "CUSTOM";

  const backgroundColor =
    bgType === BackgroundType.ORIGINAL ? "N/A" : bgHex;

  /* =========================================================
     FINAL SYSTEM PROMPT
  ========================================================= */

  const systemPrompt = `
You are a PROFESSIONAL ID PHOTO EDITING SYSTEM.
STRICT ID PHOTO MODE. ABSOLUTE IDENTITY PRESERVATION.

====================================================================
GLOBAL ASSUMPTIONS
====================================================================

ASSUME:
- Facial landmarks and face mask are already provided.
- Facial region is an IMMUTABLE raster layer.

RULE:
- DO NOT re-detect or reinterpret facial geometry.
- Treat the face as LOCKED.
- Do not make changes arbitrarily. Only make changes according to the selected option.

If face is missing or incomplete:
- Output original image unchanged.

====================================================================
ABSOLUTE BIOMETRIC RULES
====================================================================

FORBIDDEN:
- Any facial reshaping
- Any geometry change
- Removing OR adding moles, freckles, scars
- Inventing skin details
- Interpreting noise as facial features

====================================================================
PHASE 1 — FACE, SKIN & BACKGROUND
====================================================================

POSTURE:
- Global rotation, translation, uniform scaling ONLY
- No local warping

BACKGROUND:
Mode: ${backgroundMode}
Color: ${backgroundColor}

Rules:
- Flat solid color
- No gradient
- No shadow
- No blur

SKIN PROCESSING (DETERMINISTIC):

Skin smoothing: ${smoothSkin}/100
Blemish cleaning: ${blemish}/100

Rules:
- Subtractive only
- Preserve all permanent identity marks
- NO texture regeneration
- NO new dots or pores

MAKEUP:
- Lip color: ${beauty.lipstickColor}
- Lip intensity: ${beauty.lipstickIntensity}/100
- Blush: ${beauty.blushIntensity}/100 (very subtle)
- Contour: ${contour}/100 (shading only)

HAIR:
- Volume: ${beauty.hairVolume}/100
- Color: ${beauty.hairColor || "ORIGINAL"}
- Tidy only, no new hair

EYEBROWS:
- Intensity: ${eyebrow}/100
- Follow original pixels exactly

EYELASHES:
- Intensity: ${eyelash}/100
- Enhance existing lashes only

Lock facial pixels after this phase.

====================================================================
PHASE 2 — CLOTHING ONLY (FACE DISABLED)
====================================================================

Enabled: ${clothingPrompt ? "YES" : "NO"}
Prompt: "${clothingPrompt || "N/A"}"

Rules:
- Edit region STRICTLY below jawline
- Jawline is ABSOLUTE BOUNDARY
- ZERO feathering
- ZERO blur
- ZERO overlap with skin
- Neck shape and position UNCHANGED

If any facial or neck pixel is affected:
- Cancel clothing replacement
- Output Phase 1 image

====================================================================
FINAL OUTPUT
====================================================================

- PNG format
- High quality
- Base64 encoded
- No text
- No metadata
- No explanation
`;

  try {
    const response = await fetch("/api/gemini/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, systemPrompt })
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
