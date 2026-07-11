import React from "react";
import type { ImageEl } from "../types";

interface ImageNodeProps {
  el: ImageEl;
  selected: boolean;
  onUpdate: (id: string, updates: Partial<ImageEl>) => void;
  scale: number;
}

const MIN_SIZE = 20;

type HandlePosition = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r";

export const ImageNode = React.memo(function ImageNode({
  el,
  selected,
  onUpdate,
  scale,
}: ImageNodeProps) {
  const { x, y, w, h, url, id } = el;

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>, handle: HandlePosition) => {
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = w;
    const startH = h;
    const startElX = x;
    const startElY = y;
    const aspectRatio = startW / startH;

    // For images, we preserve aspect ratio by default. We ignore it if shift is held.
    const preserveAspect = !e.shiftKey;

    const onMove = (moveEv: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
      let dx = (moveEv.clientX - startX) / scale;
      let dy = (moveEv.clientY - startY) / scale;
      let newW = startW;
      let newH = startH;
      let newX = startElX;
      let newY = startElY;

      // Map handles to corners for compatibility with the old logic
      const cornerMap: Record<HandlePosition, string> = {
        tl: "nw", tr: "ne", bl: "sw", br: "se",
        t: "n", b: "s", l: "w", r: "e"
      };
      const corner = cornerMap[handle];

      // Handle corner cases
      if (corner === "se") {
        newW = startW + dx;
        newH = startH + dy;
      } else if (corner === "sw") {
        newW = startW - dx;
        newH = startH + dy;
        newX = startElX + dx;
      } else if (corner === "ne") {
        newW = startW + dx;
        newH = startH - dy;
        newY = startElY + dy;
      } else if (corner === "nw") {
        newW = startW - dx;
        newH = startH - dy;
        newX = startElX + dx;
        newY = startElY + dy;
      } else if (corner === "e") {
        newW = startW + dx;
      } else if (corner === "w") {
        newW = startW - dx;
        newX = startElX + dx;
      } else if (corner === "s") {
        newH = startH + dy;
      } else if (corner === "n") {
        newH = startH - dy;
        newY = startElY + dy;
      }

      if (newW < MIN_SIZE) {
        if (corner.includes("w")) newX -= (MIN_SIZE - newW);
        newW = MIN_SIZE;
      }
      if (newH < MIN_SIZE) {
        if (corner.includes("n")) newY -= (MIN_SIZE - newH);
        newH = MIN_SIZE;
      }

      if (preserveAspect && ["se", "sw", "ne", "nw"].includes(corner)) {
        if (newW / newH > aspectRatio) {
          // Adjust width to match height's constraint
          const adjustedW = newH * aspectRatio;
          if (corner.includes("w")) newX += (newW - adjustedW);
          newW = adjustedW;
        } else {
          // Adjust height to match width's constraint
          const adjustedH = newW / aspectRatio;
          if (corner.includes("n")) newY += (newH - adjustedH);
          newH = adjustedH;
        }
      }

      onUpdate(id, { x: newX, y: newY, w: newW, h: newH });
    };

    const onUp = (upEv: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
      target.releasePointerCapture(upEv.pointerId);
      target.removeEventListener("pointermove", onMove as EventListener);
      target.removeEventListener("pointerup", onUp as EventListener);
    };

    target.addEventListener("pointermove", onMove as EventListener);
    target.addEventListener("pointerup", onUp as EventListener);
  };

  const handles: { position: HandlePosition; cursor: string; style: React.CSSProperties }[] = [
    { position: "tl", cursor: "nwse-resize", style: { top: -6, left: -6 } },
    { position: "tr", cursor: "nesw-resize", style: { top: -6, right: -6 } },
    { position: "bl", cursor: "nesw-resize", style: { bottom: -6, left: -6 } },
    { position: "br", cursor: "nwse-resize", style: { bottom: -6, right: -6 } },
    { position: "t", cursor: "ns-resize", style: { top: -6, left: "calc(50% - 6px)" } },
    { position: "b", cursor: "ns-resize", style: { bottom: -6, left: "calc(50% - 6px)" } },
    { position: "l", cursor: "ew-resize", style: { top: "calc(50% - 6px)", left: -6 } },
    { position: "r", cursor: "ew-resize", style: { top: "calc(50% - 6px)", right: -6 } },
  ];

  return (
    <div
      data-el-id={id}
      className="absolute group"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        cursor: "grab",
      }}
    >
      <div
        className="w-full h-full relative"
        style={{
          boxShadow: selected ? "0 0 0 2px #3742FA" : "none",
          borderRadius: "4px",
        }}
      >
        <img
          src={url}
          alt="Board element"
          draggable={false}
          className="w-full h-full object-fill pointer-events-none rounded-[4px]"
        />
      </div>

      {selected &&
        handles.map((hnd) => (
          <div
            key={hnd.position}
            onPointerDown={(e) => handleResizePointerDown(e, hnd.position)}
            style={{
              position: "absolute",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#fff",
              border: "2px solid #3742FA",
              cursor: hnd.cursor,
              touchAction: "none",
              zIndex: 50,
              ...hnd.style,
            }}
          />
        ))}
    </div>
  );
});
