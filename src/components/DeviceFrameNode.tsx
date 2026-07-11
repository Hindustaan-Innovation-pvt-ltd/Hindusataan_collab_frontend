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
          <g stroke={color} strokeWidth="2" fill="transparent" strokeLinecap="round" strokeLinejoin="round">
            {/* Main Window */}
            <rect x="0" y="0" width={w} height={h} rx="8" ry="8" />
            {/* Top Bar Line */}
            <line x1="0" y1="40" x2={w} y2="40" />
            {/* Arrow Left */}
            <path d="M 20 20 L 30 20 M 20 20 L 25 15 M 20 20 L 25 25" />
            {/* Arrow Right */}
            <path d="M 40 20 L 50 20 M 50 20 L 45 15 M 50 20 L 45 25" />
            {/* URL Bar Centered */}
            <rect x={w / 2 - Math.min(200, w / 4)} y="12" width={Math.min(400, w / 2)} height="16" rx="8" ry="8" />
          </g>
        ) : kind === "phone" ? (
          <g stroke={color} strokeWidth="2" fill="transparent" strokeLinecap="round" strokeLinejoin="round">
            {/* Phone Body */}
            <rect x="0" y="0" width={w} height={h} rx="24" ry="24" />
            {/* Top Speaker Pill */}
            <rect x={w / 2 - 30} y="14" width="60" height="8" rx="4" ry="4" />
            {/* Bottom Home Line */}
            <line x1={w / 2 - 40} y1={h - 15} x2={w / 2 + 40} y2={h - 15} />
          </g>
        ) : kind === "tablet" ? (
          <g stroke={color} strokeWidth="2" fill="transparent" strokeLinecap="round" strokeLinejoin="round">
            {/* Tablet Body */}
            <rect x="0" y="0" width={w} height={h} rx="16" ry="16" />
            {/* Top camera dot */}
            <circle cx={w / 2} cy="16" r="3" />
            {/* Bottom Home Line */}
            <line x1={w / 2 - 50} y1={h - 15} x2={w / 2 + 50} y2={h - 15} />
          </g>
        ) : kind === "desktop" ? (
          <g stroke={color} strokeWidth="2" fill="transparent" strokeLinecap="round" strokeLinejoin="round">
            {/* Monitor Screen */}
            <rect x="0" y="0" width={w} height={h - 40} rx="8" ry="8" />
            {/* Stand Stem */}
            <rect x={w / 2 - 20} y={h - 40} width="40" height="30" />
            {/* Stand Base */}
            <path d={`M ${w / 2 - 60} ${h - 10} L ${w / 2 + 60} ${h - 10} Q ${w / 2 + 65} ${h - 10} ${w / 2 + 65} ${h} L ${w / 2 - 65} ${h} Q ${w / 2 - 65} ${h - 10} ${w / 2 - 60} ${h - 10} Z`} />
          </g>
        ) : kind === "laptop" ? (
          <g stroke={color} strokeWidth="2" fill="transparent" strokeLinecap="round" strokeLinejoin="round">
            {/* Laptop Screen */}
            <rect x="20" y="0" width={w - 40} height={h - 20} rx="8" ry="8" />
            {/* Screen Inner Bezel */}
            <rect x="28" y="8" width={w - 56} height={h - 44} />
            {/* Camera dot */}
            <circle cx={w / 2} cy="4" r="1.5" />
            {/* Keyboard Base */}
            <path d={`M 10 ${h - 20} L ${w - 10} ${h - 20} L ${w} ${h} L 0 ${h} Z`} />
            {/* Trackpad */}
            <rect x={w / 2 - 30} y={h - 14} width="60" height="10" rx="2" ry="2" />
          </g>
        ) : null}
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
