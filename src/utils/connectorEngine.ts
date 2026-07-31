import type { Pt } from "../types";

export type RoutingType = "straight" | "elbow" | "curved";

export interface RoutingResult {
  d: string;
  bendPt: Pt;
  angle: number; 
}

export const connectorEngine = {
  getRoutingPath(start: Pt, end: Pt, bend: { ratio: number, offset: number } | undefined, routing: RoutingType): RoutingResult {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const L = Math.hypot(dx, dy);
    
    // Normalize direction, or default if length is 0
    const ux = L === 0 ? 1 : dx / L;
    const uy = L === 0 ? 0 : dy / L;

    const ratio = bend ? bend.ratio : 0.5;
    const offset = bend ? bend.offset : 0;

    const midX = start.x + ratio * dx;
    const midY = start.y + ratio * dy;

    // Perpendicular vector: (-uy, ux)
    const bendPt = {
      x: midX - offset * uy,
      y: midY + offset * ux
    };

    if (routing === "straight") {
      const d = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      return { d, bendPt, angle };
    }

    if (routing === "curved") {
      const d = `M ${start.x} ${start.y} Q ${bendPt.x} ${bendPt.y} ${end.x} ${end.y}`;
      const bDx = end.x - bendPt.x;
      const bDy = end.y - bendPt.y;
      const angle = Math.atan2(bDy, bDx);
      return { d, bendPt, angle };
    }

    if (routing === "elbow") {
      const dxStart = Math.abs(start.x - bendPt.x);
      const dyStart = Math.abs(start.y - bendPt.y);

      const routeHorizontalFirst = dxStart > dyStart;

      let d = "";
      let angle = 0;

      if (routeHorizontalFirst) {
        d = `M ${start.x} ${start.y} L ${bendPt.x} ${start.y} L ${bendPt.x} ${end.y} L ${end.x} ${end.y}`;
        if (Math.abs(end.x - bendPt.x) > 0.1) {
          angle = Math.atan2(0, end.x - bendPt.x);
        } else {
          angle = Math.atan2(end.y - start.y, 0); 
        }
      } else {
        d = `M ${start.x} ${start.y} L ${start.x} ${bendPt.y} L ${end.x} ${bendPt.y} L ${end.x} ${end.y}`;
        if (Math.abs(end.y - bendPt.y) > 0.1) {
          angle = Math.atan2(end.y - bendPt.y, 0);
        } else {
          angle = Math.atan2(0, end.x - start.x);
        }
      }

      return { d, bendPt, angle };
    }

    return { d: "", bendPt, angle: 0 };
  },

  calculateBendFromPoint(start: Pt, end: Pt, targetPt: Pt): { ratio: number, offset: number } {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const L = Math.hypot(dx, dy);

    if (L === 0) {
      return { ratio: 0.5, offset: targetPt.x - start.x }; // Fallback
    }

    const ux = dx / L;
    const uy = dy / L;

    const vx = targetPt.x - start.x;
    const vy = targetPt.y - start.y;

    const proj = vx * ux + vy * uy;
    const ratio = proj / L;

    // Cross product to find perpendicular offset
    // (vx, vy) cross (ux, uy)
    const offset = -vx * uy + vy * ux;

    return { ratio, offset };
  }
};
