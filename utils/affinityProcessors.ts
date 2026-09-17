import { PhotoSettings } from '../types';

/**
 * Checks if a pixel falls within a robust range of human skin tones.
 * This is optimized to exclude typical passport backgrounds (white, blue, grey) and clothing.
 */
export const isSkinPixel = (r: number, g: number, b: number): boolean => {
  // Check that colors are not too dark or too bright/white
  if (r < 50 || g < 35 || b < 20) return false;
  // Red must be the dominant component
  if (r <= g || r <= b) return false;
  
  // Skin values are rich in Red, moderate in Green, slightly lower in Blue
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 15) return false;
  if (r - g < 15) return false;
  
  // Exclude bright blue, pure green, or deep purple/blue backgrounds
  if (b > r && b > g && b > 80) return false;
  // Exclude absolute white background
  if (r > 242 && g > 242 && b > 242) return false;
  // Exclude very dark black/gray shadow areas
  if (r < 40 && g < 40 && b < 40) return false;

  return true;
};

/**
 * A fast, professional-grade Bilateral Filter (affinity-based) applied exclusively on skin pixels.
 * Smooths skin while retaining high-frequency details/edges of hair, eyes, eyebrows, clothes, and background.
 */
export function bilateralFilter(
  srcData: Uint8ClampedArray,
  width: number,
  height: number,
  smoothingIntensity: number // 0 to 100
): Uint8ClampedArray {
  if (smoothingIntensity === 0) return srcData;
  const destData = new Uint8ClampedArray(srcData.length);
  destData.set(srcData);

  const r = 2; // 5x5 window for fast rendering and beautiful local blending
  const sigmaS = 4.0;
  // Standard range sigma. Increase it slightly with smoothing intensity
  const sigmaC = 12.0 + (smoothingIntensity * 0.4); 
  
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

      // Smooth on skin pixels ONLY
      if (!isSkinPixel(r_val, g_val, b_val)) {
        continue;
      }

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
        destData[idx] = Math.round(sumR / totalWeight);
        destData[idx + 1] = Math.round(sumG / totalWeight);
        destData[idx + 2] = Math.round(sumB / totalWeight);
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
      lighting, contrast, skinToneType, skinToneIntensity, smoothSkin,
      highlights, shadows, midtones, cyan, magenta, yellow, keyBlack,
    } = settings.beauty;
    const backgroundHex = settings.backgroundHex;

    // 1. Bilateral filter for skin smoothing (if smoothSkin > 0)
    let smoothData = data;
    if (smoothSkin > 0) {
      smoothData = bilateralFilter(data, canvas.width, canvas.height, smoothSkin);
    }

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

      const isSkin = isSkinPixel(r, g, b);

      if (!isBg) {
        // Apply Global Lighting and Contrast to the subject only, keeping background pristine
        r = (r - 128) * contrastFactor + 128 + brightFactor;
        g = (g - 128) * contrastFactor + 128 + brightFactor;
        b = (b - 128) * contrastFactor + 128 + brightFactor;

        // Apply selective skin-tone adjustment ONLY on detected skin pixels
        if (isSkin && skinToneIntensity > 0) {
          if (skinToneType === 'fair') {
            r = r + (255 - r) * stK * 0.22;
            g = g + (255 - g) * stK * 0.20;
            b = b + (255 - b) * stK * 0.17;
          } else if (skinToneType === 'rosy') {
            r = r + (255 - r) * stK * 0.22;
            g = g + (255 - g) * stK * 0.13;
            b = b + (255 - b) * stK * 0.16;
          } else if (skinToneType === 'tan') {
            r = r * (1 - stK * 0.12) + (stK * 0.12 * 180);
            g = g * (1 - stK * 0.12) + (stK * 0.12 * 130);
            b = b * (1 - stK * 0.12) + (stK * 0.12 * 90);
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
