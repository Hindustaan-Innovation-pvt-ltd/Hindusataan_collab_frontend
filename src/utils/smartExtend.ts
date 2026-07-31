import type { El, FreeArrowEl, Pt } from "../types";
import { getElementBox, getBoundaryPt } from "./index";

export interface SmartExtendOptions {
  gridSnap?: boolean;
  gridSize?: number;
  objectSnap?: boolean;
  snapThreshold?: number;
}

export interface SnapGuide {
  type: "vertical" | "horizontal";
  position: number;
  start: number;
  end: number;
}

export interface SnapResult {
  x: number;
  y: number;
  w: number;
  h: number;
  guides: SnapGuide[];
}

/**
 * Snaps a single numerical value to a grid spacing if within the threshold.
 */
export function snapToGrid(val: number, gridSize = 20, threshold = 6): number {
  const rem = Math.abs(val % gridSize);
  if (rem <= threshold) {
    return Math.round(val / gridSize) * gridSize;
  }
  return val;
}

/**
 * Snaps a coordinate point to grid spacing.
 */
export function snapPtToGrid(pt: Pt, gridSize = 20, threshold = 6): Pt {
  return {
    x: snapToGrid(pt.x, gridSize, threshold),
    y: snapToGrid(pt.y, gridSize, threshold),
  };
}

/**
 * Snaps an element bounding box to nearby objects' edges and centers.
 */
export function snapToNearbyObjects(
  box: { x: number; y: number; w: number; h: number },
  currentId: string,
  els: El[],
  threshold = 6
): SnapResult {
  let { x, y, w, h } = box;
  const guides: SnapGuide[] = [];

  let bestDx = threshold + 1;
  let bestDy = threshold + 1;
  let snappedX = x;
  let snappedY = y;

  for (const el of els) {
    if (el.id === currentId) continue;
    const targetBox = getElementBox(el);
    if (!targetBox) continue;

    const tLeft = targetBox.cx - targetBox.w / 2;
    const tRight = targetBox.cx + targetBox.w / 2;
    const tTop = targetBox.cy - targetBox.h / 2;
    const tBottom = targetBox.cy + targetBox.h / 2;
    const tCx = targetBox.cx;
    const tCy = targetBox.cy;

    // Vertical alignments (x axis)
    const xCandidates = [
      { val: tLeft - 0, offset: tLeft - x, pos: tLeft },
      { val: tRight - w, offset: (tRight - w) - x, pos: tRight },
      { val: tLeft - w, offset: (tLeft - w) - x, pos: tLeft },
      { val: tRight - 0, offset: tRight - x, pos: tRight },
      { val: tCx - w / 2, offset: (tCx - w / 2) - x, pos: tCx },
    ];

    for (const cand of xCandidates) {
      if (Math.abs(cand.offset) < Math.abs(bestDx) && Math.abs(cand.offset) <= threshold) {
        bestDx = cand.offset;
        snappedX = x + cand.offset;
        guides.push({
          type: "vertical",
          position: cand.pos,
          start: Math.min(y, tTop),
          end: Math.max(y + h, tBottom),
        });
      }
    }

    // Horizontal alignments (y axis)
    const yCandidates = [
      { val: tTop - 0, offset: tTop - y, pos: tTop },
      { val: tBottom - h, offset: (tBottom - h) - y, pos: tBottom },
      { val: tTop - h, offset: (tTop - h) - y, pos: tTop },
      { val: tBottom - 0, offset: tBottom - y, pos: tBottom },
      { val: tCy - h / 2, offset: (tCy - h / 2) - y, pos: tCy },
    ];

    for (const cand of yCandidates) {
      if (Math.abs(cand.offset) < Math.abs(bestDy) && Math.abs(cand.offset) <= threshold) {
        bestDy = cand.offset;
        snappedY = y + cand.offset;
        guides.push({
          type: "horizontal",
          position: cand.pos,
          start: Math.min(x, tLeft),
          end: Math.max(x + w, tRight),
        });
      }
    }
  }

  return { x: snappedX, y: snappedY, w, h, guides };
}

/**
 * Calculates updated width, height, and coordinates when resizing a shape,
 * supporting aspect ratio preservation (Shift key), circle radius updates,
 * and grid / nearby object snapping.
 */
export function calculateShapeResize(
  initial: { x: number; y: number; w: number; h: number },
  dx: number,
  dy: number,
  handle: string,
  kind: string,
  shiftKey: boolean,
  options: SmartExtendOptions = {},
  minSize = 30
): { x: number; y: number; w: number; h: number } {
  let newX = initial.x;
  let newY = initial.y;
  let newW = initial.w;
  let newH = initial.h;

  const ratio = initial.w / initial.h;

  // 1. Horizontal extension
  if (handle === "tl" || handle === "bl" || handle === "l") {
    const potW = initial.w - dx;
    if (potW >= minSize) {
      newW = potW;
      newX = initial.x + dx;
    } else {
      newW = minSize;
      newX = initial.x + (initial.w - minSize);
    }
  } else if (handle === "tr" || handle === "br" || handle === "r") {
    newW = Math.max(minSize, initial.w + dx);
  }

  // 2. Vertical extension
  if (handle === "tl" || handle === "tr" || handle === "t") {
    const potH = initial.h - dy;
    if (potH >= minSize) {
      newH = potH;
      newY = initial.y + dy;
    } else {
      newH = minSize;
      newY = initial.y + (initial.h - minSize);
    }
  } else if (handle === "bl" || handle === "br" || handle === "b") {
    newH = Math.max(minSize, initial.h + dy);
  }

  // 3. Circle/Ellipse radius or Aspect ratio preservation (Shift key)
  const isCircle = kind === "ellipse" && Math.abs(initial.w - initial.h) < 2;
  if ((shiftKey && handle.length === 2) || (isCircle && handle.length === 2)) {
    if (Math.abs(dx) > Math.abs(dy)) {
      let adjH = newW / ratio;
      if (adjH < minSize) {
        adjH = minSize;
        newW = minSize * ratio;
        if (handle === "tl" || handle === "bl") newX = initial.x + (initial.w - newW);
      }
      if (handle === "tl" || handle === "tr") newY = initial.y + (initial.h - adjH);
      newH = adjH;
    } else {
      let adjW = newH * ratio;
      if (adjW < minSize) {
        adjW = minSize;
        newH = minSize / ratio;
        if (handle === "tl" || handle === "tr") newY = initial.y + (initial.h - newH);
      }
      if (handle === "tl" || handle === "bl") newX = initial.x + (initial.w - adjW);
      newW = adjW;
    }
  }

  // 4. Snap to grid if enabled
  if (options.gridSnap) {
    const gSize = options.gridSize || 20;
    const th = options.snapThreshold || 6;
    newW = snapToGrid(newW, gSize, th);
    newH = snapToGrid(newH, gSize, th);
    newX = snapToGrid(newX, gSize, th);
    newY = snapToGrid(newY, gSize, th);
  }

  return { x: newX, y: newY, w: newW, h: newH };
}

/**
 * Calculates updated line/arrow coordinates when extending a line or arrow shaft,
 * preserving arrowhead markers and supporting angle snapping (Shift key) and grid snapping.
 */
export function calculateLineExtend(
  el: FreeArrowEl,
  dx: number,
  dy: number,
  handle: "start" | "end",
  shiftKey: boolean,
  options: SmartExtendOptions = {}
): Partial<FreeArrowEl> {
  const initX = el.x;
  const initY = el.y;
  const initDx = el.dx;
  const initDy = el.dy;

  if (handle === "start") {
    let newX = initX + dx;
    let newY = initY + dy;

    if (shiftKey) {
      const endPtX = initX + initDx;
      const endPtY = initY + initDy;
      const ang = Math.atan2(newY - endPtY, newX - endPtX);
      const dist = Math.hypot(newX - endPtX, newY - endPtY);
      const snapAng = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
      newX = endPtX + dist * Math.cos(snapAng);
      newY = endPtY + dist * Math.sin(snapAng);
    }

    if (options.gridSnap) {
      const snapped = snapPtToGrid({ x: newX, y: newY }, options.gridSize, options.snapThreshold);
      newX = snapped.x;
      newY = snapped.y;
    }

    return {
      x: newX,
      y: newY,
      dx: (initX + initDx) - newX,
      dy: (initY + initDy) - newY,
    };
  } else {
    let newDx = initDx + dx;
    let newDy = initDy + dy;

    if (shiftKey) {
      const ang = Math.atan2(newDy, newDx);
      const dist = Math.hypot(newDx, newDy);
      const snapAng = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
      newDx = dist * Math.cos(snapAng);
      newDy = dist * Math.sin(snapAng);
    }

    if (options.gridSnap) {
      const endX = snapToGrid(initX + newDx, options.gridSize, options.snapThreshold);
      const endY = snapToGrid(initY + newDy, options.gridSize, options.snapThreshold);
      newDx = endX - initX;
      newDy = endY - initY;
    }

    return {
      dx: newDx,
      dy: newDy,
    };
  }
}

/**
 * Automatically updates attachment points for all arrows/connections
 * connected to shapes or sticky notes on the canvas.
 */
export function updateConnectedAttachmentPoints(els: El[]): El[] {
  let changed = false;
  const updated = els.map((el) => {
    if (el.type !== "free_arrow") return el;
    const arrow = el as FreeArrowEl;
    if (!arrow.from && !arrow.to) return el;

    let newX = arrow.x;
    let newY = arrow.y;
    let newEndPtX = arrow.x + arrow.dx;
    let newEndPtY = arrow.y + arrow.dy;

    const fromEl = arrow.from ? els.find(e => e.id === arrow.from) : null;
    const toEl = arrow.to ? els.find(e => e.id === arrow.to) : null;

    const fromBox = fromEl ? getElementBox(fromEl) : null;
    const toBox = toEl ? getElementBox(toEl) : null;

    if (!fromBox && !toBox) return el;

    const targetForStart = toBox ? { x: toBox.cx, y: toBox.cy } : { x: newEndPtX, y: newEndPtY };
    const targetForEnd = fromBox ? { x: fromBox.cx, y: fromBox.cy } : { x: newX, y: newY };

    if (fromBox) {
      const pt = getBoundaryPt(fromBox.cx, fromBox.cy, fromBox.w, fromBox.h, targetForStart.x, targetForStart.y);
      newX = pt.x;
      newY = pt.y;
    }
    if (toBox) {
      const pt = getBoundaryPt(toBox.cx, toBox.cy, toBox.w, toBox.h, targetForEnd.x, targetForEnd.y);
      newEndPtX = pt.x;
      newEndPtY = pt.y;
    }

    const newDx = newEndPtX - newX;
    const newDy = newEndPtY - newY;

    if (
      Math.abs(newX - arrow.x) > 0.5 ||
      Math.abs(newY - arrow.y) > 0.5 ||
      Math.abs(newDx - arrow.dx) > 0.5 ||
      Math.abs(newDy - arrow.dy) > 0.5
    ) {
      changed = true;
      return { ...arrow, x: newX, y: newY, dx: newDx, dy: newDy };
    }
    return el;
  });

  return changed ? updated : els;
}

/**
 * SmartExtendEngine - Extensible architecture for smart shape extending
 * and future AI-assisted canvas editing.
 */
export class SmartExtendEngine {
  private options: SmartExtendOptions;

  constructor(options: SmartExtendOptions = { gridSnap: true, gridSize: 20, objectSnap: true, snapThreshold: 6 }) {
    this.options = options;
  }

  public setOptions(opts: Partial<SmartExtendOptions>) {
    this.options = { ...this.options, ...opts };
  }

  public getOptions(): SmartExtendOptions {
    return this.options;
  }

  public resizeShape(
    initial: { x: number; y: number; w: number; h: number },
    dx: number,
    dy: number,
    handle: string,
    kind: string,
    shiftKey: boolean
  ) {
    return calculateShapeResize(initial, dx, dy, handle, kind, shiftKey, this.options);
  }

  public extendLine(el: FreeArrowEl, dx: number, dy: number, handle: "start" | "end", shiftKey: boolean) {
    return calculateLineExtend(el, dx, dy, handle, shiftKey, this.options);
  }

  public snapObjects(box: { x: number; y: number; w: number; h: number }, id: string, els: El[]) {
    return snapToNearbyObjects(box, id, els, this.options.snapThreshold);
  }

  public autoUpdateAttachments(els: El[]): El[] {
    return updateConnectedAttachmentPoints(els);
  }

  /**
   * Extensible hook for AI-assisted shape transformation or layout enhancement.
   */
  public async applyAIEnhancement(els: El[], _instruction?: string): Promise<El[]> {
    // Hook point for AI-assisted smart formatting and layout adjustments
    return updateConnectedAttachmentPoints(els);
  }
}

export const smartExtendEngine = new SmartExtendEngine();
