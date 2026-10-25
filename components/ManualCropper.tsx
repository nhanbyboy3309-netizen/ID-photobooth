
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PhotoSize } from '../types';

interface ManualCropperProps {
  imageSrc: string;
  photoSize: PhotoSize;
  onCancel: () => void;
  onConfirm: (croppedImage: string) => void;
}

/*
 * Photoshop-style crop tool, locked to the ID photo ratio.
 *
 * The photo stays put and a crop frame with 8 handles is dragged over it:
 *  - drag a handle to resize (the ratio always stays that of the photo size, because the
 *    AI step and the print layout rely on it)
 *  - drag inside the frame to move it, drag outside it to draw a new frame
 *  - Alt = resize from the centre, arrow keys nudge (Shift = 10px)
 *  - wheel / pinch = zoom the view, Space+drag / middle or right mouse = pan the view
 *  - "Xoay chi tiết" slider and ±90° buttons rotate the photo UNDER the frame
 *  - Enter / double-click = Xong, Esc = Hủy
 *
 * Coordinates: the frame lives in natural image pixels, origin at the image centre, axes
 * aligned with the screen once the photo's rotation is applied, so it stays stable while
 * the view is zoomed/panned and while the photo is rotated.
 */

type Rect = { x: number; y: number; w: number; h: number };
type Pt = { x: number; y: number };
type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const HANDLE_DIR: Record<Handle, [number, number]> = {
  n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [1, -1], nw: [-1, -1], se: [1, 1], sw: [-1, 1]
};
const HANDLE_CURSOR: Record<Handle, string> = {
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize'
};
const HANDLE_POS: Record<Handle, React.CSSProperties> = {
  nw: { left: 0, top: 0 }, n: { left: '50%', top: 0 }, ne: { left: '100%', top: 0 },
  e: { left: '100%', top: '50%' }, se: { left: '100%', top: '100%' }, s: { left: '50%', top: '100%' },
  sw: { left: 0, top: '100%' }, w: { left: 0, top: '50%' }
};

const RATIO_BY_SIZE: Record<PhotoSize, { value: number; label: string }> = {
  [PhotoSize.SIZE_3X4]: { value: 3 / 4, label: '3:4' },
  [PhotoSize.SIZE_4X6]: { value: 2 / 3, label: '2:3' },
  [PhotoSize.SIZE_5X5]: { value: 1, label: '1:1' },
};

const PAD = 28;          // breathing room around the photo at "fit" zoom (screen px)
const MAX_EDGE = 4096;   // longest side of the exported image (px)
const MIN_SCREEN = 28;   // smallest crop frame on screen (px)
const MAX_ZOOM = 12;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// Keep a rect inside the photo's bounding box [-hw,hw]x[-hh,hh] (shrinking about its centre if needed).
const clampRect = (r: Rect, hw: number, hh: number, ratio: number | null): Rect => {
  let { w, h } = r;
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  // Only treat the ratio as locked if the rect actually has it; otherwise shrink w and h
  // independently instead of reshaping the rect past the photo.
  const locked = !!ratio && r.h > 0 && Math.abs(r.w / r.h - ratio) / ratio < 0.02;
  if (locked && ratio) {
    w = Math.min(w, 2 * hw, 2 * hh * ratio);
    h = w / ratio;
  } else {
    w = Math.min(w, 2 * hw); h = Math.min(h, 2 * hh);
  }
  const resized = w !== r.w || h !== r.h;
  const x = clamp(resized ? cx - w / 2 : r.x, -hw, hw - w);
  const y = clamp(resized ? cy - h / 2 : r.y, -hh, hh - h);
  return { x, y, w, h };
};

// Largest rect of the given ratio that fits the photo, centred.
const largestRect = (hw: number, hh: number, ratio: number | null): Rect => {
  let w = 2 * hw, h = 2 * hh;
  if (ratio) { if (w / h > ratio) w = h * ratio; else h = w / ratio; }
  return clampRect({ x: -w / 2, y: -h / 2, w, h }, hw, hh, ratio);
};

// Resize from a handle (or draw a new rect when r0 is degenerate and dir comes from the drag direction).
const resizeRect = (
  r0: Rect, dir: [number, number], P: Pt,
  o: { ratio: number | null; fromCenter: boolean; minSize: number; hw: number; hh: number }
): Rect => {
  const [dx, dy] = dir;
  const { ratio, fromCenter: fc, minSize, hw, hh } = o;
  const cx = r0.x + r0.w / 2, cy = r0.y + r0.h / 2;
  const ax = dx > 0 ? r0.x : dx < 0 ? r0.x + r0.w : cx;   // the edge/point that stays put
  const ay = dy > 0 ? r0.y : dy < 0 ? r0.y + r0.h : cy;

  let w = r0.w, h = r0.h;
  if (dx !== 0) w = Math.max(0, dx * (P.x - (fc ? cx : ax))) * (fc ? 2 : 1);
  if (dy !== 0) h = Math.max(0, dy * (P.y - (fc ? cy : ay))) * (fc ? 2 : 1);

  if (ratio) {
    if (dx !== 0 && dy !== 0) w = Math.max(w, h * ratio);
    else if (dy !== 0) w = h * ratio;
    w = Math.max(w, minSize, minSize * ratio);
    h = w / ratio;
  } else {
    if (dx !== 0) w = Math.max(w, minSize);
    if (dy !== 0) h = Math.max(h, minSize);
  }

  const centredX = fc || dx === 0, centredY = fc || dy === 0;
  const roomX = centredX ? 2 * Math.min(cx + hw, hw - cx) : dx > 0 ? hw - ax : ax + hw;
  const roomY = centredY ? 2 * Math.min(cy + hh, hh - cy) : dy > 0 ? hh - ay : ay + hh;
  if (ratio) {
    w = Math.min(w, roomX, roomY * ratio);
    h = w / ratio;
  } else {
    if (dx !== 0) w = Math.min(w, roomX);
    if (dy !== 0) h = Math.min(h, roomY);
  }

  const x = centredX ? cx - w / 2 : dx > 0 ? ax : ax - w;
  const y = centredY ? cy - h / 2 : dy > 0 ? ay : ay - h;
  return { x, y, w, h };
};

const Icon: React.FC<{ d: string; className?: string }> = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
  </svg>
);

const ManualCropper: React.FC<ManualCropperProps> = ({ imageSrc, photoSize, onCancel, onConfirm }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [view, setView] = useState({ zoom: 1, panX: 0, panY: 0 });
  const [quarter, setQuarter] = useState(0);   // 90° steps
  const [fine, setFine] = useState(0);         // straighten, -45..45
  const [crop, setCrop] = useState<Rect | null>(null);
  const [interacting, setInteracting] = useState(false);
  const [straightening, setStraightening] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);

  const { value: ratio, label: ratioLabel } = RATIO_BY_SIZE[photoSize] || RATIO_BY_SIZE[PhotoSize.SIZE_4X6];

  // ---- derived geometry ----
  const deg = quarter * 90 + fine;
  const theta = (deg * Math.PI) / 180;
  const cos = Math.cos(theta), sin = Math.sin(theta);
  const hw = nat ? (Math.abs(nat.w * cos) + Math.abs(nat.h * sin)) / 2 : 0;
  const hh = nat ? (Math.abs(nat.w * sin) + Math.abs(nat.h * cos)) / 2 : 0;
  const odd = Math.abs(quarter % 2) === 1;
  const dispW = nat ? (odd ? nat.h : nat.w) : 1;
  const dispH = nat ? (odd ? nat.w : nat.h) : 1;
  const fit = nat && stage.w > 0
    ? Math.max(0.0001, Math.min((stage.w - PAD * 2) / dispW, (stage.h - PAD * 2) / dispH))
    : 1;
  const k = fit * view.zoom;                            // natural px -> screen px
  // Minimum frame size measured at the fitted (100%) view, so a frame drawn while zoomed in
  // never ends up smaller than that once the view is zoomed back out.
  const minNat = MIN_SCREEN / fit;
  const ox = stage.w / 2 + view.panX, oy = stage.h / 2 + view.panY;

  const latest = useRef({ stage, fit, view });
  latest.current = { stage, fit, view };

  // ---- load / size tracking ----
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const readNatural = () => {
    const img = imgRef.current;
    if (img && img.naturalWidth && img.naturalHeight) setNat({ w: img.naturalWidth, h: img.naturalHeight });
  };
  useEffect(() => { if (imgRef.current?.complete) readNatural(); }, []);

  useEffect(() => {
    if (nat && !crop) setCrop(largestRect(hw, hh, ratio));
  }, [nat]);

  // ---- view zoom ----
  const zoomAround = (m: Pt, newZoom: number) => {
    const { stage: st, fit: f, view: v } = latest.current;
    const z = clamp(newZoom, 1, MAX_ZOOM);
    const Fx = (m.x - (st.w / 2 + v.panX)) / (f * v.zoom);
    const Fy = (m.y - (st.h / 2 + v.panY)) / (f * v.zoom);
    setView(z <= 1.001 ? { zoom: 1, panX: 0, panY: 0 } : { zoom: z, panX: m.x - st.w / 2 - f * z * Fx, panY: m.y - st.h / 2 - f * z * Fy });
  };
  const zoomCentre = (z: number) => zoomAround({ x: stage.w / 2, y: stage.h / 2 }, z);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAround({ x: e.clientX - r.left, y: e.clientY - r.top }, latest.current.view.zoom * Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ---- rotation ----
  const applyAngle = (q: number, f: number) => {
    if (!nat) return;
    const t = ((q * 90 + f) * Math.PI) / 180;
    const hw2 = (Math.abs(nat.w * Math.cos(t)) + Math.abs(nat.h * Math.sin(t))) / 2;
    const hh2 = (Math.abs(nat.w * Math.sin(t)) + Math.abs(nat.h * Math.cos(t))) / 2;
    setQuarter(q); setFine(f);
    // A 90° turn puts the photo sideways, so the old frame position means nothing: re-fit
    // the largest frame centred. Straightening only keeps the frame inside the photo.
    setCrop(c => (q !== quarter || !c) ? largestRect(hw2, hh2, ratio) : clampRect(c, hw2, hh2, ratio));
  };

  // After straightening, the frame can reach past the photo and show white wedges. Shrink it
  // (same shape, same centre when possible) until all four corners lie inside the rotated photo.
  const fitInsidePhoto = () => {
    if (!nat) return;
    const inside = (cx: number, cy: number, w: number, h: number) => {
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const X = cx + (sx * w) / 2, Y = cy + (sy * h) / 2;
        if (Math.abs(X * cos + Y * sin) > nat.w / 2 + 0.5 || Math.abs(-X * sin + Y * cos) > nat.h / 2 + 0.5) return false;
      }
      return true;
    };
    setCrop(c => {
      if (!c) return c;
      const solve = (cx: number, cy: number) => {
        if (inside(cx, cy, c.w, c.h)) return 1;
        let lo = 0, hi = 1;
        for (let i = 0; i < 32; i++) { const m = (lo + hi) / 2; if (inside(cx, cy, c.w * m, c.h * m)) lo = m; else hi = m; }
        return lo;
      };
      let cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      let s = solve(cx, cy);
      // Frame centre near a corner of the rotated photo would shrink it to a speck: re-centre.
      if (c.w * s < minNat || c.h * s < minNat) { cx = 0; cy = 0; s = solve(0, 0); }
      const w = c.w * s, h = c.h * s;
      return { x: cx - w / 2, y: cy - h / 2, w, h };
    });
  };

  const resetAll = () => {
    setQuarter(0); setFine(0); setView({ zoom: 1, panX: 0, panY: 0 });
    if (nat) setCrop(largestRect(nat.w / 2, nat.h / 2, ratio));
  };

  // ---- pointer interaction ----
  const pointers = useRef<Map<number, Pt>>(new Map());
  const drag = useRef<null | { mode: 'move' | 'resize' | 'new' | 'pan'; start: Pt; rect0: Rect; handle?: Handle; client0: Pt; pan0: Pt }>(null);
  const pinch = useRef<null | { dist0: number; zoom0: number; F0: Pt }>(null);

  const toFrame = (cx: number, cy: number): Pt => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: (cx - r.left - ox) / k, y: (cy - r.top - oy) / k };
  };

  const pinchPoints = () => {
    const pts: Pt[] = [];
    pointers.current.forEach(p => pts.push(p));
    const r = stageRef.current!.getBoundingClientRect();
    return {
      mid: { x: (pts[0].x + pts[1].x) / 2 - r.left, y: (pts[0].y + pts[1].y) / 2 - r.top },
      dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!nat || !crop) return;
    try { stageRef.current!.setPointerCapture(e.pointerId); } catch { /* pointer already gone: ignore */ }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const { mid, dist } = pinchPoints();
      pinch.current = { dist0: dist, zoom0: view.zoom, F0: { x: (mid.x - ox) / k, y: (mid.y - oy) / k } };
      drag.current = null;
      setInteracting(true);
      return;
    }
    if (pointers.current.size > 2) return;

    const P = toFrame(e.clientX, e.clientY);
    const base = { client0: { x: e.clientX, y: e.clientY }, pan0: { x: view.panX, y: view.panY }, start: P, rect0: crop };

    if (e.button === 1 || e.button === 2 || spaceDown) {
      drag.current = { ...base, mode: 'pan' };
    } else {
      const handle = (e.target as HTMLElement).closest('[data-handle]')?.getAttribute('data-handle') as Handle | null;
      const inside = P.x >= crop.x && P.x <= crop.x + crop.w && P.y >= crop.y && P.y <= crop.y + crop.h;
      if (handle) {
        drag.current = { ...base, mode: 'resize', handle };
      } else if (inside) {
        drag.current = { ...base, mode: 'move' };
      } else {
        const A = { x: clamp(P.x, -hw, hw), y: clamp(P.y, -hh, hh) };
        drag.current = { ...base, mode: 'new', start: A, rect0: { x: A.x, y: A.y, w: 0, h: 0 } };
      }
    }
    setInteracting(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.current && pointers.current.size >= 2) {
      const { mid, dist } = pinchPoints();
      const z = clamp(pinch.current.zoom0 * (dist / pinch.current.dist0), 1, MAX_ZOOM);
      const F0 = pinch.current.F0;
      setView(z <= 1.001 ? { zoom: 1, panX: 0, panY: 0 } : { zoom: z, panX: mid.x - stage.w / 2 - fit * z * F0.x, panY: mid.y - stage.h / 2 - fit * z * F0.y });
      return;
    }

    const d = drag.current;
    if (!d) return;
    const P = toFrame(e.clientX, e.clientY);

    if (d.mode === 'pan') {
      if (view.zoom <= 1.001) return; // nothing to pan while the whole photo is in view
      setView(v => ({ ...v, panX: d.pan0.x + (e.clientX - d.client0.x), panY: d.pan0.y + (e.clientY - d.client0.y) }));
    } else if (d.mode === 'move') {
      setCrop(clampRect({ ...d.rect0, x: d.rect0.x + (P.x - d.start.x), y: d.rect0.y + (P.y - d.start.y) }, hw, hh, ratio));
    } else {
      // The pointer may leave the photo; treat it as sitting on the nearest edge so the frame
      // never flips direction or collapses to nothing when dragged past the border.
      const Pc = { x: clamp(P.x, -hw, hw), y: clamp(P.y, -hh, hh) };
      const dir: [number, number] = d.mode === 'new'
        ? [Pc.x >= d.start.x ? 1 : -1, Pc.y >= d.start.y ? 1 : -1]
        : HANDLE_DIR[d.handle!];
      const next = resizeRect(d.rect0, dir, Pc, { ratio, fromCenter: e.altKey, minSize: minNat, hw, hh });
      // Ignore degenerate results (e.g. no room left in that direction) instead of applying them.
      if (!isFinite(next.x + next.y + next.w + next.h) || next.w < 1 || next.h < 1) return;
      // Starting a new frame right at the photo's border can leave no room for a usable size;
      // keep the current frame instead of replacing it with a speck that is hard to grab.
      if (d.mode === 'new' && (next.w < minNat - 0.5 / fit || next.h < minNat - 0.5 / fit)) return;
      setCrop(next);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) { drag.current = null; setInteracting(false); }
    else if (pointers.current.size === 1) { drag.current = null; }
  };

  // ---- commit ----
  const outScale = crop ? Math.min(1, MAX_EDGE / Math.max(crop.w, crop.h)) : 1;
  const outW = crop ? Math.max(1, Math.round(crop.w * outScale)) : 0;
  const outH = crop ? Math.max(1, Math.round(crop.h * outScale)) : 0;

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img || !nat || !crop) return;
    const canvas = document.createElement('canvas');
    canvas.width = outW; canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Areas outside the straightened photo come out white (unless "Bỏ viền trắng" was used).
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // canvas = scale · translate(-crop origin) · rotate(theta) · (image point - image centre)
    ctx.scale(outScale, outScale);
    ctx.translate(-crop.x, -crop.y);
    ctx.rotate(theta);
    ctx.drawImage(img, -nat.w / 2, -nat.h / 2);
    try {
      onConfirm(canvas.toDataURL('image/png', 1.0));
    } catch {
      alert('Không thể xuất ảnh vì ảnh nguồn bị chặn (CORS). Hãy tải ảnh lên lại từ máy.');
    }
  };

  // ---- keyboard ----
  useEffect(() => {
    const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping(e.target)) { e.preventDefault(); setSpaceDown(true); return; }
      if (e.key === 'Escape') { onCancel(); return; }
      if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); handleCrop(); return; }
      const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (arrows[e.key] && !isTyping(e.target)) {
        e.preventDefault();
        const step = (e.shiftKey ? 10 : 1) / k;
        const [ax, ay] = arrows[e.key];
        setCrop(c => c && clampRect({ ...c, x: c.x + ax * step, y: c.y + ay * step }, hw, hh, ratio));
      }
    };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setSpaceDown(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  });

  // ---- render ----
  const boxStyle = useMemo<React.CSSProperties | null>(() => crop ? ({
    left: ox + k * crop.x, top: oy + k * crop.y, width: k * crop.w, height: k * crop.h,
  }) : null, [crop, ox, oy, k]);

  // Ratio of the frame as it actually is on screen right now.
  const ratioText = crop && crop.h > 0
    ? (() => {
        const r = crop.w / crop.h;
        const n = Math.round((r >= 1 ? r : 1 / r) * 100) / 100;
        return r >= 1 ? `${n}:1` : `1:${n}`;
      })()
    : '';

  const iconBtn = 'w-9 h-9 shrink-0 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center transition-all active:scale-95';
  const valueBtn = 'bg-gray-800 px-2 py-0.5 rounded text-white hover:text-brand-400 transition-colors';

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col h-[100dvh] w-screen select-none">
      {/* Header */}
      <div className="shrink-0 flex justify-between items-center gap-2 p-4 bg-black/80 backdrop-blur-md border-b border-white/10 z-20">
        <button onClick={onCancel} className="text-white font-bold text-sm px-4 py-2 rounded-full bg-white/10 hover:bg-white/20" title="Esc">
          Hủy
        </button>
        <div className="flex-1 flex flex-col items-center min-w-0">
          <span className="text-white font-black uppercase text-sm tracking-widest truncate max-w-full">CẮT & XOAY ẢNH</span>
          <span className="text-[10px] text-brand-400 font-bold font-mono truncate max-w-full">
            {crop ? <>{outW} × {outH} px · tỷ lệ {ratioText}<span className="hidden sm:inline"> · {photoSize} ({ratioLabel})</span></> : 'Đang tải ảnh...'}
          </span>
        </div>
        <button onClick={handleCrop} disabled={!crop} className="text-white font-bold text-sm px-6 py-2 rounded-full bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/30 disabled:opacity-40" title="Enter">
          Xong
        </button>
      </div>

      {/* Workspace */}
      <div
        ref={stageRef}
        className="flex-1 min-h-0 relative overflow-hidden bg-gray-900 touch-none"
        style={{ cursor: spaceDown ? (interacting ? 'grabbing' : 'grab') : 'crosshair' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={e => e.preventDefault()}
      >
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Crop source"
          crossOrigin="anonymous"
          draggable={false}
          onLoad={readNatural}
          className="absolute max-w-none pointer-events-none select-none"
          style={{
            left: 0, top: 0,
            width: nat ? nat.w : undefined, height: nat ? nat.h : undefined,
            visibility: nat ? 'visible' : 'hidden',
            transformOrigin: '0 0',
            transform: nat ? `translate(${ox}px, ${oy}px) scale(${k}) rotate(${deg}deg) translate(${-nat.w / 2}px, ${-nat.h / 2}px)` : undefined,
            imageRendering: k > 3 ? 'pixelated' : 'auto'
          }}
        />

        {boxStyle && (
          <div
            className="absolute"
            style={{ ...boxStyle, boxShadow: '0 0 0 9999px rgba(0,0,0,0.62)', outline: '2px solid rgba(255,255,255,0.95)', cursor: spaceDown ? undefined : 'move' }}
            onDoubleClick={handleCrop}
          >
            {/* Rule of thirds */}
            <div className="absolute inset-0 pointer-events-none" style={{ opacity: interacting ? 0.9 : 0.35 }}>
              <div className="absolute top-0 bottom-0 border-l border-white/70" style={{ left: '33.333%' }} />
              <div className="absolute top-0 bottom-0 border-l border-white/70" style={{ left: '66.666%' }} />
              <div className="absolute left-0 right-0 border-t border-white/70" style={{ top: '33.333%' }} />
              <div className="absolute left-0 right-0 border-t border-white/70" style={{ top: '66.666%' }} />
            </div>
            {/* Fine grid while straightening */}
            {straightening && (
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.28) 1px, transparent 1px)',
                backgroundSize: '10% 10%'
              }} />
            )}
            {/* 8 handles: 32px hit area, smaller visible mark */}
            {HANDLES.map(h => {
              const edgeV = h === 'n' || h === 's', edgeH = h === 'e' || h === 'w';
              return (
                <div
                  key={h}
                  data-handle={h}
                  className="absolute flex items-center justify-center"
                  style={{ ...HANDLE_POS[h], width: 32, height: 32, transform: 'translate(-50%, -50%)', cursor: spaceDown ? undefined : HANDLE_CURSOR[h], touchAction: 'none' }}
                >
                  <div className="bg-white border border-black/70 shadow-md pointer-events-none" style={{ width: edgeV ? 22 : edgeH ? 6 : 11, height: edgeH ? 22 : edgeV ? 6 : 11 }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="shrink-0 bg-gray-900 px-4 py-4 pb-safe border-t border-gray-800 z-20">
        <div className="max-w-md mx-auto space-y-4">

          {/* Straighten + 90° turns */}
          <div className="flex items-center gap-2">
            <button onClick={() => applyAngle(quarter - 1, fine)} className={iconBtn} title="Xoay trái 90°">
              <Icon d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </button>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest items-center gap-2">
                <span className="flex items-center gap-1 whitespace-nowrap">🔄 Xoay chi tiết</span>
                <span className="flex items-center gap-2">
                  {Math.abs(fine) > 0.05 && (
                    <button onClick={fitInsidePhoto} className="text-brand-400 hover:text-white whitespace-nowrap" title="Thu khung vào trong ảnh để không còn góc trắng">Bỏ viền trắng</button>
                  )}
                  <button onClick={() => applyAngle(quarter, 0)} className={valueBtn} title="Về 0°">{fine.toFixed(1)}°</button>
                </span>
              </div>
              <input
                type="range" min="-45" max="45" step="0.1" value={fine}
                onChange={e => applyAngle(quarter, parseFloat(e.target.value))}
                onPointerDown={() => setStraightening(true)}
                onPointerUp={() => setStraightening(false)}
                onBlur={() => setStraightening(false)}
                onDoubleClick={() => applyAngle(quarter, 0)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>
            <button onClick={() => applyAngle(quarter + 1, fine)} className={iconBtn} title="Xoay phải 90°">
              <Icon d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </button>
          </div>

          {/* View zoom */}
          <div className="flex items-center gap-2">
            <button onClick={() => zoomCentre(view.zoom / 1.25)} className={iconBtn} title="Thu nhỏ">
              <Icon d="M20 12H4" />
            </button>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest items-center">
                <span className="flex items-center gap-1">🔍 Thu phóng</span>
                <button onClick={() => setView({ zoom: 1, panX: 0, panY: 0 })} className={valueBtn} title="Vừa khung">
                  {Math.round(view.zoom * 100)}% · Vừa khung
                </button>
              </div>
              <input
                type="range" min="100" max={MAX_ZOOM * 100} step="5" value={Math.round(view.zoom * 100)}
                onChange={e => zoomCentre(parseInt(e.target.value, 10) / 100)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>
            <button onClick={() => zoomCentre(view.zoom * 1.25)} className={iconBtn} title="Phóng to">
              <Icon d="M12 4v16m8-8H4" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-3">
            <p className="text-center text-[9px] text-gray-500 uppercase tracking-tighter leading-relaxed">
              Kéo góc/cạnh để đổi cỡ khung • kéo trong khung để di chuyển • kéo ngoài khung để vẽ khung mới • cuộn/chụm 2 ngón để phóng to
            </p>
            <button onClick={resetAll} className={iconBtn} title="Đặt lại">
              <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ManualCropper;
