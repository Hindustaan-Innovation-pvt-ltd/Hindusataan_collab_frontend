// utils.ts
import type { ShapeKind } from "../types";

export function shapePathD(kind: ShapeKind, w: number, h: number): string {
  switch (kind) {
    case "triangle":
      return `M${w/2},0 L${w},${h} L0,${h} Z`;
    case "diamond":
      return `M${w/2},0 L${w},${h/2} L${w/2},${h} L0,${h/2} Z`;
    case "arrow":
      return `M0,${h/3} L${w*0.7},${h/3} L${w*0.7},0 L${w},${h/2} L${w*0.7},${h} L${w*0.7},${h*2/3} L0,${h*2/3} Z`;
    default:
      return "";
  }
}