import React from "react";
import type { ShapeEl } from "../types";
import { shapePathD } from "../utils";
import ConnectionNodes from "./ConnectionNodes";

interface ShapeNodeProps {
  el: ShapeEl;
  selected: boolean;
  onStartConnect?: (e: React.PointerEvent, id: string) => void;
}

function ShapeNode({ el, selected, onStartConnect }: ShapeNodeProps) {
  const { w, h, color, kind } = el;
  const sel = selected ? "#3742FA" : "transparent";
  return (
    <div data-el-id={el.id} className="absolute group" style={{ left: el.x, top: el.y, width: w, height: h, cursor: "grab" }}>
      <ConnectionNodes id={el.id} w={w} h={h} selected={selected} onStartConnect={onStartConnect} />
      <svg width={w} height={h} overflow="visible" className="absolute top-0 left-0 pointer-events-none">
        {selected && <rect x="-5" y="-5" width={w + 10} height={h + 10} rx="4" fill="none" stroke={sel} strokeWidth="2" strokeDasharray="5 3" />}
        {kind === "rect" && (
          <rect x="1.25" y="1.25" width={w - 2.5} height={h - 2.5} rx="6"
            fill={color + "28"} stroke={color} strokeWidth="2.5" />
        )}
        {kind === "ellipse" && (
          <ellipse cx={w / 2} cy={h / 2} rx={(w - 2.5) / 2} ry={(h - 2.5) / 2}
            fill={color + "28"} stroke={color} strokeWidth="2.5" />
        )}
        {kind !== "rect" && kind !== "ellipse" && (
          <path d={shapePathD(kind, w, h)}
            fill={color + "28"} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        )}
      </svg>
      {el.text && (
        <div className="absolute inset-0 flex items-center justify-center p-3 text-center pointer-events-none" style={{ color: color, fontSize: Math.max(12, h / 6), fontWeight: 600 }}>
          <span className="truncate whitespace-pre-wrap leading-tight">{el.text}</span>
        </div>
      )}
    </div>
  );
}

export default ShapeNode;
