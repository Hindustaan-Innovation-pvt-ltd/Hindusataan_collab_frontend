import type { Pt, El, ShapeEl, FreeArrowEl } from "../types";
import { uid } from "./index";

export type RecognizedShapeType =
  | "rectangle"
  | "square"
  | "circle"
  | "ellipse"
  | "triangle"
  | "line"
  | "arrow";

export interface ShapeRecognitionResult {
  shapeType: RecognizedShapeType;
  confidence: number; // 0.0 to 1.0 (default threshold 0.90)
  bounds: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  lineData?: {
    start: Pt;
    end: Pt;
    isArrow?: boolean;
  };
}

export interface ShapeRecognizer {
  name: RecognizedShapeType;
  recognize(pts: Pt[], ctx: RecognitionContext): ShapeRecognitionResult | null;
}

export interface RecognitionContext {
  pts: Pt[];
  resampled: Pt[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  diag: number;
  pathLen: number;
  endToEndDist: number;
  closedness: number;
  aspectRatio: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function distance(p1: Pt, p2: Pt): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

function resampleStroke(pts: Pt[], count = 50): Pt[] {
  if (pts.length === 0) return [];
  if (pts.length === 1) return Array(count).fill(pts[0]);

  let totalLen = 0;
  for (let i = 1; i < pts.length; i++) {
    totalLen += distance(pts[i - 1], pts[i]);
  }
  if (totalLen === 0) return Array(count).fill(pts[0]);

  const step = totalLen / (count - 1);
  const result: Pt[] = [pts[0]];
  let currentDist = 0;
  let nextTarget = step;

  let prev = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const curr = pts[i];
    const segLen = distance(prev, curr);
    while (currentDist + segLen >= nextTarget && result.length < count) {
      const t = segLen === 0 ? 0 : (nextTarget - currentDist) / segLen;
      result.push({
        x: prev.x + t * (curr.x - prev.x),
        y: prev.y + t * (curr.y - prev.y),
      });
      nextTarget += step;
    }
    currentDist += segLen;
    prev = curr;
  }
  while (result.length < count) {
    result.push(pts[pts.length - 1]);
  }
  return result;
}

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return distance(p, a);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

function douglasPeucker(pts: Pt[], epsilon: number): Pt[] {
  if (pts.length <= 2) return pts;
  let maxDist = 0;
  let idx = 0;
  const start = pts[0];
  const end = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) {
    const d = distToSegment(pts[i], start, end);
    if (d > maxDist) {
      maxDist = d;
      idx = i;
    }
  }
  if (maxDist > epsilon) {
    const left = douglasPeucker(pts.slice(0, idx + 1), epsilon);
    const right = douglasPeucker(pts.slice(idx), epsilon);
    return left.slice(0, left.length - 1).concat(right);
  } else {
    return [start, end];
  }
}

// ── Recognizers ──────────────────────────────────────────────────────────────

export class LineRecognizer implements ShapeRecognizer {
  name: RecognizedShapeType = "line";

  recognize(_pts: Pt[], ctx: RecognitionContext): ShapeRecognitionResult | null {
    if (ctx.diag < 15 || ctx.pathLen === 0) return null;
    const straightness = ctx.endToEndDist / ctx.pathLen;
    if (straightness < 0.88) return null;

    const start = ctx.pts[0];
    const end = ctx.pts[ctx.pts.length - 1];
    let totalErr = 0;
    for (const p of ctx.resampled) {
      totalErr += distToSegment(p, start, end);
    }
    const avgErr = totalErr / ctx.resampled.length;
    const normErr = avgErr / Math.max(10, ctx.endToEndDist);

    const confidence = Math.min(1.0, straightness * Math.max(0, 1.0 - normErr * 4));
    if (confidence < 0.85) return null;

    return {
      shapeType: "line",
      confidence,
      bounds: { x: ctx.minX, y: ctx.minY, w: ctx.w, h: ctx.h },
      lineData: { start, end, isArrow: false },
    };
  }
}

export class ArrowRecognizer implements ShapeRecognizer {
  name: RecognizedShapeType = "arrow";

  recognize(pts: Pt[], ctx: RecognitionContext): ShapeRecognitionResult | null {
    if (ctx.diag < 25 || pts.length < 10) return null;
    const start = pts[0];

    // Find furthest point (potential arrowhead tip)
    let tipIdx = 0;
    let maxDist = 0;
    for (let i = 0; i < pts.length; i++) {
      const d = distance(start, pts[i]);
      if (d > maxDist) {
        maxDist = d;
        tipIdx = i;
      }
    }

    if (tipIdx < pts.length * 0.5 || maxDist < 20) return null;

    const stemPts = pts.slice(0, tipIdx + 1);
    const tailPts = pts.slice(tipIdx);

    if (tailPts.length < 3) return null;

    // Check straightness of stem
    let stemLen = 0;
    for (let i = 1; i < stemPts.length; i++) {
      stemLen += distance(stemPts[i - 1], stemPts[i]);
    }
    const stemStraightness = maxDist / Math.max(1, stemLen);
    if (stemStraightness < 0.85) return null;

    // Check that tail points fold backwards toward the start point
    const tip = pts[tipIdx];
    const dx = tip.x - start.x;
    const dy = tip.y - start.y;
    let foldedBackward = false;
    for (const p of tailPts) {
      const vX = p.x - tip.x;
      const vY = p.y - tip.y;
      const dot = vX * dx + vY * dy;
      if (dot < 0 && distance(p, tip) > maxDist * 0.08) {
        foldedBackward = true;
        break;
      }
    }
    if (!foldedBackward) return null;

    const confidence = Math.min(0.98, stemStraightness * 1.04);
    return {
      shapeType: "arrow",
      confidence,
      bounds: { x: ctx.minX, y: ctx.minY, w: ctx.w, h: ctx.h },
      lineData: { start, end: tip, isArrow: true },
    };
  }
}

export class CircleRecognizer implements ShapeRecognizer {
  name: RecognizedShapeType = "circle";

  recognize(_pts: Pt[], ctx: RecognitionContext): ShapeRecognitionResult | null {
    if (ctx.closedness < 0.65 || ctx.aspectRatio < 0.80 || ctx.diag < 20) return null;

    const r = (ctx.w + ctx.h) / 4;
    let errSum = 0;
    for (const p of ctx.resampled) {
      const d = Math.hypot(p.x - ctx.cx, p.y - ctx.cy);
      errSum += Math.abs(d - r) / r;
    }
    const avgErr = errSum / ctx.resampled.length;
    const confidence = Math.max(0, 1 - avgErr * 3.2) * ctx.closedness * (0.85 + 0.15 * ctx.aspectRatio);

    return {
      shapeType: "circle",
      confidence: Math.min(1.0, confidence),
      bounds: { x: ctx.minX, y: ctx.minY, w: ctx.w, h: ctx.h },
    };
  }
}

export class EllipseRecognizer implements ShapeRecognizer {
  name: RecognizedShapeType = "ellipse";

  recognize(_pts: Pt[], ctx: RecognitionContext): ShapeRecognitionResult | null {
    if (ctx.closedness < 0.65 || ctx.aspectRatio >= 0.80 || ctx.diag < 20) return null;

    const rx = ctx.w / 2;
    const ry = ctx.h / 2;
    if (rx === 0 || ry === 0) return null;

    let errSum = 0;
    for (const p of ctx.resampled) {
      const val = Math.hypot((p.x - ctx.cx) / rx, (p.y - ctx.cy) / ry);
      errSum += Math.abs(val - 1.0);
    }
    const avgErr = errSum / ctx.resampled.length;
    const confidence = Math.max(0, 1 - avgErr * 2.8) * ctx.closedness;

    return {
      shapeType: "ellipse",
      confidence: Math.min(1.0, confidence),
      bounds: { x: ctx.minX, y: ctx.minY, w: ctx.w, h: ctx.h },
    };
  }
}

export class SquareRecognizer implements ShapeRecognizer {
  name: RecognizedShapeType = "square";

  recognize(_pts: Pt[], ctx: RecognitionContext): ShapeRecognitionResult | null {
    if (ctx.closedness < 0.65 || ctx.aspectRatio < 0.80 || ctx.diag < 20) return null;

    let totalEdgeErr = 0;
    for (const p of ctx.resampled) {
      const distToEdge = Math.min(
        Math.abs(p.x - ctx.minX),
        Math.abs(p.x - ctx.maxX),
        Math.abs(p.y - ctx.minY),
        Math.abs(p.y - ctx.maxY)
      );
      totalEdgeErr += distToEdge / ctx.diag;
    }
    const avgEdgeErr = totalEdgeErr / ctx.resampled.length;
    const perim = 2 * (ctx.w + ctx.h);
    const perimRatio = Math.min(ctx.pathLen, perim) / Math.max(1, Math.max(ctx.pathLen, perim));

    const confidence = Math.max(0, 1 - avgEdgeErr * 7.5) * perimRatio * ctx.closedness * (0.85 + 0.15 * ctx.aspectRatio);

    return {
      shapeType: "square",
      confidence: Math.min(1.0, confidence),
      bounds: { x: ctx.minX, y: ctx.minY, w: ctx.w, h: ctx.h },
    };
  }
}

export class RectangleRecognizer implements ShapeRecognizer {
  name: RecognizedShapeType = "rectangle";

  recognize(_pts: Pt[], ctx: RecognitionContext): ShapeRecognitionResult | null {
    if (ctx.closedness < 0.65 || ctx.aspectRatio >= 0.80 || ctx.diag < 20) return null;

    let totalEdgeErr = 0;
    for (const p of ctx.resampled) {
      const distToEdge = Math.min(
        Math.abs(p.x - ctx.minX),
        Math.abs(p.x - ctx.maxX),
        Math.abs(p.y - ctx.minY),
        Math.abs(p.y - ctx.maxY)
      );
      totalEdgeErr += distToEdge / ctx.diag;
    }
    const avgEdgeErr = totalEdgeErr / ctx.resampled.length;
    const perim = 2 * (ctx.w + ctx.h);
    const perimRatio = Math.min(ctx.pathLen, perim) / Math.max(1, Math.max(ctx.pathLen, perim));

    const confidence = Math.max(0, 1 - avgEdgeErr * 7.0) * perimRatio * ctx.closedness;

    return {
      shapeType: "rectangle",
      confidence: Math.min(1.0, confidence),
      bounds: { x: ctx.minX, y: ctx.minY, w: ctx.w, h: ctx.h },
    };
  }
}

export class TriangleRecognizer implements ShapeRecognizer {
  name: RecognizedShapeType = "triangle";

  recognize(_pts: Pt[], ctx: RecognitionContext): ShapeRecognitionResult | null {
    if (ctx.closedness < 0.65 || ctx.diag < 20) return null;

    // Use Douglas-Peucker to find vertices
    const simplified = douglasPeucker(ctx.resampled, ctx.diag * 0.08);
    // Remove duplicate end point if close to start
    let corners = simplified;
    if (corners.length >= 2 && distance(corners[0], corners[corners.length - 1]) < ctx.diag * 0.15) {
      corners = corners.slice(0, corners.length - 1);
    }

    if (corners.length !== 3) return null;

    const [v1, v2, v3] = corners;
    let totalErr = 0;
    for (const p of ctx.resampled) {
      const d = Math.min(
        distToSegment(p, v1, v2),
        distToSegment(p, v2, v3),
        distToSegment(p, v3, v1)
      );
      totalErr += d / ctx.diag;
    }
    const avgErr = totalErr / ctx.resampled.length;
    const confidence = Math.max(0, 1 - avgErr * 10) * ctx.closedness;

    return {
      shapeType: "triangle",
      confidence: Math.min(1.0, confidence),
      bounds: { x: ctx.minX, y: ctx.minY, w: ctx.w, h: ctx.h },
    };
  }
}

// ── Recognition Engine ───────────────────────────────────────────────────────

export class ShapeRecognitionEngine {
  private recognizers: ShapeRecognizer[] = [];
  private threshold: number = 0.90;

  constructor(threshold = 0.90) {
    this.threshold = threshold;
    this.registerDefaultRecognizers();
  }

  public setThreshold(val: number): void {
    this.threshold = val;
  }

  public getThreshold(): number {
    return this.threshold;
  }

  public registerRecognizer(recognizer: ShapeRecognizer): void {
    this.recognizers.push(recognizer);
  }

  public removeRecognizer(name: RecognizedShapeType): void {
    this.recognizers = this.recognizers.filter((r) => r.name !== name);
  }

  private registerDefaultRecognizers(): void {
    this.registerRecognizer(new CircleRecognizer());
    this.registerRecognizer(new EllipseRecognizer());
    this.registerRecognizer(new SquareRecognizer());
    this.registerRecognizer(new RectangleRecognizer());
    this.registerRecognizer(new TriangleRecognizer());
    this.registerRecognizer(new ArrowRecognizer());
    this.registerRecognizer(new LineRecognizer());
  }

  /**
   * Analyzes freehand stroke points asynchronously so it never blocks the UI thread.
   */
  public async recognize(pts: Pt[]): Promise<ShapeRecognitionResult | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!pts || pts.length < 5) {
          resolve(null);
          return;
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let pathLen = 0;

        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
          if (i > 0) pathLen += distance(pts[i - 1], pts[i]);
        }

        const w = Math.max(1, maxX - minX);
        const h = Math.max(1, maxY - minY);
        const cx = minX + w / 2;
        const cy = minY + h / 2;
        const diag = Math.hypot(w, h);
        const endToEndDist = distance(pts[0], pts[pts.length - 1]);
        const closedness = Math.max(0, 1 - endToEndDist / Math.max(10, diag));
        const aspectRatio = Math.min(w, h) / Math.max(w, h);
        const resampled = resampleStroke(pts, 50);

        const ctx: RecognitionContext = {
          pts,
          resampled,
          minX,
          minY,
          maxX,
          maxY,
          w,
          h,
          cx,
          cy,
          diag,
          pathLen,
          endToEndDist,
          closedness,
          aspectRatio,
        };

        let best: ShapeRecognitionResult | null = null;
        for (const r of this.recognizers) {
          const res = r.recognize(pts, ctx);
          if (res && res.confidence >= this.threshold) {
            if (!best || res.confidence > best.confidence) {
              best = res;
            }
          }
        }

        resolve(best);
      }, 0);
    });
  }

  /**
   * Converts a successful recognition result into a clean, editable vector El.
   */
  public createShapeElement(
    res: ShapeRecognitionResult,
    color: string,
    strokeWidth = 4
  ): El {
    const id = uid();
    switch (res.shapeType) {
      case "rectangle":
        return {
          id,
          type: "shape",
          kind: "rect",
          x: res.bounds.x,
          y: res.bounds.y,
          w: res.bounds.w,
          h: res.bounds.h,
          color,
        } as ShapeEl;

      case "square": {
        const size = Math.max(res.bounds.w, res.bounds.h);
        const cx = res.bounds.x + res.bounds.w / 2;
        const cy = res.bounds.y + res.bounds.h / 2;
        return {
          id,
          type: "shape",
          kind: "rect",
          x: cx - size / 2,
          y: cy - size / 2,
          w: size,
          h: size,
          color,
        } as ShapeEl;
      }

      case "circle": {
        const size = Math.max(res.bounds.w, res.bounds.h);
        const cx = res.bounds.x + res.bounds.w / 2;
        const cy = res.bounds.y + res.bounds.h / 2;
        return {
          id,
          type: "shape",
          kind: "ellipse",
          x: cx - size / 2,
          y: cy - size / 2,
          w: size,
          h: size,
          color,
        } as ShapeEl;
      }

      case "ellipse":
        return {
          id,
          type: "shape",
          kind: "ellipse",
          x: res.bounds.x,
          y: res.bounds.y,
          w: res.bounds.w,
          h: res.bounds.h,
          color,
        } as ShapeEl;

      case "triangle":
        return {
          id,
          type: "shape",
          kind: "triangle",
          x: res.bounds.x,
          y: res.bounds.y,
          w: res.bounds.w,
          h: res.bounds.h,
          color,
        } as ShapeEl;

      case "line": {
        const start = res.lineData?.start || { x: res.bounds.x, y: res.bounds.y };
        const end = res.lineData?.end || { x: res.bounds.x + res.bounds.w, y: res.bounds.y + res.bounds.h };
        return {
          id,
          type: "free_arrow",
          x: start.x,
          y: start.y,
          dx: end.x - start.x,
          dy: end.y - start.y,
          color,
          sw: strokeWidth,
          arrowHead: false,
        } as FreeArrowEl;
      }

      case "arrow": {
        const start = res.lineData?.start || { x: res.bounds.x, y: res.bounds.y };
        const end = res.lineData?.end || { x: res.bounds.x + res.bounds.w, y: res.bounds.y + res.bounds.h };
        return {
          id,
          type: "free_arrow",
          x: start.x,
          y: start.y,
          dx: end.x - start.x,
          dy: end.y - start.y,
          color,
          sw: strokeWidth,
          arrowHead: true,
        } as FreeArrowEl;
      }
    }
  }
}

export const shapeRecognitionEngine = new ShapeRecognitionEngine(0.90);
