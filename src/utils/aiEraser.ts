import type { El, Pt, PathEl, FreeArrowEl } from "../types";
import { getElementBox } from "./index";

export interface AIEraserOptions {
  radius?: number;
  topOnly?: boolean;
  altKey?: boolean;
}

export interface EraseResult {
  remainingEls: El[];
  erasedIds: string[];
  erasedEls: El[];
}

function distSq(v: Pt, w: Pt): number {
  return (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
}

function distToSegmentSq(p: Pt, v: Pt, w: Pt): number {
  const l2 = distSq(v, w);
  if (l2 === 0) return distSq(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distSq(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
}

export function distToSegment(p: Pt, v: Pt, w: Pt): number {
  return Math.sqrt(distToSegmentSq(p, v, w));
}

/**
 * Checks if a world coordinate point `pt` intersects a vector object `el`
 * within the given eraser radius.
 */
export function isPointIntersectingObject(pt: Pt, el: El, radius = 12): boolean {
  if (el.locked) return false;

  // 1. Freehand strokes (PathEl)
  if (el.type === "path") {
    const pathEl = el as PathEl;
    if (!pathEl.pts || pathEl.pts.length === 0) return false;
    const strokeRadius = radius + (pathEl.sw || 4) / 2;

    if (pathEl.pts.length === 1) {
      return distSq(pt, pathEl.pts[0]) <= strokeRadius * strokeRadius;
    }
    for (let i = 0; i < pathEl.pts.length - 1; i++) {
      if (distToSegmentSq(pt, pathEl.pts[i], pathEl.pts[i + 1]) <= strokeRadius * strokeRadius) {
        return true;
      }
    }
    return false;
  }

  // 2. Lines & Arrows (FreeArrowEl)
  if (el.type === "free_arrow") {
    const arrow = el as FreeArrowEl;
    const start = { x: arrow.x, y: arrow.y };
    const end = { x: arrow.x + arrow.dx, y: arrow.y + arrow.dy };
    const strokeRadius = radius + (arrow.sw || 4) / 2;
    return distToSegmentSq(pt, start, end) <= strokeRadius * strokeRadius;
  }

  // 3. Logical shapes, stickies, text, tables, images, graphs
  const box = getElementBox(el);
  if (!box) return false;

  const left = box.cx - box.w / 2 - radius;
  const right = box.cx + box.w / 2 + radius;
  const top = box.cy - box.h / 2 - radius;
  const bottom = box.cy + box.h / 2 + radius;

  return pt.x >= left && pt.x <= right && pt.y >= top && pt.y <= bottom;
}

/**
 * Searches `els` from top-most (end of array) to bottom-most (start of array)
 * and returns the first intersecting unlocked object.
 */
export function findIntersectedObject(pt: Pt, els: El[], radius = 12): El | null {
  for (let i = els.length - 1; i >= 0; i--) {
    const el = els[i];
    if (el.locked) continue;
    if (isPointIntersectingObject(pt, el, radius)) {
      return el;
    }
  }
  return null;
}

/**
 * Erases a logical object or group from the element list.
 * - Single erase removes one object (`altKey === false` or no `groupId`).
 * - Holding Alt (`altKey === true`) removes all elements belonging to the same `groupId`.
 */
export function eraseObject(targetId: string, els: El[], altKey = false): EraseResult {
  const target = els.find((x) => x.id === targetId);
  if (!target || target.locked) {
    return { remainingEls: els, erasedIds: [], erasedEls: [] };
  }

  let toRemoveIds: string[] = [targetId];

  if (altKey && target.groupId) {
    toRemoveIds = els.filter((x) => x.groupId === target.groupId && !x.locked).map((x) => x.id);
  }

  const remainingEls = els.filter((x) => !toRemoveIds.includes(x.id));
  const erasedEls = els.filter((x) => toRemoveIds.includes(x.id));

  return { remainingEls, erasedIds: toRemoveIds, erasedEls };
}

/**
 * Intelligent AI Eraser main function:
 * Detects intersected object at `pt` and removes the entire logical object or group.
 */
export function eraseAtPoint(pt: Pt, els: El[], options: AIEraserOptions = {}): EraseResult {
  const radius = options.radius ?? 12;
  const altKey = options.altKey ?? false;

  const hit = findIntersectedObject(pt, els, radius);
  if (!hit) {
    return { remainingEls: els, erasedIds: [], erasedEls: [] };
  }

  return eraseObject(hit.id, els, altKey);
}

/**
 * Group helper for AI Eraser: assigns a `groupId` to the specified elements.
 */
export function groupObjects(ids: string[], els: El[], groupId: string): El[] {
  return els.map((el) => {
    if (ids.includes(el.id)) {
      return { ...el, groupId };
    }
    return el;
  });
}

/**
 * Ungroup helper for AI Eraser: clears `groupId` from specified elements.
 */
export function ungroupObjects(ids: string[], els: El[]): El[] {
  return els.map((el) => {
    if (ids.includes(el.id)) {
      const copy = { ...el };
      delete copy.groupId;
      return copy;
    }
    return el;
  });
}

/**
 * AIEraserEngine class - Independent module for intelligent logical object erasing.
 */
export class AIEraserEngine {
  private defaultRadius: number;

  constructor(defaultRadius = 12) {
    this.defaultRadius = defaultRadius;
  }

  public setRadius(radius: number) {
    this.defaultRadius = radius;
  }

  public getRadius(): number {
    return this.defaultRadius;
  }

  public findIntersected(pt: Pt, els: El[], radius?: number): El | null {
    return findIntersectedObject(pt, els, radius ?? this.defaultRadius);
  }

  public erase(pt: Pt, els: El[], altKey = false, radius?: number): EraseResult {
    return eraseAtPoint(pt, els, {
      radius: radius ?? this.defaultRadius,
      altKey,
    });
  }

  public eraseById(id: string, els: El[], altKey = false): EraseResult {
    return eraseObject(id, els, altKey);
  }
}

export const aiEraserEngine = new AIEraserEngine();
