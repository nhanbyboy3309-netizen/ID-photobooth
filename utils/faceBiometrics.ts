// Measures the face structure (eyes, nose, mouth, face shape) of the original photo with
// MediaPipe Face Landmarker. The numbers go into the AI prompt as the reference the edited
// face must keep, so one AI call is enough (no check-and-retry round trips).
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

// WASM files are served by server.ts from node_modules; the model is Google's official file.
const WASM_PATH = '/mediapipe-wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

let landmarkerPromise: Promise<FaceLandmarker> | null = null;
const getLandmarker = () => {
  if (!landmarkerPromise) {
    // Loaded on first use only: the library is large and most screens never need it.
    landmarkerPromise = import('@mediapipe/tasks-vision')
      .then(async ({ FilesetResolver, FaceLandmarker }) =>
        FaceLandmarker.createFromOptions(await FilesetResolver.forVisionTasks(WASM_PATH), {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
          runningMode: 'IMAGE',
          numFaces: 1,
        }),
      )
      .catch((err) => {
        landmarkerPromise = null; // allow a retry on the next photo
        throw err;
      });
  }
  return landmarkerPromise;
};

// Face-mesh landmark indices.
const P = {
  irisR: 468, irisL: 473,
  eyeROuter: 33, eyeRInner: 133, eyeLInner: 362, eyeLOuter: 263,
  eyeRTop: 159, eyeRBottom: 145,
  noseBridge: 168, noseTip: 1, noseBase: 2, alarR: 129, alarL: 358,
  mouthR: 61, mouthL: 291, lipTop: 0, lipBottom: 17, lipInner: 13,
  cheekR: 234, cheekL: 454, jawR: 172, jawL: 397,
  forehead: 10, chin: 152,
};

export interface BiometricMetric {
  name: string;  // English, for the AI prompt
  value: number; // distance divided by the distance between the pupils
}

// Every distance is divided by the pupil distance, so photo size and zoom do not matter.
// 3D landmarks keep a slight head turn from looking like a narrower face.
const METRICS: { name: string; a: number | [number, number]; b: number | [number, number] }[] = [
  { name: 'right eye width (corner to corner)', a: P.eyeROuter, b: P.eyeRInner },
  { name: 'left eye width (corner to corner)', a: P.eyeLInner, b: P.eyeLOuter },
  { name: 'eye opening (upper to lower eyelid)', a: P.eyeRTop, b: P.eyeRBottom },
  { name: 'nose length (bridge between the eyes to tip)', a: P.noseBridge, b: P.noseTip },
  { name: 'nose width (across the nostril wings)', a: P.alarR, b: P.alarL },
  { name: 'mouth width (corner to corner)', a: P.mouthR, b: P.mouthL },
  { name: 'lip height (top of upper lip to bottom of lower lip)', a: P.lipTop, b: P.lipBottom },
  { name: 'nose base to mouth', a: P.noseBase, b: P.lipInner },
  { name: 'eyes to mouth', a: [P.irisR, P.irisL], b: P.lipInner },
  { name: 'face width at the cheekbones', a: P.cheekR, b: P.cheekL },
  { name: 'jaw width', a: P.jawR, b: P.jawL },
  { name: 'face length (top of forehead to chin)', a: P.forehead, b: P.chin },
  { name: 'chin length (lower lip to chin)', a: P.lipBottom, b: P.chin },
];

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });

/** Biometric ratios of the single face in the photo, or null when no face is found. */
export const measureFace = async (src: string): Promise<BiometricMetric[] | null> => {
  const [landmarker, img] = await Promise.all([getLandmarker(), loadImage(src)]);
  const face = landmarker.detect(img).faceLandmarks[0];
  if (!face) return null;
  const w = img.width, h = img.height;
  const pt = (i: number | [number, number]) => {
    const one = (k: number) => {
      const l: NormalizedLandmark = face[k];
      return [l.x * w, l.y * h, l.z * w];
    };
    if (typeof i === 'number') return one(i);
    const a = one(i[0]), b = one(i[1]);
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  };
  const dist = (a: number | [number, number], b: number | [number, number]) => {
    const p = pt(a), q = pt(b);
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  };
  const iod = dist(P.irisR, P.irisL);
  if (iod < 4) return null;
  return METRICS.map((m) => ({ name: m.name, value: dist(m.a, m.b) / iod }));
};
