import type { ShapeEl, ShapeKind, Pt, Cam } from "../types";
import { uid, worldPt } from "./index";

/**
 * Controller for drag-to-create shape behavior.
 * Handles the interactive preview and dimension calculation.
 */
export function startShapeCreation(
  startEvent: React.PointerEvent | PointerEvent,
  startWorldPt: Pt,
  kind: ShapeKind,
  color: string,
  onUpdate: (preview: ShapeEl | null) => void,
  onComplete: (finalShape: ShapeEl | null) => void,
  getCam: () => Cam,
  getRect: () => DOMRect
) {
  const id = uid();
  const startClientX = startEvent.clientX;
  const startClientY = startEvent.clientY;

  // Initial zero-size shape at the start point
  let currentShape: ShapeEl | null = {
    id,
    type: "shape",
    kind,
    x: startWorldPt.x,
    y: startWorldPt.y,
    w: 0,
    h: 0,
    color,
  };

  const handlePointerMove = (e: PointerEvent) => {
    const cam = getCam();
    const rect = getRect();
    const currentWorldPt = worldPt(e.clientX, e.clientY, rect, cam);

    let w = currentWorldPt.x - startWorldPt.x;
    let h = currentWorldPt.y - startWorldPt.y;

    // Shift constrains proportions (1:1 aspect ratio)
    if (e.shiftKey) {
      const maxDim = Math.max(Math.abs(w), Math.abs(h));
      w = w < 0 ? -maxDim : maxDim;
      h = h < 0 ? -maxDim : maxDim;
    }

    let finalX = startWorldPt.x;
    let finalY = startWorldPt.y;
    let finalW = w;
    let finalH = h;

    // Handle dragging backwards (negative width/height)
    if (w < 0) {
      finalX = startWorldPt.x + w;
      finalW = Math.abs(w);
    }
    if (h < 0) {
      finalY = startWorldPt.y + h;
      finalH = Math.abs(h);
    }

    currentShape = {
      ...currentShape!,
      x: finalX,
      y: finalY,
      w: finalW,
      h: finalH,
    };

    onUpdate(currentShape);
  };

  const cleanup = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("keydown", handleKeyDown);
  };

  const handlePointerUp = (e: PointerEvent) => {
    cleanup();

    const dx = e.clientX - startClientX;
    const dy = e.clientY - startClientY;
    const distSq = dx * dx + dy * dy;

    // Cancel if drag distance is very small (e.g., just a click)
    if (distSq < 25) { // 5px threshold (5^2 = 25)
      onComplete(null);
      return;
    }

    onComplete(currentShape);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      cleanup();
      onUpdate(null);
      onComplete(null);
    }
  };

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("keydown", handleKeyDown);
}
