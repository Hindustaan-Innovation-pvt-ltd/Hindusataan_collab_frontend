// utils.ts
import type { ShapeKind } from "../types";

export function shapePathD(kind: ShapeKind, w: number, h: number): string {
  switch (kind) {
    case "triangle":
      return `M${w / 2},0 L${w},${h} L0,${h} Z`;
    case "diamond":
      return `M${w / 2},0 L${w},${h / 2} L${w / 2},${h} L0,${h / 2} Z`;
    case "arrow":
    case "arrow_right":
      return `M0,${h * 0.3} L${w * 0.6},${h * 0.3} L${w * 0.6},0 L${w},${h / 2} L${w * 0.6},${h} L${w * 0.6},${h * 0.7} L0,${h * 0.7} Z`;
    case "hexagon":
      return `M${w / 2},0 L${w},${h * 0.25} L${w},${h * 0.75} L${w / 2},${h} L0,${h * 0.75} L0,${h * 0.25} Z`;
    case "star":
      return `M${w / 2},0 L${w * 0.65},${h * 0.35} L${w},${h * 0.35} L${w * 0.7},${h * 0.6} L${w * 0.85},${h} L${w / 2},${h * 0.75} L${w * 0.15},${h} L${w * 0.3},${h * 0.6} L0,${h * 0.35} L${w * 0.35},${h * 0.35} Z`;
    case "parallelogram":
      return `M${w * 0.25},0 L${w},0 L${w * 0.75},${h} L0,${h} Z`;
    case "document":
      return `M0,0 L${w * 0.7},0 L${w},${h * 0.3} L${w},${h} L0,${h} Z`;
    case "cross":
      return `M${w * 0.33},0 L${w * 0.66},0 L${w * 0.66},${h * 0.33} L${w},${h * 0.33} L${w},${h * 0.66} L${w * 0.66},${h * 0.66} L${w * 0.66},${h} L${w * 0.33},${h} L${w * 0.33},${h * 0.66} L0,${h * 0.66} L0,${h * 0.33} L${w * 0.33},${h * 0.33} Z`;
    case "pentagon":
      return `M${w / 2},0 L${w},${h * 0.38} L${w * 0.82},${h} L${w * 0.18},${h} L0,${h * 0.38} Z`;
    case "octagon":
      return `M${w * 0.3},0 L${w * 0.7},0 L${w},${h * 0.3} L${w},${h * 0.7} L${w * 0.7},${h} L${w * 0.3},${h} L0,${h * 0.7} L0,${h * 0.3} Z`;
    default:
      return "";
  }
}