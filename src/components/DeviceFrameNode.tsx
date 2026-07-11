import React from "react";
import type { DeviceFrameEl } from "../types";

interface DeviceFrameNodeProps {
  el: DeviceFrameEl;
  selected: boolean;
  onResize: (id: string, partial: Partial<DeviceFrameEl>) => void;
}

const MIN_W = 100;
const MIN_H = 100;

export default function DeviceFrameNode({ el, selected, onResize }: DeviceFrameNodeProps) {
  const { id, x, y, w, h, kind, color } = el;

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = w;
    const startH = h;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== e.pointerId) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      onResize(id, { w: Math.max(MIN_W, startW + dx), h: Math.max(MIN_H, startH + dy) });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== e.pointerId) return;
      try { target.releasePointerCapture(e.pointerId); } catch (err) {}
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div
      data-el-id={id}
      className="absolute flex items-center justify-center bg-transparent"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        cursor: "grab",
        outline: selected ? "2px solid #3742FA" : "2px dashed transparent",
        outlineOffset: 6,
        borderRadius: kind === "phone" ? 24 : 8,
      }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        {kind === "browser" ? (
          <g stroke={color} strokeWidth="2" fill="transparent">
            {/* Main Window */}
            <rect x="0" y="0" width={w} height={h} rx="8" ry="8" />
            {/* Top Bar Line */}
            <line x1="0" y1="40" x2={w} y2="40" />
            {/* 3 Dots */}
            <circle cx="20" cy="20" r="4" />
            <circle cx="36" cy="20" r="4" />
            <circle cx="52" cy="20" r="4" />
            {/* Arrow Left */}
            <line x1="75" y1="20" x2="85" y2="15" />
            <line x1="75" y1="20" x2="85" y2="25" />
            <line x1="75" y1="20" x2="90" y2="20" />
            {/* Arrow Right */}
            <line x1="105" y1="20" x2="95" y2="15" />
            <line x1="105" y1="20" x2="95" y2="25" />
            <line x1="105" y1="20" x2="90" y2="20" />
            {/* URL Bar */}
            <rect x="120" y="10" width={w - 140} height="20" rx="10" ry="10" />
          </g>
        ) : (
          <g stroke={color} strokeWidth="2" fill="transparent">
            {/* Phone Body */}
            <rect x="0" y="0" width={w} height={h} rx="24" ry="24" />
            {/* Top Notch/Speaker */}
            <rect x={w / 2 - 30} y="10" width="60" height="6" rx="3" ry="3" />
            {/* Top camera dot */}
            <circle cx={w / 2 - 45} cy="13" r="3" />
            {/* Bottom Home Line */}
            <line x1={w / 2 - 40} y1={h - 15} x2={w / 2 + 40} y2={h - 15} />
          </g>
        )}
      </svg>

      {selected && (
        <div
          onPointerDown={handleResizePointerDown}
          style={{
            position: "absolute",
            right: -7,
            bottom: -7,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            border: "2px solid #3742FA",
            cursor: "nwse-resize",
            touchAction: "none",
          }}
        />
      )}
    </div>
  );
}
