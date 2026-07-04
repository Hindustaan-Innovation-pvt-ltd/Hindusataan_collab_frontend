import type { Cam, El, Pt, ShapeKind, StickyEl, ShapeEl, TextEl } from "../types";

// ── ID Generator ───────────────────────────────────────────────────────────────

export const uid = () => Math.random().toString(36).substring(2, 10);

// ── Canvas Helpers ─────────────────────────────────────────────────────────────

export function worldPt(cx: number, cy: number, rect: DOMRect, cam: Cam): Pt {
  return { x: (cx - rect.left - cam.x) / cam.z, y: (cy - rect.top - cam.y) / cam.z };
}

export function pathD(pts: Pt[]): string {
  if (pts.length < 2) return "";
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

export function getElementBox(el: El): { cx: number; cy: number; w: number; h: number } | null {
  if (el.type === "sticky" || el.type === "shape") {
    const e = el as StickyEl | ShapeEl;
    return { cx: e.x + e.w / 2, cy: e.y + e.h / 2, w: e.w, h: e.h };
  }
  if (el.type === "text") {
    const e = el as TextEl;
    const w = 120;
    const h = e.fontSize * 1.5;
    return { cx: e.x + w / 2, cy: e.y + h / 2, w, h };
  }
  return null;
}

export function getBoundaryPt(cx: number, cy: number, w: number, h: number, targetX: number, targetY: number): Pt {
  const dx = targetX - cx;
  const dy = targetY - cy;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x: cx, y: cy };
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx * h > absDy * w) {
    const scale = (w / 2) / absDx;
    return { x: cx + dx * scale, y: cy + dy * scale };
  } else {
    const scale = (h / 2) / absDy;
    return { x: cx + dx * scale, y: cy + dy * scale };
  }
}

// ── Shape Path Generator ───────────────────────────────────────────────────────

export function shapePathD(kind: ShapeKind, w: number, h: number): string {
  const s = 2; // inset for stroke
  switch (kind) {
    case "diamond":
      return `M${w / 2},${s} L${w - s},${h / 2} L${w / 2},${h - s} L${s},${h / 2} Z`;
    case "triangle":
      return `M${w / 2},${s} L${w - s},${h - s} L${s},${h - s} Z`;
    case "hexagon": {
      const cx = w / 2, cy = h / 2, rx = w / 2 - s, ry = h / 2 - s;
      return Array.from({ length: 6 }, (_, i) => {
        const a = (i * 60 - 30) * Math.PI / 180;
        return `${i === 0 ? "M" : "L"}${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`;
      }).join(" ") + " Z";
    }
    case "star": {
      const cx = w / 2, cy = h / 2, ro = Math.min(w, h) / 2 - s, ri = ro * 0.42;
      return Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? ro : ri, a = (i * 36 - 90) * Math.PI / 180;
        return `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
      }).join(" ") + " Z";
    }
    case "parallelogram":
      return `M${s + w * 0.2},${s} L${w - s},${s} L${w - s - w * 0.2},${h - s} L${s},${h - s} Z`;
    case "arrow_right":
      return `M${s},${h * 0.35} L${w * 0.55},${h * 0.35} L${w * 0.55},${s} L${w - s},${h / 2} L${w * 0.55},${h - s} L${w * 0.55},${h * 0.65} L${s},${h * 0.65} Z`;
    case "document":
      return `M${s},${s} L${w * 0.65},${s} L${w - s},${h * 0.35} L${w - s},${h - s} L${s},${h - s} Z M${w * 0.65},${s} L${w * 0.65},${h * 0.35} L${w - s},${h * 0.35}`;
    case "cross":
      return `M${w * 0.35},${s} L${w * 0.65},${s} L${w * 0.65},${h * 0.35} L${w - s},${h * 0.35} L${w - s},${h * 0.65} L${w * 0.65},${h * 0.65} L${w * 0.65},${h - s} L${w * 0.35},${h - s} L${w * 0.35},${h * 0.65} L${s},${h * 0.65} L${s},${h * 0.35} L${w * 0.35},${h * 0.35} Z`;
    case "pentagon": {
      const cx = w / 2, cy = h / 2, rx = w / 2 - s, ry = h / 2 - s;
      return Array.from({ length: 5 }, (_, i) => {
        const a = (i * 72 - 90) * Math.PI / 180;
        return `${i === 0 ? "M" : "L"}${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`;
      }).join(" ") + " Z";
    }
    case "octagon": {
      const cx = w / 2, cy = h / 2, rx = w / 2 - s, ry = h / 2 - s;
      return Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 - 90 + 22.5) * Math.PI / 180;
        return `${i === 0 ? "M" : "L"}${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`;
      }).join(" ") + " Z";
    }
    default: return "";
  }
}
