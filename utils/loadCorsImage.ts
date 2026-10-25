// Loads a remote image so it can be drawn on a canvas that is later exported.
// The same URL shown elsewhere as a plain <img> can sit in the browser cache without
// CORS headers (or the host can fail once), which made a crossOrigin load fail silently.
// A fresh CORS fetch avoids the cache; the plain crossOrigin load is the fallback.
const loadImg = (src: string, crossOrigin: boolean): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });

export const loadCorsImage = async (src: string): Promise<HTMLImageElement> => {
  if (!/^https?:/i.test(src)) return loadImg(src, false);
  try {
    const resp = await fetch(src, { mode: 'cors', cache: 'no-store' });
    if (resp.ok) {
      const objectUrl = URL.createObjectURL(await resp.blob());
      try {
        return await loadImg(objectUrl, false);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }
  } catch {
    // fall through to the direct load
  }
  return loadImg(src, true);
};
