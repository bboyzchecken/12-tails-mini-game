/**
 * Per-image face framing. The face overlays place their art at inconsistent
 * spots inside the 256² texture (some upper-left, some centered), so no single
 * CSS crop centers them all. Scan each image's opaque pixels for the content's
 * bounding box, then return `background-size`/`background-position` that centers
 * (and gently zooms) that box in a square swatch. Results are cached per URL.
 */
interface FaceFrame {
  size: string;
  position: string;
}

const FALLBACK: FaceFrame = { size: 'contain', position: 'center' };
const cache = new Map<string, FaceFrame>();

/** Apply the computed framing to a swatch element (fire-and-forget). */
export function applyFaceFrame(el: HTMLElement, url: string) {
  void faceFrame(url).then((f) => {
    el.style.backgroundSize = f.size;
    el.style.backgroundPosition = f.position;
  });
}

export async function faceFrame(url: string): Promise<FaceFrame> {
  const hit = cache.get(url);
  if (hit) return hit;
  let frame = FALLBACK;
  try {
    const img = await loadImage(url);
    const S = 64; // low-res scan is plenty for a bounding box
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(img, 0, 0, S, S);
      const data = ctx.getImageData(0, 0, S, S).data;
      let minX = S;
      let minY = S;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          if (data[(y * S + x) * 4 + 3] > 24) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX >= 0) {
        const cx = (minX + maxX) / 2 / S;
        const cy = (minY + maxY) / 2 / S;
        const bw = (maxX - minX + 1) / S;
        const bh = (maxY - minY + 1) / S;
        const view = Math.min(1, Math.max(0.22, Math.max(bw, bh) * 1.6)); // fraction shown + padding
        const z = 1 / view; // background-size scale
        const denom = 1 - z;
        const pos = (c: number) =>
          Math.abs(denom) < 1e-4 ? 50 : Math.max(0, Math.min(100, (100 * (0.5 - c * z)) / denom));
        frame = { size: `${(z * 100).toFixed(1)}%`, position: `${pos(cx).toFixed(1)}% ${pos(cy).toFixed(1)}%` };
      }
    }
  } catch {
    /* CORS / decode failure — keep the fallback */
  }
  cache.set(url, frame);
  return frame;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
