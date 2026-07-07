

import React, { useRef, useEffect } from "react";
import type { ShapeEl, ShapeKind } from "../types";
import { shapePathD } from "../utils/util";
import ConnectionNodes from "./ConnectionNodes";

interface ShapeNodeProps {
  el: ShapeEl;
  selected: boolean;
  editing: boolean;
  onStartConnect?: (e: React.PointerEvent, id: string) => void;
  onResize: (id: string, w: number, h: number) => void;
  onDblClick: (id: string) => void;
  onBlur: (id: string, text: string) => void;
}

const MIN_SIZE = 24;

function ShapeNode({
  el,
  selected,
  editing,
  onStartConnect,
  onResize,
  onDblClick,
  onBlur,
}: ShapeNodeProps) {
  const { w, h, color, kind } = el;
  const sel = selected ? "#3742FA" : "transparent";
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      const raf = requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [editing]);

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const target = e.target as HTMLDivElement;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = w;
    const startH = h;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const newW = Math.max(MIN_SIZE, startW + dx);
      const newH = Math.max(MIN_SIZE, startH + dy);
      onResize(el.id, newW, newH);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div
      data-el-id={el.id}
      className="absolute group"
      style={{
        left: el.x,
        top: el.y,
        width: w,
        height: h,
        cursor: editing ? "text" : "grab",
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onDblClick(el.id);
      }}
    >
      <ConnectionNodes
        id={el.id}
        w={w}
        h={h}
        selected={selected}
        onStartConnect={onStartConnect}
      />

      <svg
        width={w}
        height={h}
        overflow="visible"
        className="absolute top-0 left-0 pointer-events-none"
      >
        {selected && (
          <rect
            x="-5"
            y="-5"
            width={w + 10}
            height={h + 10}
            rx="4"
            fill="none"
            stroke={sel}
            strokeWidth="2"
            strokeDasharray="5 3"
          />
        )}

        {kind === "rect" && (
          <rect
            x="1.25"
            y="1.25"
            width={w - 2.5}
            height={h - 2.5}
            rx="6"
            fill={color + "28"}
            stroke={color}
            strokeWidth="2.5"
          />
        )}

        {kind === "ellipse" && (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={(w - 2.5) / 2}
            ry={(h - 2.5) / 2}
            fill={color + "28"}
            stroke={color}
            strokeWidth="2.5"
          />
        )}

        {kind !== "rect" && kind !== "ellipse" && (
          <path
            d={shapePathD(kind as ShapeKind, w, h)}
            fill={color + "28"}
            stroke={color}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {selected && !editing && (
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

      {editing ? (
        <textarea
          ref={textareaRef}
          defaultValue={el.text ?? ""}
          className="absolute bg-transparent resize-none outline-none text-center p-3"
          style={{
            left: 0,
            top: 0,
            width: w,
            height: h,
            color,
            fontFamily: "inherit",
            fontWeight: 600,
            lineHeight: 1.4,
            fontSize: Math.max(12, h / 6),
          }}
          onBlur={(e) => onBlur(el.id, e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        el.text && (
          <div
            className="absolute inset-0 flex items-center justify-center font-semibold text-center whitespace-pre-wrap pointer-events-none p-3"
            style={{
              color,
              lineHeight: 1.4,
              fontSize: Math.max(12, h / 6),
            }}
          >
            {el.text}
          </div>
        )
      )}
    </div>
  );
}

export default ShapeNode;