import { PhotoSettings } from '../types';

/**
 * A fast, professional-grade Bilateral Filter (affinity-based) applied to skin only.
 * Smooths skin while retaining high-frequency details/edges of hair, eyes, eyebrows, clothes, and background.
 * `skinWeights` (0..1 per pixel, see skinWeightMap) scales the effect so it fades out at the
 * edges of skin instead of switching on/off pixel by pixel.
 */
export function bilateralFilter(
  srcData: Uint8ClampedArray,
  width: number,
  height: number,
  smoothingIntensity: number, // 0 to 100
  skinWeights: Float32Array
): Uint8ClampedArray {
  if (smoothingIntensity === 0) return srcData;
  const destData = new Uint8ClampedArray(srcData.length);
  destData.set(srcData);

  const r = 2; // 5x5 window for fast rendering and beautiful local blending
  const sigmaS = 4.0;
  // Standard range sigma. Increase it slightly with smoothing intensity
  const sigmaC = 12.0 + (smoothingIntensity * 0.3);

  // Even at max slider intensity, blend back a floor of the original pixel so
  // fine pore/skin-grain texture is never fully erased — full replacement
  // reads as plastic/airbrushed, not real skin.
  const textureBlend = Math.min(0.85, smoothingIntensity / 100);

  const spatialWeights = [];
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const distSq = dx * dx + dy * dy;
      spatialWeights.push({
        dx,
        dy,
        weight: Math.exp(-distSq / (2 * sigmaS * sigmaS))
      });
    }
  }

  const colorFactor = -1 / (2 * sigmaC * sigmaC);

  for (let y = r; y < height - r; y++) {
    for (let x = r; x < width - r; x++) {
      const idx = (y * width + x) * 4;
      const r_val = srcData[idx];
      const g_val = srcData[idx + 1];
      const b_val = srcData[idx + 2];

      const skinW = skinWeights[y * width + x];
      if (skinW < 0.002) continue;
      const blend = textureBlend * skinW;

      let sumR = 0, sumG = 0, sumB = 0, totalWeight = 0;

      for (let i = 0; i < spatialWeights.length; i++) {
        const sw = spatialWeights[i];
        const nIdx = ((y + sw.dy) * width + (x + sw.dx)) * 4;
        
        const nr = srcData[nIdx];
        const ng = srcData[nIdx + 1];
        const nb = srcData[nIdx + 2];

        const dr = nr - r_val;
        const dg = ng - g_val;
        const db = nb - b_val;
        const colorSqDist = dr * dr + dg * dg + db * db;

        const weight = sw.weight * Math.exp(colorSqDist * colorFactor);
        
        sumR += nr * weight;
        sumG += ng * weight;
        sumB += nb * weight;
        totalWeight += weight;
      }

      if (totalWeight > 0) {
        const smoothR = sumR / totalWeight;
        const smoothG = sumG / totalWeight;
        const smoothB = sumB / totalWeight;
        destData[idx] = Math.round(r_val * (1 - blend) + smoothR * blend);
        destData[idx + 1] = Math.round(g_val * (1 - blend) + smoothG * blend);
        destData[idx + 2] = Math.round(b_val * (1 - blend) + smoothB * blend);
      }
    }
  }
  return destData;
}

/**
 * Spot Healing Brush Tool using inverse-distance-weighted interpolation of surrounding healthy pixels.
 * Completely client-side, zero-AI, and extremely effective for blemishes and spots.
 */
export function healSpot(
  srcData: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number
): Uint8ClampedArray {
  const destData = new Uint8ClampedArray(srcData.length);
  destData.set(srcData);

  const rMin = Math.max(3, radius - 3);
  const rMax = radius;
  const boundaryPixels: { x: number; y: number; r: number; g: number; b: number }[] = [];

  // Gather boundary pixels of the brush circle
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = Math.round(cx + dx);
      const y = Math.round(cy + dy);
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= rMin && dist <= rMax) {
        const idx = (y * width + x) * 4;
        boundaryPixels.push({
          x,
          y,
          r: srcData[idx],
          g: srcData[idx + 1],
          b: srcData[idx + 2]
        });
      }
    }
  }

  if (boundaryPixels.length === 0) return srcData;

  // Interpolate inside pixels
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= rMin) continue; // Skip boundary and outside

      const x = Math.round(cx + dx);
      const y = Math.round(cy + dy);
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const idx = (y * width + x) * 4;

      let sumR = 0, sumG = 0, sumB = 0, totalW = 0;
      for (let i = 0; i < boundaryPixels.length; i++) {
        const bp = boundaryPixels[i];
        const distSq = (x - bp.x) ** 2 + (y - bp.y) ** 2;
        if (distSq === 0) continue;

        const w = 1 / distSq;
        sumR += bp.r * w;
        sumG += bp.g * w;
        sumB += bp.b * w;
        totalW += w;
      }

      if (totalW > 0) {
        const healedR = sumR / totalW;
        const healedG = sumG / totalW;
        const healedB = sumB / totalW;

        // Soft feathering blend towards the boundary
        const alpha = Math.min(1.0, (radius - dist) / 2);
        destData[idx] = Math.max(0, Math.min(255, Math.round(healedR * alpha + srcData[idx] * (1 - alpha))));
        destData[idx + 1] = Math.max(0, Math.min(255, Math.round(healedG * alpha + srcData[idx + 1] * (1 - alpha))));
        destData[idx + 2] = Math.max(0, Math.min(255, Math.round(healedB * alpha + srcData[idx + 2] * (1 - alpha))));
      }
    }
  }

  return destData;
}

/**
 * Builds a subject/background mask via flood fill from the image border.
 * The AI always renders the background as a flat solid color, so every true
 * background pixel is reachable from the border through a chain of other
 * background-colored pixels. This is far more robust than a plain per-pixel
 * color-distance test: a subject pixel that merely happens to be a similar
 * color (a white collar near a white background, pale skin near a light
 * background) is never connected to the border through background-colored
 * pixels alone, so it stays correctly marked as subject.
 * Returns a Uint8Array (1 = subject, 0 = background) sized width*height.
 */
function computeSubjectMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  bgR: number,
  bgG: number,
  bgB: number,
  threshold: number
): Uint8Array {
  const size = width * height;
  const isBackground = new Uint8Array(size);
  const visited = new Uint8Array(size);
  const stack: number[] = [];

  const matchesBg = (idx: number) => {
    const o = idx * 4;
    const dr = data[o] - bgR;
    const dg = data[o + 1] - bgG;
    const db = data[o + 2] - bgB;
    return Math.sqrt(dr * dr + dg * dg + db * db) < threshold;
  };

  const visit = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    if (matchesBg(idx)) {
      isBackground[idx] = 1;
      stack.push(idx);
    }
  };

  for (let x = 0; x < width; x++) {
    visit(x, 0);
    visit(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    visit(0, y);
    visit(width - 1, y);
  }

  while (stack.length > 0) {
    const idx = stack.pop()!;
    const x = idx % width;
    const y = (idx / width) | 0;
    visit(x - 1, y);
    visit(x + 1, y);
    visit(x, y - 1);
    visit(x, y + 1);
  }

  const subjectMask = new Uint8Array(size);
  for (let i = 0; i < size; i++) subjectMask[i] = isBackground[i] ? 0 : 1;
  return subjectMask;
}

/**
 * Tonal-range weights for a 0-1 luminance value, used to blend Highlights/
 * Shadows/Midtones adjustments smoothly (no hard cutoffs/banding between
 * ranges). Shadows peak at luminance 0, Highlights peak at 1, Midtones peak
 * at 0.5 — the three weights always sum to 1.
 */
const toneWeights = (l: number) => {
  const shadow = Math.max(0, 1 - l * 2);
  const highlight = Math.max(0, (l - 0.5) * 2);
  const midtone = Math.max(0, 1 - shadow - highlight);
  return { shadow, highlight, midtone };
};

const ramp = (x: number, lo: number, hi: number) => (x <= lo ? 0 : x >= hi ? 1 : (x - lo) / (hi - lo));

// How skin-like a colour is, 0..1 (red-dominant, not too dark, not white/blue/grey). Soft on
// purpose: a hard yes/no test flips pixels near its thresholds (shadows, cheek edges, lips,
// hair) and leaves speckled, blotchy skin after smoothing or a tone change.
const skinLikelihood = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return ramp(r, 40, 60) * ramp(g, 25, 45) * ramp(b, 10, 30) *
    ramp(r - g, 5, 25) * ramp(r - b, 0, 15) * ramp(max - min, 8, 22) *
    (1 - ramp(min, 225, 245));
};

// Separable box blur of a single-channel map (edges clamped). Two passes ≈ a gaussian.
const boxBlur = (src: Float32Array, w: number, h: number, r: number): Float32Array => {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  const span = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / span;
      acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / span;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
};

// Per-pixel skin weight 0..1: soft skin test, zero on the background, then smoothed so the
// skin-tone change fades in and out instead of switching on/off pixel by pixel.
const skinWeightMap = (data: Uint8ClampedArray, w: number, h: number, subjectMask: Uint8Array | null) => {
  const map = new Float32Array(w * h);
  for (let p = 0, i = 0; p < map.length; p++, i += 4) {
    map[p] = subjectMask && subjectMask[p] === 0 ? 0 : skinLikelihood(data[i], data[i + 1], data[i + 2]);
  }
  const radius = Math.max(2, Math.round(Math.min(w, h) / 400));
  return boxBlur(boxBlur(map, w, h, radius), w, h, radius);
};

// Unsharp mask on luminance (no colour fringes) for a crisp, DSLR-like look. Done here rather
// than by the AI because asking the model for sharpness makes it redraw the face. Skin gets
// only a quarter of the strength so pores and blemishes are not brought out, the background
// none, and tiny differences (noise) are ignored. The change per pixel is capped: on strong
// edges (nostrils, lips, hair against the background) an uncapped mask draws dark/bright rims.
const MAX_SHARPEN_DELTA = 10;
const sharpenLuma = (
  src: Uint8ClampedArray, w: number, h: number, amount: number,
  subjectMask: Uint8Array | null, skinWeights: Float32Array | null
): Uint8ClampedArray => {
  const luma = new Float32Array(w * h);
  for (let p = 0, i = 0; p < luma.length; p++, i += 4) {
    luma[p] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
  }
  const radius = Math.max(1, Math.round(Math.min(w, h) / 900));
  const blurred = boxBlur(boxBlur(luma, w, h, radius), w, h, radius);
  const out = new Uint8ClampedArray(src);
  for (let p = 0, i = 0; p < luma.length; p++, i += 4) {
    if (subjectMask && subjectMask[p] === 0) continue;
    const detail = luma[p] - blurred[p];
    const softened = detail * ramp(Math.abs(detail), 1, 4);
    const raw = softened * amount * (1 - 0.75 * (skinWeights ? skinWeights[p] : 0));
    const delta = Math.max(-MAX_SHARPEN_DELTA, Math.min(MAX_SHARPEN_DELTA, raw));
    out[i] = src[i] + delta;
    out[i + 1] = src[i + 1] + delta;
    out[i + 2] = src[i + 2] + delta;
  }
  return out;
};

/**
 * Unified client-side photo processing.
 * Applies lighting, contrast, highlights/shadows/midtones, and CMYK ink
 * adjustment globally, plus skin softening and skin-tone adjustment ONLY to
 * skin pixels.
 */
export const applyClientAdjustments = (
  imgSrc: string,
  settings: PhotoSettings,
  onComplete: (url: string) => void
) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imgSrc;
  img.onerror = () => onComplete(imgSrc);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onComplete(imgSrc);
      return;
    }
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const {
      lighting, contrast, skinToneType, skinToneIntensity,
      highlights, shadows, midtones, cyan, magenta, yellow, keyBlack,
    } = settings.beauty;
    // Not `smoothSkin`: that is the AI slider, and reusing it smoothed the skin twice.
    const smoothSkin = settings.beauty.clientSmoothSkin || 0;
    const sharpness = settings.beauty.sharpness || 0;
    const backgroundHex = settings.backgroundHex;

    // Parse background color if replacement is active, and build a precise
    // subject/background mask so every adjustment below touches the subject
    // (chủ thể) only and never bleeds onto the background (nền).
    let bgR = -1, bgG = -1, bgB = -1;
    let subjectMask: Uint8Array | null = null;
    if (backgroundHex && backgroundHex.startsWith('#')) {
      bgR = parseInt(backgroundHex.substring(1, 3), 16);
      bgG = parseInt(backgroundHex.substring(3, 5), 16);
      bgB = parseInt(backgroundHex.substring(5, 7), 16);
      subjectMask = computeSubjectMask(data, canvas.width, canvas.height, bgR, bgG, bgB, 45);
    }

    // One soft skin map shared by skin smoothing, skin tone and sharpening.
    const skinWeights = smoothSkin > 0 || skinToneIntensity > 0 || sharpness > 0
      ? skinWeightMap(data, canvas.width, canvas.height, subjectMask)
      : null;

    // Bilateral filter for skin smoothing (if smoothSkin > 0)
    let smoothData = data;
    if (smoothSkin > 0 && skinWeights) {
      smoothData = bilateralFilter(data, canvas.width, canvas.height, smoothSkin, skinWeights);
    }
    if (sharpness > 0) {
      smoothData = sharpenLuma(smoothData, canvas.width, canvas.height, (sharpness / 100) * 1.5, subjectMask, skinWeights);
    }

    const brightFactor = lighting * 1.5;
    const contrastFactor = (100 + contrast * 1.5) / 100;
    const stK = skinToneIntensity / 100;

    const highlightFactor = highlights * 1.2;
    const shadowFactor = shadows * 1.2;
    const midtoneFactor = midtones * 1.2;
    const hasToneRangeAdjust = highlights !== 0 || shadows !== 0 || midtones !== 0;

    const cyanAmt = cyan / 100;
    const magentaAmt = magenta / 100;
    const yellowAmt = yellow / 100;
    const kAmt = keyBlack / 100;
    const hasCmykAdjust = cyan > 0 || magenta > 0 || yellow > 0 || keyBlack > 0;

    for (let i = 0; i < data.length; i += 4) {
      let r = smoothData[i];
      let g = smoothData[i + 1];
      let b = smoothData[i + 2];
      const a = data[i + 3];

      // Look up whether this pixel is background per the flood-filled mask
      // (border-connected background-colored region), so filter-tab
      // adjustments below apply strictly to the subject only.
      const isBg = subjectMask ? subjectMask[i / 4] === 0 : false;

      if (!isBg) {
        // Apply Global Lighting and Contrast to the subject only, keeping background pristine
        r = (r - 128) * contrastFactor + 128 + brightFactor;
        g = (g - 128) * contrastFactor + 128 + brightFactor;
        b = (b - 128) * contrastFactor + 128 + brightFactor;

        // Skin-tone adjustment, weighted by how skin-like the area is (soft, smoothed mask)
        const sw = skinWeights ? skinWeights[i / 4] : 0;
        if (sw > 0.002) {
          const k = stK * sw;
          if (skinToneType === 'fair') {
            r = r + (255 - r) * k * 0.22;
            g = g + (255 - g) * k * 0.20;
            b = b + (255 - b) * k * 0.17;
          } else if (skinToneType === 'rosy') {
            r = r + (255 - r) * k * 0.22;
            g = g + (255 - g) * k * 0.13;
            b = b + (255 - b) * k * 0.16;
          } else if (skinToneType === 'tan') {
            r = r * (1 - k * 0.12) + (k * 0.12 * 180);
            g = g * (1 - k * 0.12) + (k * 0.12 * 130);
            b = b * (1 - k * 0.12) + (k * 0.12 * 90);
          }
        }

        // Highlights/Shadows/Midtones — luminance-weighted additive adjustment,
        // smoothly blended between tonal ranges (no hard cutoffs/banding)
        if (hasToneRangeAdjust) {
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const { shadow: wS, highlight: wH, midtone: wM } = toneWeights(luminance);
          const toneAdjust = wS * shadowFactor + wM * midtoneFactor + wH * highlightFactor;
          r += toneAdjust;
          g += toneAdjust;
          b += toneAdjust;
        }

        // CMYK ink-style color adjustment — each channel darkened by its
        // complementary ink (C->R, M->G, Y->B) plus the shared K (black) ink
        if (hasCmykAdjust) {
          r *= (1 - cyanAmt * 0.6) * (1 - kAmt * 0.5);
          g *= (1 - magentaAmt * 0.6) * (1 - kAmt * 0.5);
          b *= (1 - yellowAmt * 0.6) * (1 - kAmt * 0.5);
        }
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
      data[i + 3] = a;
    }

    ctx.putImageData(imgData, 0, 0);
    onComplete(canvas.toDataURL('image/png', 1.0));
  };
};
