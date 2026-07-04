import { useState, useRef, useEffect, useCallback } from "react";
import type { JSX } from "react";
import {
  MousePointer2, Hand, Type, Square, Circle, Pen, ArrowUpRight,
  Trash2, Minus, Plus,
  Sparkles, X, Send, Bot, User, ChevronDown, StickyNote as StickyNoteIcon, Disc3, Palette, Eraser, Table, Calendar, Highlighter, Brush, Pencil,
  Music, Play, Pause, SkipForward, SkipBack, FileMusic, Volume2,
  Link, Lock, Folder, ChevronRight, MoreHorizontal, Info, Globe, Users, Check, MessageSquare
} from "lucide-react";


import { toPng } from "html-to-image";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tool = "select" | "hand" | "sticky" | "text" | "shape" | "pen" | "eraser" | "arrow" | "table" | "comment";
type ShapeKind = "rect" | "ellipse" | "diamond" | "triangle" | "hexagon" | "star" | "parallelogram" | "arrow_right" | "document" | "cross" | "pentagon" | "octagon";

interface Pt { x: number; y: number }
type Base = { id: string; x: number; y: number; locked?: boolean };

type StickyEl = Base & { type: "sticky"; w: number; h: number; text: string; color: string };
type TextEl = Base & { type: "text"; text: string; fontSize: number; color: string };
type ShapeEl = Base & { type: "shape"; kind: ShapeKind; w: number; h: number; color: string };
type PenType = "pen" | "marker" | "highlighter";
type PenThickness = "thin" | "thick";
type PathEl = Base & { type: "path"; pts: Pt[]; color: string; sw: number; penType?: PenType };
type ConnectionEl = Base & { type: "connection"; from: string; to: string; color: string };
type FreeArrowEl = Base & { type: "free_arrow"; dx: number; dy: number; color: string };
type TableEl = Base & { type: "table"; rows: number; cols: number; cellW: number; cellH: number; data: Record<string, string>; color: string };
type El = StickyEl | TextEl | ShapeEl | PathEl | ConnectionEl | TableEl | FreeArrowEl;

interface Cam { x: number; y: number; z: number }

interface Board {
  id: string;
  name: string;
  bg?: "white" | "black" | "green";
  els: El[];
  cam: Cam;
  updatedAt: number;
}

interface Peer {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
}

interface Comment {
  id: string;
  boardId: string;
  x: number;
  y: number;
  text: string;
  author: string;
  createdAt: number;
  color: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STICKY_COLORS = ["#FFE566", "#FF9EAF", "#7BC8F6", "#B5EAD7", "#FFBF69", "#D4A1FF"];
const SHAPE_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#F7C59F", "#C9B1FF"];
const PEN_COLORS = ["#1C1B1F", "#000000", "#FFFFFF", "#FF4757", "#2ED573", "#1E90FF", "#FFE566", "#FF6B9D"];

const TOOLS: { id: Tool; label: string; key: string; icon: JSX.Element }[] = [
  { id: "select", label: "Select", key: "V", icon: <MousePointer2 size={18} /> },
  { id: "hand", label: "Hand", key: "H", icon: <Hand size={18} /> },
  { id: "sticky", label: "Sticky", key: "S", icon: <StickyNoteIcon size={18} /> },
  { id: "text", label: "Text", key: "T", icon: <Type size={18} /> },
  { id: "shape", label: "Shape", key: "R", icon: <Square size={18} /> },
  { id: "pen", label: "Pen", key: "P", icon: <Pen size={18} /> },
  { id: "eraser", label: "Eraser", key: "E", icon: <Eraser size={18} /> },
  { id: "arrow", label: "Arrow", key: "A", icon: <ArrowUpRight size={18} /> },
  { id: "table", label: "Table", key: "L", icon: <Table size={18} /> },
  { id: "comment", label: "Comment", key: "C", icon: <MessageSquare size={18} /> },
];

const SHAPE_KINDS: { kind: ShapeKind; label: string; icon: JSX.Element }[] = [
  { kind: "rect", label: "Rectangle", icon: <Square size={15} /> },
  { kind: "ellipse", label: "Ellipse", icon: <Circle size={15} /> },
  {
    kind: "diamond", label: "Diamond",
    icon: <svg width="15" height="15" viewBox="0 0 15 15"><path d="M7.5 1 L14 7.5 L7.5 14 L1 7.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  },
  {
    kind: "triangle", label: "Triangle",
    icon: <svg width="15" height="15" viewBox="0 0 15 15"><path d="M7.5 1.5 L13.5 13.5 L1.5 13.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  },
  {
    kind: "hexagon", label: "Hexagon",
    icon: <svg width="15" height="15" viewBox="0 0 15 15"><path d="M7.5 1 L13.2 4.25 L13.2 10.75 L7.5 14 L1.8 10.75 L1.8 4.25 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  },
  {
    kind: "star", label: "Star",
    icon: <svg width="15" height="15" viewBox="0 0 15 15"><path d="M7.5 1.5 L9 6 L14 6 L10 9 L11.5 13.5 L7.5 11 L3.5 13.5 L5 9 L1 6 L6 6 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  },
  {
    kind: "parallelogram", label: "Parallelogram",
    icon: <svg width="15" height="15" viewBox="0 0 15 15"><path d="M4.5 2.5 L14 2.5 L10.5 12.5 L1 12.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  },
  {
    kind: "arrow_right", label: "Block Arrow",
    icon: <svg width="15" height="15" viewBox="0 0 15 15"><path d="M1.5 5 L8 5 L8 2 L14 7.5 L8 13 L8 10 L1.5 10 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  },
  {
    kind: "document", label: "Document",
    icon: <svg width="15" height="15" viewBox="0 0 15 15"><path d="M2.5 1 L9.5 1 L13.5 5 L13.5 14 L2.5 14 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M9.5 1 L9.5 5 L13.5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  },
  {
    kind: "cross", label: "Cross",
    icon: <svg width="15" height="15" viewBox="0 0 15 15"><path d="M5.5 1.5 L9.5 1.5 L9.5 5.5 L13.5 5.5 L13.5 9.5 L9.5 9.5 L9.5 13.5 L5.5 13.5 L5.5 9.5 L1.5 9.5 L1.5 5.5 L5.5 5.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  },
  {
    kind: "pentagon", label: "Pentagon",
    icon: <svg width="15" height="15" viewBox="0 0 15 15"><path d="M7.5 1 L14 5.5 L11.5 13.5 L3.5 13.5 L1 5.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  },
  {
    kind: "octagon", label: "Octagon",
    icon: <svg width="15" height="15" viewBox="0 0 15 15"><path d="M5 1.5 L10 1.5 L13.5 5 L13.5 10 L10 13.5 L5 13.5 L1.5 10 L1.5 5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  },
];

const uid = () => Math.random().toString(36).substring(2, 10);

// ── Helpers ───────────────────────────────────────────────────────────────────

function worldPt(cx: number, cy: number, rect: DOMRect, cam: Cam): Pt {
  return { x: (cx - rect.left - cam.x) / cam.z, y: (cy - rect.top - cam.y) / cam.z };
}

function pathD(pts: Pt[]): string {
  if (pts.length < 2) return "";
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function getElementBox(el: El): { cx: number; cy: number; w: number; h: number } | null {
  if (el.type === "sticky" || el.type === "shape") {
    return { cx: el.x + el.w / 2, cy: el.y + el.h / 2, w: el.w, h: el.h };
  }
  if (el.type === "text") {
    const w = 120;
    const h = el.fontSize * 1.5;
    return { cx: el.x + w / 2, cy: el.y + h / 2, w, h };
  }
  return null;
}

function getBoundaryPt(cx: number, cy: number, w: number, h: number, targetX: number, targetY: number): Pt {
  const dx = targetX - cx;
  const dy = targetY - cy;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x: cx, y: cy };
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx * h > absDy * w) {
    const scale = (w / 2) / absDx;
    return { x: cx + dx * scale, y: cy + dy * scale };
  } else {
    const scale = (h / 2) / absDy;
    return { x: cx + dx * scale, y: cy + dy * scale };
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

const ConnectionNodes = ({ id, w, h, selected, onStartConnect }: { id: string, w: number, h: number, selected?: boolean, onStartConnect?: (e: React.PointerEvent, id: string) => void }) => {
  if (!onStartConnect) return null;
  const nodeClass = `absolute w-3 h-3 bg-white border-[2px] border-[#3742FA] rounded-full transition-opacity cursor-crosshair z-10 pointer-events-auto hover:scale-125 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`;
  return (
    <>
      <div className={nodeClass} style={{ top: -6, left: w / 2 - 6 }} onPointerDown={(e) => onStartConnect(e, id)} />
      <div className={nodeClass} style={{ bottom: -6, left: w / 2 - 6 }} onPointerDown={(e) => onStartConnect(e, id)} />
      <div className={nodeClass} style={{ left: -6, top: h / 2 - 6 }} onPointerDown={(e) => onStartConnect(e, id)} />
      <div className={nodeClass} style={{ right: -6, top: h / 2 - 6 }} onPointerDown={(e) => onStartConnect(e, id)} />
    </>
  );
};

function StickyNote({
  el, selected, editing, zoom, onBlur, onDblClick, onStartConnect, onUpdate
}: {
  el: StickyEl; selected: boolean; editing: boolean; zoom: number;
  onBlur: (id: string, text: string) => void;
  onDblClick: (id: string) => void;
  onStartConnect?: (e: React.PointerEvent, id: string) => void;
  onUpdate: (id: string, partial: Partial<StickyEl>) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const onDragHandle = (e: React.PointerEvent, corner: 'nw' | 'ne' | 'sw' | 'se') => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = el.w;
    const startH = el.h;
    const startElX = el.x;
    const startElY = el.y;

    const onMove = (me: PointerEvent) => {
      const dX = (me.clientX - startX) / zoom;
      const dY = (me.clientY - startY) / zoom;

      let newW = startW;
      let newH = startH;
      let newX = startElX;
      let newY = startElY;

      if (corner === 'se') {
        newW = Math.max(100, startW + dX);
        newH = Math.max(100, startH + dY);
      } else if (corner === 'sw') {
        newW = Math.max(100, startW - dX);
        newH = Math.max(100, startH + dY);
        newX = startElX + (startW - newW);
      } else if (corner === 'ne') {
        newW = Math.max(100, startW + dX);
        newH = Math.max(100, startH - dY);
        newY = startElY + (startH - newH);
      } else if (corner === 'nw') {
        newW = Math.max(100, startW - dX);
        newH = Math.max(100, startH - dY);
        newX = startElX + (startW - newW);
        newY = startElY + (startH - newH);
      }

      onUpdate(el.id, { w: newW, h: newH, x: newX, y: newY });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      data-el-id={el.id}
      onDoubleClick={(e) => { e.stopPropagation(); onDblClick(el.id); }}
      className="absolute rounded-sm select-none group"
      style={{
        left: el.x, top: el.y, width: el.w, height: el.h,
        backgroundColor: el.color,
        boxShadow: selected
          ? `0 0 0 2.5px #3742FA, 5px 8px 20px rgba(0,0,0,0.18)`
          : `5px 7px 18px rgba(0,0,0,0.12)`,
        cursor: editing ? "default" : "grab",
      }}
    >
      <ConnectionNodes id={el.id} w={el.w} h={el.h} selected={selected} onStartConnect={onStartConnect} />
      {/* Header strip */}
      <div
        className="h-7 flex items-center px-2.5 gap-1"
        style={{ backgroundColor: "rgba(0,0,0,0.07)" }}
      >
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.25)" }} />
        ))}
      </div>

      {editing ? (
        <textarea
          ref={ref}
          defaultValue={el.text}
          className="absolute inset-x-0 bottom-0 bg-transparent resize-none p-2.5 text-sm leading-relaxed text-gray-800 outline-none w-full"
          style={{ top: "1.75rem", fontFamily: "inherit", fontWeight: 500 }}
          onBlur={(e) => onBlur(el.id, e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="px-2.5 pb-2.5 pt-1.5 text-sm leading-relaxed text-gray-800 font-medium whitespace-pre-wrap break-words overflow-hidden"
          style={{ height: "calc(100% - 1.75rem)" }}
        >
          {el.text || (
            <span className="text-gray-500/60 text-xs italic">Double-click to edit…</span>
          )}
        </div>
      )}

      {selected && (
        <>
          <div className="absolute top-0 left-0 w-3.5 h-3.5 bg-white border-[2.5px] border-[#3742FA] rounded-sm -translate-x-1.5 -translate-y-1.5 cursor-nwse-resize z-20 hover:scale-125 transition-transform" onPointerDown={(e) => onDragHandle(e, 'nw')} />
          <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-white border-[2.5px] border-[#3742FA] rounded-sm translate-x-1.5 -translate-y-1.5 cursor-nesw-resize z-20 hover:scale-125 transition-transform" onPointerDown={(e) => onDragHandle(e, 'ne')} />
          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-white border-[2.5px] border-[#3742FA] rounded-sm -translate-x-1.5 translate-y-1.5 cursor-nesw-resize z-20 hover:scale-125 transition-transform" onPointerDown={(e) => onDragHandle(e, 'sw')} />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-white border-[2.5px] border-[#3742FA] rounded-sm translate-x-1.5 translate-y-1.5 cursor-nwse-resize z-20 hover:scale-125 transition-transform" onPointerDown={(e) => onDragHandle(e, 'se')} />
        </>
      )}
    </div>
  );
}

function TextNode({
  el, selected, editing, onBlur, onDblClick,
}: {
  el: TextEl; selected: boolean; editing: boolean;
  onBlur: (id: string, text: string) => void;
  onDblClick: (id: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (editing) { ref.current?.focus(); ref.current?.select(); }
  }, [editing]);

  return (
    <div
      data-el-id={el.id}
      onDoubleClick={(e) => { e.stopPropagation(); onDblClick(el.id); }}
      className="absolute"
      style={{
        left: el.x, top: el.y,
        outline: selected ? "2.5px solid #3742FA" : "2px dashed transparent",
        outlineOffset: 6,
        cursor: editing ? "text" : "grab",
        borderRadius: 4,
      }}
    >
      {editing ? (
        <textarea
          ref={ref}
          defaultValue={el.text}
          className="bg-transparent resize-none outline-none"
          style={{
            fontSize: el.fontSize, color: el.color,
            fontFamily: "inherit", fontWeight: 600,
            minWidth: 80, minHeight: el.fontSize * 1.6,
            lineHeight: 1.4,
          }}
          onBlur={(e) => onBlur(el.id, e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="font-semibold whitespace-pre"
          style={{ fontSize: el.fontSize, color: el.color, lineHeight: 1.4 }}
        >
          {el.text}
        </div>
      )}
    </div>
  );
}

function shapePathD(kind: ShapeKind, w: number, h: number): string {
  const s = 2; // inset for stroke
  switch (kind) {
    case "diamond":
      return `M${w / 2},${s} L${w - s},${h / 2} L${w / 2},${h - s} L${s},${h / 2} Z`;
    case "triangle":
      return `M${w / 2},${s} L${w - s},${h - s} L${s},${h - s} Z`;
    case "hexagon": {
      const cx = w / 2, cy = h / 2, rx = w / 2 - s, ry = h / 2 - s;
      return Array.from({ length: 6 }, (_, i) => {
        const a = (i * 60 - 30) * Math.PI / 180;
        return `${i === 0 ? "M" : "L"}${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`;
      }).join(" ") + " Z";
    }
    case "star": {
      const cx = w / 2, cy = h / 2, ro = Math.min(w, h) / 2 - s, ri = ro * 0.42;
      return Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? ro : ri, a = (i * 36 - 90) * Math.PI / 180;
        return `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
      }).join(" ") + " Z";
    }
    case "parallelogram":
      return `M${s + w * 0.2},${s} L${w - s},${s} L${w - s - w * 0.2},${h - s} L${s},${h - s} Z`;
    case "arrow_right":
      return `M${s},${h * 0.35} L${w * 0.55},${h * 0.35} L${w * 0.55},${s} L${w - s},${h / 2} L${w * 0.55},${h - s} L${w * 0.55},${h * 0.65} L${s},${h * 0.65} Z`;
    case "document":
      return `M${s},${s} L${w * 0.65},${s} L${w - s},${h * 0.35} L${w - s},${h - s} L${s},${h - s} Z M${w * 0.65},${s} L${w * 0.65},${h * 0.35} L${w - s},${h * 0.35}`;
    case "cross":
      return `M${w * 0.35},${s} L${w * 0.65},${s} L${w * 0.65},${h * 0.35} L${w - s},${h * 0.35} L${w - s},${h * 0.65} L${w * 0.65},${h * 0.65} L${w * 0.65},${h - s} L${w * 0.35},${h - s} L${w * 0.35},${h * 0.65} L${s},${h * 0.65} L${s},${h * 0.35} L${w * 0.35},${h * 0.35} Z`;
    case "pentagon": {
      const cx = w / 2, cy = h / 2, rx = w / 2 - s, ry = h / 2 - s;
      return Array.from({ length: 5 }, (_, i) => {
        const a = (i * 72 - 90) * Math.PI / 180;
        return `${i === 0 ? "M" : "L"}${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`;
      }).join(" ") + " Z";
    }
    case "octagon": {
      const cx = w / 2, cy = h / 2, rx = w / 2 - s, ry = h / 2 - s;
      return Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 - 90 + 22.5) * Math.PI / 180;
        return `${i === 0 ? "M" : "L"}${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`;
      }).join(" ") + " Z";
    }
    default: return "";
  }
}

function ShapeNode({ el, selected, onStartConnect }: { el: ShapeEl; selected: boolean; onStartConnect?: (e: React.PointerEvent, id: string) => void }) {
  const { w, h, color, kind } = el;
  const sel = selected ? "#3742FA" : "transparent";
  return (
    <div data-el-id={el.id} className="absolute group" style={{ left: el.x, top: el.y, width: w, height: h, cursor: "grab" }}>
      <ConnectionNodes id={el.id} w={w} h={h} selected={selected} onStartConnect={onStartConnect} />
      <svg width={w} height={h} overflow="visible">
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
    </div>
  );
}

function CellEditor({ cellId, cellText, onBlur }: { cellId: string, cellText: string, onBlur: (id: string, text: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.selectionStart = ref.current.value.length;
    }
  }, []);

  return (
    <textarea
      ref={ref}
      defaultValue={cellText}
      onBlur={(e) => onBlur(cellId, e.target.value)}
      onPointerDown={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none text-sm text-center p-2 font-medium text-gray-900"
      style={{ pointerEvents: "auto" }}
    />
  );
}

function TableNode({
  el, selected, editingId, zoom, onBlur, onDblClick, onUpdate
}: {
  el: TableEl; selected: boolean; editingId: string | null; zoom: number;
  onBlur: (id: string, text: string) => void;
  onDblClick: (id: string) => void;
  onUpdate: (id: string, partial: Partial<TableEl>) => void;
}) {
  const { x, y, rows, cols, cellW, cellH, data } = el;
  const w = cols * cellW;
  const h = rows * cellH;

  const onDragHandle = (e: React.PointerEvent, isRight: boolean) => {
    e.stopPropagation();
    const startPt = isRight ? e.clientX : e.clientY;
    const startCols = cols;
    const startRows = rows;

    const onMove = (me: PointerEvent) => {
      if (isRight) {
        const dX = (me.clientX - startPt) / zoom;
        const newCols = Math.max(1, startCols + Math.round(dX / cellW));
        if (newCols !== cols) onUpdate(el.id, { cols: newCols });
      } else {
        const dY = (me.clientY - startPt) / zoom;
        const newRows = Math.max(1, startRows + Math.round(dY / cellH));
        if (newRows !== rows) onUpdate(el.id, { rows: newRows });
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div data-el-id={el.id} className="absolute group" style={{ left: x, top: y, width: w, height: h, cursor: "grab" }}>
      <div className="absolute inset-0 bg-white border-2 border-gray-300 rounded overflow-hidden flex flex-col shadow-sm"
        style={{ boxShadow: selected ? "0 0 0 2px #3742FA" : undefined }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex flex-1 w-full border-b border-gray-200 last:border-b-0">
            {Array.from({ length: cols }).map((_, c) => {
              const cellId = `${el.id}-${r}-${c}`;
              const isEditing = editingId === cellId;
              const cellText = data[`${r},${c}`] || "";

              return (
                <div key={c}
                  className="flex-1 border-r border-gray-200 last:border-r-0 relative flex items-center justify-center p-2 hover:bg-gray-50"
                  onDoubleClick={(e) => { e.stopPropagation(); onDblClick(cellId); }}
                  style={{ width: cellW, height: cellH }}
                >
                  {isEditing ? (
                    <CellEditor cellId={cellId} cellText={cellText} onBlur={onBlur} />
                  ) : (
                    <div className="w-full text-sm text-center font-medium overflow-hidden whitespace-pre-wrap text-gray-900">
                      {cellText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Right Drag Handle */}
      {selected && (
        <div
          className="absolute right-0 top-0 bottom-0 w-4 translate-x-4 cursor-ew-resize flex items-center justify-center z-10"
          onPointerDown={(e) => onDragHandle(e, true)}
        >
          <div className="w-1.5 h-8 bg-[#3742FA] rounded-full shadow-md hover:scale-125 transition-transform" />
        </div>
      )}

      {/* Bottom Drag Handle */}
      {selected && (
        <div
          className="absolute bottom-0 left-0 right-0 h-4 translate-y-4 cursor-ns-resize flex items-center justify-center z-10"
          onPointerDown={(e) => onDragHandle(e, false)}
        >
          <div className="h-1.5 w-8 bg-[#3742FA] rounded-full shadow-md hover:scale-125 transition-transform" />
        </div>
      )}
    </div>
  );
}

// ── AI Dialog ────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const AI_SUGGESTIONS = [
  "Add 3 sticky notes for brainstorming",
  "Summarize what's on my board",
  "Suggest a layout for my ideas",
  "What can I create with FigJam?",
];

const AI_RESPONSES: Record<string, string> = {
  default: "I'm your FigJam AI assistant! I can help you brainstorm, organize ideas, suggest layouts, and more. What would you like to work on today?",
  brainstorm: "Great idea! For brainstorming sessions, I recommend starting with a central topic sticky note, then branching out to 4–6 theme clusters. Use color coding: yellow for problems, blue for solutions, pink for open questions. Want me to walk you through a structured brainstorm?",
  layout: "For a clean FigJam layout, try a 3-column structure: **Ideas** on the left, **In Progress** in the center, and **Done** on the right. Use shapes as column headers and sticky notes for individual items. This works beautifully for project tracking or sprint planning.",
  summary: "Looking at your board, I can see a few sticky notes and shapes placed around the canvas. It looks like you're in early ideation mode — great start! Consider grouping related notes together with colored sections to build structure. Would you like tips on organizing your board?",
  figjam: "FigJam is a collaborative whiteboard tool. You can: \n• Add sticky notes (press S) \n• Draw freehand (press P) \n• Place shapes like rectangles and ellipses \n• Move and zoom the infinite canvas \n• Use the AI assistant (that's me!) to get creative help. What would you like to explore?",
};

function simulateResponse(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("brainstorm") || p.includes("sticky") || p.includes("note")) return AI_RESPONSES.brainstorm;
  if (p.includes("layout") || p.includes("organiz") || p.includes("structure")) return AI_RESPONSES.layout;
  if (p.includes("summar") || p.includes("board") || p.includes("what")) return AI_RESPONSES.summary;
  if (p.includes("figjam") || p.includes("can i") || p.includes("create") || p.includes("help")) return AI_RESPONSES.figjam;
  return `That's an interesting question about "${prompt}". In a collaborative whiteboard context, I'd suggest starting by mapping out your key ideas visually — one concept per sticky note. Group related themes together, then draw connections between them. Would you like me to suggest a specific framework for this?`;
}

let _msgId = 0;
const msgId = () => `m${++_msgId}`;

function AIDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: msgId(),
      role: "assistant",
      content: AI_RESPONSES.default,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    setInput("");

    const userMsg: ChatMessage = { id: msgId(), role: "user", content: text };
    const assistantId = msgId();
    const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "", streaming: true };

    setMessages(p => [...p, userMsg, assistantMsg]);
    setIsTyping(true);

    // Simulate streaming token by token
    const response = simulateResponse(text);
    let i = 0;
    const tick = () => {
      if (i >= response.length) {
        setMessages(p => p.map(m => m.id === assistantId ? { ...m, streaming: false } : m));
        setIsTyping(false);
        return;
      }
      const chunk = response.slice(i, i + Math.floor(Math.random() * 4) + 2);
      i += chunk.length;
      setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m));
      setTimeout(tick, 18 + Math.random() * 20);
    };
    setTimeout(tick, 400);
  }, [isTyping]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-end pointer-events-none"
      style={{ padding: "0 24px 90px 0" }}
    >
      <div
        className="pointer-events-auto flex flex-col rounded-2xl overflow-hidden"
        style={{
          width: 380,
          height: 520,
          background: "#ffffff",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.07)",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] shrink-0"
          style={{ background: "linear-gradient(135deg, #3742FA 0%, #7B61FF 100%)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm leading-tight">AI Assistant</div>
              <div className="text-white/60 text-[11px] font-medium">Powered by Claude</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
          style={{ scrollbarWidth: "none" }}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${msg.role === "assistant"
                ? "bg-gradient-to-br from-[#3742FA] to-[#7B61FF]"
                : "bg-gray-200"
                }`}>
                {msg.role === "assistant"
                  ? <Bot size={12} className="text-white" />
                  : <User size={12} className="text-gray-600" />
                }
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                  ? "bg-[#3742FA] text-white rounded-tr-sm"
                  : "bg-gray-100 text-gray-800 rounded-tl-sm"
                  }`}
              >
                <span className="whitespace-pre-wrap">{msg.content}</span>
                {msg.streaming && (
                  <span className="inline-block w-1.5 h-4 bg-current opacity-70 ml-0.5 align-middle animate-pulse rounded-sm" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && !isTyping && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
            {AI_SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-2.5 py-1.5 rounded-full border border-[#3742FA]/30 text-[#3742FA] hover:bg-[#3742FA]/8 transition-colors font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 shrink-0 border-t border-black/[0.06]">
          <div className="flex items-end gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask AI anything…"
              disabled={isTyping}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 leading-relaxed max-h-24"
              style={{ fontFamily: "inherit", scrollbarWidth: "none" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 mb-0.5"
              style={{
                background: input.trim() && !isTyping ? "#3742FA" : "#E5E7EB",
                color: input.trim() && !isTyping ? "#fff" : "#9CA3AF",
              }}
            >
              <Send size={13} />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-1.5">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function ColorPalette({ colors, active, onPick }: {
  colors: string[]; active: string; onPick: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-white rounded-full px-3 py-2 shadow-lg border border-black/[0.06]">
      {colors.map(c => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className="w-5 h-5 rounded-full transition-all hover:scale-110 active:scale-95"
          style={{
            backgroundColor: c,
            outline: active === c ? "2.5px solid #3742FA" : "2px solid rgba(0,0,0,0.12)",
            outlineOffset: active === c ? 2 : 0,
            transform: active === c ? "scale(1.15)" : undefined,
          }}
          title={c}
        />
      ))}
    </div>
  );
}

function Toolbar({
  tool, setTool, onZoom, zoomLevel,
  stickyColor, setStickyColor,
  shapeColor, setShapeColor, shapeKind, setShapeKind,
  penColor, setPenColor,
  penType, setPenType,
  penThickness, setPenThickness,
  toolMenuOpen, setToolMenuOpen,
  onDelete, hasSelection,
}: {
  tool: Tool; setTool: (t: Tool) => void;
  onZoom: (dir: number) => void; zoomLevel: number;
  stickyColor: string; setStickyColor: (c: string) => void;
  shapeColor: string; setShapeColor: (c: string) => void;
  shapeKind: ShapeKind; setShapeKind: (k: ShapeKind) => void;
  penColor: string; setPenColor: (c: string) => void;
  penType: PenType; setPenType: (t: PenType) => void;
  penThickness: PenThickness; setPenThickness: (t: PenThickness) => void;
  toolMenuOpen: boolean; setToolMenuOpen: (o: boolean) => void;
  onDelete: () => void; hasSelection: boolean;
}) {
  const palette =
    tool === "sticky" ? { colors: STICKY_COLORS, active: stickyColor, set: setStickyColor } :
      tool === "shape" ? { colors: SHAPE_COLORS, active: shapeColor, set: setShapeColor } :
        tool === "pen" ? { colors: PEN_COLORS, active: penColor, set: setPenColor } : null;

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-50">
      <div className="flex flex-col gap-2 items-center pointer-events-auto">
        {/* Pen picker */}
        {tool === "pen" && toolMenuOpen && (
          <div className="flex flex-col p-2.5 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 gap-2 mb-1">
            <div>
              <div className="text-[10px] font-bold text-gray-400 mb-2 px-1.5 uppercase tracking-wider">Style</div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { type: "pen", icon: <Pencil size={18} />, color: "text-blue-500", label: "Pen" },
                  { type: "marker", icon: <Brush size={18} />, color: "text-purple-500", label: "Marker" },
                  { type: "highlighter", icon: <Highlighter size={18} />, color: "text-yellow-500", label: "Highlighter" },
                ].map(t => (
                  <button
                    key={t.type}
                    title={t.label}
                    onClick={() => setPenType(t.type as any)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${penType === t.type
                      ? "bg-gray-100 shadow-inner scale-95"
                      : "hover:bg-gray-50"
                      } ${t.color}`}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 mb-2 px-1.5 uppercase tracking-wider">Thickness</div>
              <div className="flex gap-1.5">
                {[
                  { thick: "thin", label: "Thin" },
                  { thick: "thick", label: "Thick" },
                ].map(t => (
                  <button
                    key={t.thick}
                    onClick={() => setPenThickness(t.thick as any)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${penThickness === t.thick ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Shape kind picker (Dropdown style) */}
        {tool === "shape" && toolMenuOpen && (
          <div className="flex flex-col p-2.5 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 mb-2 px-1.5 uppercase tracking-wider">Shapes</div>
            <div className="grid grid-cols-3 gap-1.5">
              {SHAPE_KINDS.map(({ kind, label, icon }) => (
                <button
                  key={kind}
                  title={label}
                  onClick={() => setShapeKind(kind)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${shapeKind === kind
                    ? "bg-[#3742FA] text-white shadow-md scale-105"
                    : "text-[#4B5563] hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        )}

        {palette && toolMenuOpen && (
          <div>
            <ColorPalette colors={palette.colors} active={palette.active} onPick={palette.set} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 pointer-events-auto">
        {TOOLS.map(({ id, label, key, icon }) => (
          <button
            key={id}
            title={`${label} (${key})`}
            onClick={() => {
              if (id === tool) {
                setToolMenuOpen(!toolMenuOpen);
              } else {
                setTool(id as Tool);
                if (id === "pen" || id === "shape" || id === "sticky") {
                  setToolMenuOpen(true);
                } else {
                  setToolMenuOpen(false);
                }
              }
            }}
            className={`
              w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200
              ${tool === id
                ? "bg-[#3742FA] text-white shadow-md scale-[1.02]"
                : "text-[#4B5563] hover:bg-gray-100 hover:text-gray-900"}
            `}
          >
            {icon}
          </button>
        ))}

        <div className="w-px h-6 bg-gray-200 mx-2" />

        {hasSelection && (
          <>
            <button
              onClick={onDelete}
              title="Delete selected (Del)"
              className="w-10 h-10 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 size={18} />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
          </>
        )}

        <button
          onClick={() => onZoom(-1)}
          title="Zoom out"
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Minus size={16} />
        </button>
        <div
          className="px-2 text-xs font-medium text-[#4B5563] min-w-[48px] text-center cursor-pointer hover:text-gray-900"
          title="Reset zoom"
          onClick={() => {/* handled outside */ }}
        >
          {Math.round(zoomLevel * 100)}%
        </div>
        <button
          onClick={() => onZoom(1)}
          title="Zoom in"
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Plus size={16} />
        </button>

      </div>
    </div>
  );
}

// ── Top Bar ───────────────────────────────────────────────────────────────────

function TopBar({
  boards, currentBoardId, boardName, onChangeBoard, onNewBoard, onRenameBoard,
  boardBg, onChangeBg,
  simPeers, onToggleSimPeers
}: {
  boards: Board[]; currentBoardId: string; boardName: string;
  onChangeBoard: (id: string) => void;
  onNewBoard: () => void;
  onRenameBoard: (name: string) => void;
  boardBg: "white" | "black" | "green";
  onChangeBg: (bg: "white" | "black" | "green") => void;
  simPeers: boolean; onToggleSimPeers: () => void;
}) {
  const [seconds, setSeconds] = useState(3 * 60);
  const [running, setRunning] = useState(false);
  const [bgMenuOpen, setBgMenuOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [calDate, setCalDate] = useState(new Date());

  // Music Player State
  const [musicOpen, setMusicOpen] = useState(false);
  const [playlist, setPlaylist] = useState<File[]>([]);
  const [currentTrack, setCurrentTrack] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Share Dialog State
  const [shareOpen, setShareOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy link");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<{ email: string; role: "edit" | "view" }[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState("24:00:00");
  const [linkAccess, setLinkAccess] = useState<"invited" | "anyone">("invited");
  const [classroomShared, setClassroomShared] = useState(false);
  const [showMeetInfo, setShowMeetInfo] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);

  // Open session countdown timer
  useEffect(() => {
    if (!sessionActive) return;
    let totalSeconds = 24 * 60 * 60; // 24 hours
    const interval = setInterval(() => {
      totalSeconds--;
      if (totalSeconds <= 0) {
        setSessionActive(false);
        clearInterval(interval);
      } else {
        const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
        const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
        const secs = String(totalSeconds % 60).padStart(2, "0");
        setSessionTime(`${hrs}:${mins}:${secs}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive]);

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };
  const emails = inviteEmail.split(",").map(e => e.trim()).filter(Boolean);
  const isInviteEnabled = emails.length > 0 && emails.every(isValidEmail);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyStatus("Copied!");
    setTimeout(() => setCopyStatus("Copy link"), 2000);
  };

  const handleInvite = () => {
    if (!isInviteEnabled) return;
    const newUsers = emails.map(email => ({ email, role: "edit" as const }));
    setInvitedUsers(prev => {
      const existingEmails = prev.map(u => u.email);
      const filteredNew = newUsers.filter(nu => !existingEmails.includes(nu.email));
      return [...prev, ...filteredNew];
    });
    setInviteEmail("");
  };


  const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && playlist.length > 0) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack, playlist]);

  const handleNextTrack = () => {
    if (playlist.length > 0) setCurrentTrack(p => (p + 1) % playlist.length);
  };
  const handlePrevTrack = () => {
    if (playlist.length > 0) setCurrentTrack(p => (p - 1 + playlist.length) % playlist.length);
  };

  const currentAudioSrc = playlist.length > 0 && playlist[currentTrack] ? URL.createObjectURL(playlist[currentTrack]) : undefined;

  return (
    <div className="absolute top-4 left-4 right-4 z-50 flex items-start justify-between pointer-events-none">
      {/* LEFT: Board Selector & Name */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        {/* <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 shadow-lg border border-black/[0.06]">
          <select
            value={currentBoardId}
            onChange={(e) => {
              if (e.target.value === "new") onNewBoard();
              else onChangeBoard(e.target.value);
            }}
            className="text-sm font-semibold text-gray-800 bg-transparent outline-none cursor-pointer"
          >
            {boards.map(b => (
              <option key={b.id} value={b.id}>{b.name || "Untitled Board"}</option>
            ))}
            <option disabled>──────────</option>
            <option value="new">+ New Board</option>
          </select>
        </div> */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
          }}
        >
          <select
            value={currentBoardId}
            onChange={(e) => {
              if (e.target.value === "new") onNewBoard();
              else onChangeBoard(e.target.value);
            }}
            style={{
              border: "1px solid #D1D5DB",
              borderRadius: "12px", // More curved
              padding: "8px 16px",
              fontSize: "16px",
              fontWeight: "600",
              backgroundColor: "#fff",
              color: "#1F2937",
              cursor: "pointer",
              outline: "none",
              height: "42px",
              minWidth: "220px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name || "Untitled Board"}
              </option>
            ))}
            <option value="new">+ New Board</option>
          </select>

          <span
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#6B7280",
              fontSize: "12px",
            }}
          >
            ▼
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm border border-black/[0.06]">
          <input
            type="text"
            value={boardName}
            onChange={(e) => onRenameBoard(e.target.value)}
            className="text-xs bg-transparent outline-none w-32 font-medium text-gray-600 placeholder-gray-400"
            placeholder="Name your board"
          />
        </div>
      </div>

      {/* RIGHT: Top Bar tools */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1 bg-white rounded-2xl px-2 py-1.5 shadow-lg border border-black/[0.06]">
          {/* Avatar */}
          <button className="flex items-center gap-1 pl-1 pr-2 h-8 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-6 h-6 rounded-full bg-[#1abc9c] flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <ChevronDown size={13} className="text-gray-400" />
          </button>

          <div className="w-px h-5 bg-gray-200" />

          {/* Layout icon */}
          <button className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          <div className="w-px h-5 bg-gray-200" />

          {/* Background Color Popup */}
          <div className="relative">
            <button
              onClick={() => setBgMenuOpen(o => !o)}
              title="Board Background"
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${bgMenuOpen ? "bg-[#f2efff] text-[#7B61FF]" : "text-[#7B61FF] hover:bg-[#f2efff] hover:scale-105"}`}
            >
              <Palette size={18} />
            </button>
            {bgMenuOpen && (
              <div className="absolute top-10 right-0 bg-white rounded-xl shadow-xl border border-gray-100 p-2 flex gap-1.5 z-50">
                {(["white", "black", "green"] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => { onChangeBg(c); setBgMenuOpen(false); }}
                    className={`w-6 h-6 rounded-full border transition-all ${boardBg === c ? "border-[#3742FA] scale-125 shadow-sm" : "border-black/10 hover:scale-110"}`}
                    style={{ backgroundColor: c === "white" ? "#F5F5F5" : c === "black" ? "#1A1A1A" : "#1B4D3E" }}
                    title={`${c.charAt(0).toUpperCase() + c.slice(1)} board`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200" />

          {/* Timer */}
          <button
            onClick={() => setRunning(r => !r)}
            title={running ? "Pause timer" : "Start timer"}
            className="flex items-center gap-1.5 px-2 h-8 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Disc3 size={15} className="text-gray-500" />
            <span className="text-sm font-semibold font-mono text-gray-700 tabular-nums">
              {mm}:{ss}
            </span>
          </button>

          <div className="w-px h-5 bg-gray-200" />

          {/* Music */}
          <div className="relative">
            <button
              onClick={() => setMusicOpen(o => !o)}
              title="Music Player"
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${musicOpen || isPlaying ? "bg-indigo-50 text-indigo-500" : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-500"}`}
            >
              <Music size={15} />
            </button>
            {musicOpen && (
              <div className="absolute top-10 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-64 z-50 text-gray-800 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-gray-800">Local Music</h3>
                  <button onClick={() => fileInputRef.current?.click()} className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors" title="Add Music Files">
                    <FileMusic size={16} />
                  </button>
                  <input type="file" accept="audio/*" multiple className="hidden" ref={fileInputRef} onChange={(e) => {
                    if (e.target.files) {
                      setPlaylist(Array.from(e.target.files));
                      setCurrentTrack(0);
                      setIsPlaying(true);
                    }
                  }} />
                </div>

                {playlist.length > 0 ? (
                  <>
                    <div className="text-xs font-semibold text-gray-600 truncate mb-1">
                      {playlist[currentTrack].name}
                    </div>
                    <div className="text-[10px] text-gray-400 mb-4">
                      Track {currentTrack + 1} of {playlist.length}
                    </div>

                    <div className="flex items-center justify-center gap-3 mb-4">
                      <button onClick={handlePrevTrack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700">
                        <SkipBack size={16} fill="currentColor" />
                      </button>
                      <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-transform active:scale-95">
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                      </button>
                      <button onClick={handleNextTrack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700">
                        <SkipForward size={16} fill="currentColor" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Volume2 size={14} className="text-gray-400" />
                      <input
                        type="range" min="0" max="1" step="0.01" value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Music size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs text-gray-500">No music loaded</p>
                    <button onClick={() => fileInputRef.current?.click()} className="mt-3 text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                      Choose Files
                    </button>
                  </div>
                )}

                {/* Hidden Audio Element */}
                <audio
                  ref={audioRef}
                  src={currentAudioSrc}
                  onEnded={handleNextTrack}
                  onError={() => setIsPlaying(false)}
                />
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200" />

          {/* Calendar */}
          <div className="relative">
            <button
              onClick={() => {
                setCalOpen(o => !o);
                setCalDate(new Date());
              }}
              title="Calendar"
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${calOpen ? "bg-red-50 text-[#FF4757]" : "text-[#FF4757] hover:bg-red-50"}`}
            >
              <Calendar size={16} />
            </button>
            {calOpen && (
              <div className="absolute top-10 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-64 z-50 text-gray-800">
                <div className="bg-[#FF4757] text-white flex justify-between items-center px-4 py-3">
                  <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))} className="hover:bg-[#ff6b77] rounded-full w-6 h-6 flex items-center justify-center transition-colors font-bold">&lt;</button>
                  <div className="font-semibold text-sm">
                    {calDate.toLocaleString("default", { month: "long" })} {calDate.getFullYear()}
                  </div>
                  <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))} className="hover:bg-[#ff6b77] rounded-full w-6 h-6 flex items-center justify-center transition-colors font-bold">&gt;</button>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-2 uppercase">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => <div key={d} className={i === 0 || i === 6 ? "text-[#FF4757]" : ""}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const isToday = i + 1 === new Date().getDate() && calDate.getMonth() === new Date().getMonth() && calDate.getFullYear() === new Date().getFullYear();
                      return (
                        <div key={i + 1} className={`flex items-center justify-center h-7 rounded-full transition-colors ${isToday ? "bg-[#FF4757] text-white shadow-sm font-bold" : "hover:bg-[#fff0f1] cursor-pointer text-gray-700"}`}>
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Simulate Multiplayer button */}
        <button
          onClick={onToggleSimPeers}
          className={`flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-bold shadow-md transition-all ${simPeers ? "bg-[#3742FA] text-white hover:bg-[#2c35c9]" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
            }`}
        >
          {simPeers ? "Stop Cursors" : "Simulate Cursors"}
        </button>

        {/* Share button */}
        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#7B61FF] hover:bg-[#6B4FF0] text-white text-sm font-semibold shadow-md transition-colors"
        >
          Share
        </button>
      </div>

      {/* Share Dialog Overlay */}
      {shareOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 pointer-events-auto">
          <div className="flex flex-col gap-3 max-w-[500px] w-full animate-in fade-in zoom-in duration-200">

            {/* Card 1: Share this board */}
            <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-6 flex flex-col text-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900 text-lg">Share this board</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#7B61FF] hover:text-[#6B4FF0] transition-colors"
                  >
                    {copyStatus === "Copied!" ? (
                      <>
                        <Check size={15} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link size={15} />
                        <span>Copy link</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShareOpen(false)}
                    className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Email Input Invite */}
              <div className="flex items-center gap-2.5 mb-6">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Add comma separated emails to invite"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 focus:border-[#7B61FF] focus:ring-1 focus:ring-[#7B61FF] outline-none text-sm text-gray-800 placeholder-gray-400 transition-all"
                  />
                </div>
                <button
                  onClick={handleInvite}
                  disabled={!isInviteEnabled}
                  className={`h-10 px-5 rounded-xl text-sm font-bold transition-all ${isInviteEnabled
                    ? "bg-[#7B61FF] text-white hover:bg-[#6B4FF0] active:scale-95 cursor-pointer"
                    : "bg-[#E6E6E6] text-[#B3B3B3] cursor-not-allowed"
                    }`}
                >
                  Invite
                </button>
              </div>

              {/* Who has access */}
              <div className="flex flex-col">
                <h3 className="text-gray-500 font-semibold text-xs mb-3 tracking-wide">Who has access</h3>

                {/* Lock Row */}
                <div
                  onClick={() => setLinkAccess(p => p === "invited" ? "anyone" : "invited")}
                  className="flex items-center justify-between py-2.5 px-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-gray-100">
                      <Lock size={15} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-800">Only invited people</div>
                      <div className="text-xs text-gray-400">
                        {linkAccess === "invited" ? "Private board" : "Anyone with access can join"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {linkAccess === "invited" && (
                      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Active</span>
                    )}
                    <ChevronRight size={15} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Team Project Row */}
                <div className="flex items-center justify-between py-2.5 px-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-gray-100">
                      <Folder size={15} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-800">Anyone in Team project</div>
                      <div className="text-xs text-gray-400">Can view all project boards</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">1 person</span>
                    <ChevronRight size={15} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Owner Row */}
                <div className="flex items-center justify-between py-3 px-1.5 mt-1 border-t border-gray-50">
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      A
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-800">aries02 <span className="text-gray-400 font-normal">(you)</span></div>
                      <div className="text-xs text-gray-400">owner@figjam.clone</div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-400 pr-1">owner</span>
                </div>

                {/* Invited Users Rows */}
                {invitedUsers.map((user) => (
                  <div key={user.email} className="flex items-center justify-between py-2.5 px-1.5 border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left max-w-[200px] truncate">
                        <div className="text-sm font-semibold text-gray-800 truncate" title={user.email}>
                          {user.email.split('@')[0]}
                        </div>
                        <div className="text-xs text-gray-400 truncate" title={user.email}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "remove") {
                            setInvitedUsers(prev => prev.filter(u => u.email !== user.email));
                          } else {
                            setInvitedUsers(prev => prev.map(u => u.email === user.email ? { ...u, role: val as "edit" | "view" } : u));
                          }
                        }}
                        className="bg-transparent border-none text-xs font-medium text-gray-500 hover:text-gray-800 outline-none cursor-pointer pr-1"
                      >
                        <option value="edit">can edit</option>
                        <option value="view">can view</option>
                        <option value="remove">remove</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Classroom, Meet, Session */}
            <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-6 flex flex-col text-gray-800">

              {/* Classroom */}
              <div
                onClick={() => {
                  setClassroomShared(true);
                  setTimeout(() => setClassroomShared(false), 3000);
                }}
                className="flex items-center justify-between py-2.5 px-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                    <div className="w-5 h-4 bg-green-600 rounded-sm border border-yellow-400 flex items-center justify-center text-[8px] font-bold text-white leading-none">
                      🏫
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {classroomShared ? "Shared successfully!" : "Share to Google Classroom"}
                  </span>
                </div>
                <ChevronRight size={15} className={`text-gray-400 group-hover:translate-x-0.5 transition-transform ${classroomShared ? "text-green-500" : ""}`} />
              </div>

              {/* Meet */}
              <div className="relative">
                <div
                  onMouseEnter={() => setShowMeetInfo(true)}
                  onMouseLeave={() => setShowMeetInfo(false)}
                  className="flex items-center justify-between py-2.5 px-1.5 rounded-xl opacity-60 cursor-not-allowed transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                      <Globe size={16} />
                    </div>
                    <span className="text-sm font-semibold text-gray-400">Cast to a Google Meet device</span>
                  </div>
                  <div className="flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600">
                    <Info size={15} />
                  </div>
                </div>
                {showMeetInfo && (
                  <div className="absolute right-0 bottom-10 bg-gray-900 text-white text-xs rounded-lg p-2.5 w-60 shadow-xl z-[110] leading-normal font-normal">
                    Cast this board directly to a Google Meet device. No active devices found on your local network.
                  </div>
                )}
              </div>

              {/* Open Session */}
              <div className="flex items-center justify-between py-3 px-1.5 border-t border-b border-gray-100 my-2">
                <div className="flex items-center gap-3.5 flex-1 pr-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <Users size={16} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">Start open session</span>
                      {sessionActive && (
                        <span className="text-[10px] bg-green-50 text-green-600 font-bold px-1.5 py-0.5 rounded animate-pulse">
                          Active ({sessionTime})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      Anyone can edit—no account required. Sessions end automatically after 24 hours.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSessionActive(!sessionActive)}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all border shrink-0 ${sessionActive
                    ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 cursor-pointer"
                    : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50 cursor-pointer"
                    }`}
                >
                  {sessionActive ? "Stop" : "Start"}
                </button>
              </div>

              {/* More Options */}
              <div>
                <div
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="flex items-center justify-between py-2.5 px-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100">
                      <MoreHorizontal size={15} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">More</span>
                  </div>
                  <ChevronRight size={15} className={`text-gray-400 group-hover:translate-x-0.5 transition-transform ${showMoreOptions ? "rotate-90" : ""}`} />
                </div>
                {showMoreOptions && (
                  <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-gray-50 rounded-xl animate-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => {
                        alert("Exporting project package... Saved to Downloads.");
                        setShowMoreOptions(false);
                      }}
                      className="text-left px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-white hover:text-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                    >
                      📥 Export CSV
                    </button>
                    <button
                      onClick={() => {
                        alert("Embedding iframe link copied to clipboard!");
                        navigator.clipboard.writeText(`<iframe src="${window.location.href}" width="800" height="600"></iframe>`);
                        setShowMoreOptions(false);
                      }}
                      className="text-left px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-white hover:text-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                    >
                      🔗 Embed board iframe
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

const INIT_ELS: El[] = [
  { id: "i1", type: "sticky", x: -260, y: -180, w: 200, h: 200, text: "🎉 Welcome to FigJam!\n\nDrag me around.", color: "#FFE566" },
  { id: "i2", type: "sticky", x: 20, y: -200, w: 200, h: 200, text: "Double-click any sticky to edit text ✏️", color: "#7BC8F6" },
  { id: "i3", type: "sticky", x: 300, y: -140, w: 200, h: 200, text: "Use the toolbar to add shapes, draw, and more.", color: "#FF9EAF" },
  { id: "i4", type: "shape", kind: "ellipse", x: -220, y: 100, w: 160, h: 100, color: "#4ECDC4" },
  { id: "i5", type: "shape", kind: "rect", x: 60, y: 90, w: 160, h: 100, color: "#FF6B6B" },
  { id: "i6", type: "text", x: -10, y: 240, text: "Press V · H · S · T · R · P for tools", fontSize: 15, color: "#7A7870" },
];

const getSessionUser = () => {
  try {
    const s = localStorage.getItem("figjam_session");
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed && parsed.name) return parsed.name;
    }
  } catch (e) { }
  return "Guest";
};

export default function App() {
  const [tool, setTool] = useState<Tool>("select");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommentWindowOpen, setIsCommentWindowOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [activePlacement, setActivePlacement] = useState<{ x: number, y: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [els, setEls] = useState<El[]>(INIT_ELS);
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string>("");
  const [boardName, setBoardName] = useState("Untitled Board");
  const [boardBg, setBoardBg] = useState<"white" | "black" | "green">("white");
  const [selIds, setSelIds] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [cam, setCam] = useState<Cam>({ x: 0, y: 0, z: 1 });
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0]);
  const [shapeColor, setShapeColor] = useState(SHAPE_COLORS[0]);
  const [shapeKind, setShapeKind] = useState<ShapeKind>("rect");
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [penType, setPenType] = useState<PenType>("pen");
  const [penThickness, setPenThickness] = useState<PenThickness>("thin");
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const [livePts, setLivePts] = useState<Pt[]>([]);
  const [liveArrow, setLiveArrow] = useState<{ start: Pt, end: Pt } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [simPeers, setSimPeers] = useState(false);

  const [peers, setPeers] = useState<Peer[]>([
    { id: "p1", name: "Alice", color: "#F24E1E", x: 300, y: 300, tx: 300, ty: 300 },
    { id: "p2", name: "Bob", color: "#1ABCFE", x: 800, y: 400, tx: 800, ty: 400 },
  ]);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string | null } | null>(null);

  const [history, setHistory] = useState<El[][]>([INIT_ELS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoRef = useRef(false);

  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      setHistory(h => {
        if (h[historyIndex] === els) return h;
        const newHistory = h.slice(0, historyIndex + 1);
        newHistory.push(els);
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, 300);
    return () => clearTimeout(t);
  }, [els, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEls(history[newIndex]);
      setSelIds([]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEls(history[newIndex]);
      setSelIds([]);
    }
  }, [historyIndex, history]);

  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  undoRef.current = undo;
  redoRef.current = redo;

  const wrapRef = useRef<HTMLDivElement>(null);
  const clipboardRef = useRef<El[]>([]);

  // Stable refs for use inside callbacks
  const camRef = useRef(cam);
  const elsRef = useRef(els);
  const toolRef = useRef(tool);
  const editIdRef = useRef(editId);
  const selIdsRef = useRef(selIds);
  const stickyColorRef = useRef(stickyColor);
  const shapeColorRef = useRef(shapeColor);
  const shapeKindRef = useRef(shapeKind);
  const penColorRef = useRef(penColor);
  const penTypeRef = useRef(penType);
  const penThicknessRef = useRef(penThickness);
  const boardBgRef = useRef(boardBg);
  const spaceRef = useRef(false);

  useEffect(() => { camRef.current = cam; }, [cam]);
  useEffect(() => { elsRef.current = els; }, [els]);
  useEffect(() => { editIdRef.current = editId; }, [editId]);
  useEffect(() => { selIdsRef.current = selIds; }, [selIds]);
  useEffect(() => { stickyColorRef.current = stickyColor; }, [stickyColor]);
  useEffect(() => { shapeColorRef.current = shapeColor; }, [shapeColor]);
  useEffect(() => { shapeKindRef.current = shapeKind; }, [shapeKind]);
  useEffect(() => {
    penColorRef.current = penColor;
    penTypeRef.current = penType;
    penThicknessRef.current = penThickness;
    toolRef.current = tool;
  }, [penColor, penType, penThickness, tool]);
  useEffect(() => { boardBgRef.current = boardBg; }, [boardBg]);

  // Interaction state refs
  const panRef = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number }[] | null>(null);
  const hasDraggedRef = useRef(false);
  const clickEditRef = useRef<string | null>(null);
  const drawRef = useRef<Pt[]>([]);
  const arrowRef = useRef<{ id: string; start: Pt } | null>(null);

  // Center canvas on mount and load boards
  useEffect(() => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const saved = localStorage.getItem("figjam-boards");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setBoards(parsed);
          const last = parsed[0];
          setCurrentBoardId(last.id);
          setBoardName(last.name);
          setBoardBg(last.bg || "white");
          setEls(last.els);
          setCam(last.cam);
          return;
        }
      } catch (e) { }
    }
    setCam({ x: cx, y: cy, z: 1 });
    const defaultBoard: Board = { id: "default", name: "Untitled Board", els: INIT_ELS, cam: { x: cx, y: cy, z: 1 }, updatedAt: Date.now() };
    setBoards([defaultBoard]);
    setEls(INIT_ELS);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!currentBoardId) return;
    // Debounce or save directly
    setBoards(prev => {
      const updated = prev.map(b => b.id === currentBoardId ? { ...b, els, cam, name: boardName, bg: boardBg, updatedAt: Date.now() } : b);
      if (!updated.find(b => b.id === currentBoardId)) {
        updated.push({ id: currentBoardId, name: boardName, bg: boardBg, els, cam, updatedAt: Date.now() });
      }
      localStorage.setItem("figjam-boards", JSON.stringify(updated));
      return updated;
    });
  }, [els, cam, boardName, currentBoardId, boardBg]);

  // Load comments
  useEffect(() => {
    const saved = localStorage.getItem("figjam-comments");
    if (saved) {
      try {
        setComments(JSON.parse(saved));
      } catch (e) { }
    }
  }, []);

  // Save comments
  useEffect(() => {
    localStorage.setItem("figjam-comments", JSON.stringify(comments));
  }, [comments]);

  // Simulated Multiplayer
  useEffect(() => {
    if (!simPeers) return;
    const int = setInterval(() => {
      setPeers(prev => prev.map(p => {
        if (Math.random() < 0.05) {
          // pick new target
          return { ...p, tx: Math.random() * window.innerWidth, ty: Math.random() * window.innerHeight };
        }
        // move smoothly towards target
        return { ...p, x: p.x + (p.tx - p.x) * 0.1, y: p.y + (p.ty - p.y) * 0.1 };
      }));
    }, 50);
    return () => clearInterval(int);
  }, [simPeers]);

  // ── Zoom ──────────────────────────────────────────────────────────────────

  const doZoom = useCallback((dir: number, cx?: number, cy?: number) => {
    setCam(prev => {
      const factor = dir > 0 ? 1.02 : 1 / 1.02;
      const nz = Math.max(0.08, Math.min(6, prev.z * factor));
      const px = cx ?? (wrapRef.current ? wrapRef.current.clientWidth / 2 : 0);
      const py = cy ?? (wrapRef.current ? wrapRef.current.clientHeight / 2 : 0);
      return {
        z: nz,
        x: px - (px - prev.x) * (nz / prev.z),
        y: py - (py - prev.y) * (nz / prev.z),
      };
    });
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.target !== document.body && (e.target as HTMLElement).tagName !== "DIV") return;
      if (editIdRef.current) return;

      if (e.code === "Space") {
        spaceRef.current = true;
        setSpaceHeld(true);
        e.preventDefault();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selIdsRef.current.length > 0) {
          setEls(p => p.filter(el => !selIdsRef.current.includes(el.id)));
          setSelIds([]);
        }
        return;
      }

      if (e.key === "Escape") { setSelIds([]); setEditId(null); return; }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          redoRef.current();
        } else {
          undoRef.current();
        }
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        redoRef.current();
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (selIdsRef.current.length > 0) {
          clipboardRef.current = elsRef.current.filter(ex => selIdsRef.current.includes(ex.id));
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (clipboardRef.current.length > 0) {
          const newEls = clipboardRef.current.map(el => {
            const newEl = { ...el, id: uid() };
            if ('x' in newEl) newEl.x += 20;
            if ('y' in newEl) newEl.y += 20;
            return newEl;
          });
          setEls(p => [...p, ...newEls]);
          setSelIds(newEls.map(e => e.id));
        }
        return;
      }

      const toolMap: Record<string, Tool> = {
        v: "select", h: "hand", s: "sticky", t: "text", r: "shape", p: "pen", e: "eraser", a: "arrow", l: "table", c: "comment"
      };
      if (e.ctrlKey || e.metaKey) {
        const mapped = toolMap[e.key.toLowerCase()];
        if (mapped) {
          e.preventDefault();
          setTool(mapped);
        }
      }
    };

    const onUp = (e: KeyboardEvent) => {
      if (e.code === "Space") { spaceRef.current = false; setSpaceHeld(false); }
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, []);

  // ── Wheel ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        doZoom(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY);
      } else {
        setCam(p => ({ ...p, x: p.x - e.deltaX * 0.8, y: p.y - e.deltaY * 0.8 }));
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [doZoom]);

  // ── Pointer events ────────────────────────────────────────────────────────

  const getRect = () => wrapRef.current!.getBoundingClientRect();

  const onPtrDown = useCallback((e: React.PointerEvent) => {
    setToolMenuOpen(false);
    setAiOpen(false);
    setContextMenu(null);
    if (e.button === 2) return; // Right click

    if (editIdRef.current) return;

    const isPan = toolRef.current === "hand" || spaceRef.current;

    if (isPan) {
      panRef.current = { px: e.clientX, py: e.clientY, cx: camRef.current.x, cy: camRef.current.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    const elTarget = (e.target as HTMLElement).closest("[data-el-id]");

    const doConnect = (id: string, clientX: number, clientY: number) => {
      const startPt = worldPt(clientX, clientY, getRect(), camRef.current);
      arrowRef.current = { id, start: startPt };
      setLiveArrow({ start: startPt, end: startPt });

      const onMove = (me: PointerEvent) => {
        const pt = worldPt(me.clientX, me.clientY, getRect(), camRef.current);
        setLiveArrow({ start: startPt, end: pt });
      };
      const onUp = (ue: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);

        const elsUnder = document.elementsFromPoint(ue.clientX, ue.clientY);
        const upTarget = elsUnder.map(el => el.closest("[data-el-id]")).find(el => el != null);

        if (upTarget) {
          const toId = upTarget.getAttribute("data-el-id")!;
          if (toId !== id) {
            setEls(p => [...p, { id: uid(), type: "connection", from: id, to: toId, color: "#1C1B1F", x: 0, y: 0 }]);
          }
        } else {
          const newId = uid();
          const pt = worldPt(ue.clientX, ue.clientY, getRect(), camRef.current);
          setEls(p => [...p, {
            id: newId, type: "free_arrow",
            x: startPt.x, y: startPt.y,
            dx: pt.x - startPt.x, dy: pt.y - startPt.y,
            color: "#1C1B1F"
          }]);
          setSelIds([newId]);
        }
        arrowRef.current = null;
        setLiveArrow(null);
        setTool("select");
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    if (elTarget && toolRef.current === "select") {
      const id = elTarget.getAttribute("data-el-id")!;
      const rect = getRect();
      const w = worldPt(e.clientX, e.clientY, rect, camRef.current);
      const found = elsRef.current.find(el => el.id === id);

      if (found && !found.locked) {
        let newSel = selIdsRef.current;
        const wasAlreadySelected = newSel.includes(id) && newSel.length === 1;
        clickEditRef.current = wasAlreadySelected && found.type === "sticky" ? id : null;
        hasDraggedRef.current = false;

        if (e.shiftKey) {
          if (newSel.includes(id)) newSel = newSel.filter(x => x !== id);
          else newSel = [...newSel, id];
        } else {
          if (!newSel.includes(id)) newSel = [id];
        }
        setSelIds(newSel);

        dragRef.current = newSel.map(sid => {
          const sEl = elsRef.current.find(x => x.id === sid);
          return sEl ? { id: sid, ox: w.x - sEl.x, oy: w.y - sEl.y } : null;
        }).filter(Boolean) as { id: string, ox: number, oy: number }[];

        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
      return;
    }

    // Clicked empty canvas
    if (toolRef.current === "select") {
      if (!e.shiftKey) setSelIds([]);
      return;
    }

    const rect = getRect();
    const w = worldPt(e.clientX, e.clientY, rect, camRef.current);

    if (toolRef.current === "comment") {
      setActivePlacement({ x: w.x, y: w.y });
      setNewCommentText("");
      return;
    }

    if (toolRef.current === "sticky") {
      const id = uid();
      setEls(p => [...p, {
        id, type: "sticky", x: w.x - 100, y: w.y - 100, w: 200, h: 200,
        text: "", color: stickyColorRef.current,
      }]);
      setSelIds([id]);
      setTool("select");
      return;
    }

    if (toolRef.current === "text") {
      const id = uid();
      const textColor = boardBgRef.current === "white" ? "#1C1B1F" : "#FFFFFF";
      setEls(p => [...p, { id, type: "text", x: w.x, y: w.y, text: "Text", fontSize: 20, color: textColor }]);
      setSelIds([id]);
      setEditId(id);
      setTool("select");
      return;
    }

    if (toolRef.current === "shape") {
      const id = uid();
      setEls(p => [...p, {
        id, type: "shape",
        kind: shapeKindRef.current,
        x: w.x - 80, y: w.y - 60, w: 160, h: 120,
        color: shapeColorRef.current,
      }]);
      setSelIds([id]);
      setTool("select");
      return;
    }

    if (toolRef.current === "table") {
      const id = uid();
      setEls(p => [...p, {
        id, type: "table",
        x: w.x - 120, y: w.y - 40,
        rows: 2, cols: 2, cellW: 120, cellH: 40,
        data: {}, color: "#FFFFFF"
      }]);
      setSelIds([id]);
      setTool("select");
      return;
    }

    if (toolRef.current === "pen") {
      const startPt = worldPt(e.clientX, e.clientY, getRect(), camRef.current);
      drawRef.current = [startPt];
      setLivePts([startPt]);

      const onMove = (me: PointerEvent) => {
        const pt = worldPt(me.clientX, me.clientY, getRect(), camRef.current);
        drawRef.current.push(pt);
        setLivePts(drawRef.current.slice());
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (drawRef.current.length > 1) {
          const pts = drawRef.current.slice();
          const id = uid();
          const sw = penTypeRef.current === "highlighter" ? (penThicknessRef.current === "thick" ? 48 : 24) :
            penTypeRef.current === "marker" ? (penThicknessRef.current === "thick" ? 16 : 8) :
              (penThicknessRef.current === "thick" ? 6 : 2);
          setEls(p => [...p, { id, type: "path", x: 0, y: 0, pts, color: penColorRef.current, sw, penType: penTypeRef.current }]);
        }
        drawRef.current = [];
        setLivePts([]);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return;
    }

    if (toolRef.current === "eraser") {
      const doErase = (clientX: number, clientY: number) => {
        const elsUnder = document.elementsFromPoint(clientX, clientY);
        const elTarget = elsUnder.map(el => el.closest("[data-el-id]")).find(el => el != null);
        if (elTarget) {
          const id = elTarget.getAttribute("data-el-id")!;
          setEls(p => p.filter(x => {
            if (x.id === id && !x.locked && x.type === "path") return false;
            return true;
          }));
        }
      };

      doErase(e.clientX, e.clientY);

      const onMove = (me: PointerEvent) => doErase(me.clientX, me.clientY);
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return;
    }

    if (toolRef.current === "arrow") {
      if (elTarget) {
        const id = elTarget.getAttribute("data-el-id")!;
        doConnect(id, e.clientX, e.clientY);
      } else {
        const startPt = worldPt(e.clientX, e.clientY, getRect(), camRef.current);
        setLiveArrow({ start: startPt, end: startPt });

        const onMove = (me: PointerEvent) => {
          setLiveArrow({ start: startPt, end: worldPt(me.clientX, me.clientY, getRect(), camRef.current) });
        };
        const onUp = (ue: PointerEvent) => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          const endPt = worldPt(ue.clientX, ue.clientY, getRect(), camRef.current);
          if (Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y) > 5) {
            const newId = uid();
            setEls(p => [...p, {
              id: newId, type: "free_arrow",
              x: startPt.x, y: startPt.y,
              dx: endPt.x - startPt.x, dy: endPt.y - startPt.y,
              color: "#1C1B1F"
            }]);
            setSelIds([newId]);
          }
          setLiveArrow(null);
          setTool("select");
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }
      return;
    }
  }, []);

  const onPtrMove = useCallback((e: React.PointerEvent) => {
    if (panRef.current) {
      const { px, py, cx, cy } = panRef.current;
      setCam(p => ({ ...p, x: cx + (e.clientX - px), y: cy + (e.clientY - py) }));
      return;
    }

    if (dragRef.current) {
      hasDraggedRef.current = true;
      const rect = getRect();
      const w = worldPt(e.clientX, e.clientY, rect, camRef.current);
      const dr = dragRef.current;
      setEls(p => p.map(el => {
        const d = dr.find(x => x.id === el.id);
        return d ? { ...el, x: w.x - d.ox, y: w.y - d.oy } : el;
      }));
      return;
    }

    if (drawRef.current.length > 0) {
      const rect = getRect();
      const w = worldPt(e.clientX, e.clientY, rect, camRef.current);
      drawRef.current = [...drawRef.current, w];
      setLivePts([...drawRef.current]);
    }
  }, []);

  const onPtrUp = useCallback((_e: React.PointerEvent) => {
    panRef.current = null;

    if (dragRef.current) {
      if (!hasDraggedRef.current && clickEditRef.current) {
        setEditId(clickEditRef.current);
      }
      clickEditRef.current = null;
      dragRef.current = null;
      return;
    }
  }, []);

  const onElDblClick = useCallback((id: string) => {
    if (id.includes("-")) {
      setEditId(id);
      setSelIds([id.split("-")[0]]);
      return;
    }
    const el = elsRef.current.find(e => e.id === id);
    if (el && (el.type === "sticky" || el.type === "text")) {
      setEditId(id);
      setSelIds([id]);
    }
  }, []);

  const onBlur = useCallback((id: string, text: string) => {
    if (id.includes("-")) {
      const [tableId, r, c] = id.split("-");
      setEls(p => p.map(el => {
        if (el.id === tableId && el.type === "table") {
          return { ...el, data: { ...el.data, [`${r},${c}`]: text } };
        }
        return el;
      }));
    } else {
      setEls(p => p.map(el => el.id === id ? { ...el, text } as El : el));
    }
    setEditId(null);
  }, []);

  const onUpdateEl = useCallback((id: string, partial: Partial<El>) => {
    setEls(p => p.map(el => el.id === id ? { ...el, ...partial } as El : el));
  }, []);

  const onDelete = useCallback(() => {
    if (selIdsRef.current.length > 0) {
      setEls(p => p.filter(el => !selIdsRef.current.includes(el.id)));
      setSelIds([]);
    }
  }, []);

  // ── Cursor ────────────────────────────────────────────────────────────────

  const cursor = spaceHeld || tool === "hand" ? "grab" :
    tool === "eraser" ? "crosshair" :
      tool === "select" ? "default" : "crosshair";

  // ── Render ────────────────────────────────────────────────────────────────

  const onStartConnect = useCallback((e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const startPt = worldPt(e.clientX, e.clientY, getRect(), camRef.current);
    arrowRef.current = { id, start: startPt };
    setLiveArrow({ start: startPt, end: startPt });

    const onMove = (me: PointerEvent) => {
      const pt = worldPt(me.clientX, me.clientY, getRect(), camRef.current);
      setLiveArrow({ start: startPt, end: pt });
    };
    const onUp = (ue: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);

      const elsUnder = document.elementsFromPoint(ue.clientX, ue.clientY);
      const upTarget = elsUnder.map(el => el.closest("[data-el-id]")).find(el => el != null);

      if (upTarget) {
        const toId = upTarget.getAttribute("data-el-id")!;
        if (toId !== id) {
          setEls(p => [...p, { id: uid(), type: "connection", from: id, to: toId, color: "#1C1B1F", x: 0, y: 0 }]);
        }
      } else {
        const newId = uid();
        const pt = worldPt(ue.clientX, ue.clientY, getRect(), camRef.current);
        const newShape: ShapeEl = {
          id: newId, type: "shape", kind: shapeKindRef.current || "rect",
          x: pt.x - 80, y: pt.y - 60, w: 160, h: 120,
          color: shapeColorRef.current || "#FF6B6B"
        };
        setEls(p => [...p, newShape, { id: uid(), type: "connection", from: id, to: newId, color: "#1C1B1F", x: 0, y: 0 }]);
        setSelIds([newId]);
      }
      arrowRef.current = null;
      setLiveArrow(null);
      setTool("select");
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const elsUnder = document.elementsFromPoint(e.clientX, e.clientY);
    const elTarget = elsUnder.map(el => el.closest("[data-el-id]")).find(el => el != null);

    if (elTarget) {
      const id = elTarget.getAttribute("data-el-id")!;
      if (!selIdsRef.current.includes(id)) {
        setSelIds([id]);
      }
      setContextMenu({ x: e.clientX, y: e.clientY, id });
    } else {
      setContextMenu({ x: e.clientX, y: e.clientY, id: selIdsRef.current.length > 0 ? selIdsRef.current[0] : null });
    }
  }, []);

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ cursor, fontFamily: "'Plus Jakarta Sans', sans-serif", userSelect: "none" }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-300"
        style={{
          backgroundColor: boardBg === "white" ? "#F5F5F5" : boardBg === "black" ? "#111111" : "#1B4D3E",
          backgroundImage: boardBg === "white"
            ? "radial-gradient(circle, #C0BEB6 1.3px, transparent 1.3px)"
            : boardBg === "black"
              ? "radial-gradient(circle, #333333 1.3px, transparent 1.3px)"
              : "radial-gradient(circle, rgba(255,255,255,0.12) 1.3px, transparent 1.3px)",
          backgroundSize: `${24 * cam.z}px ${24 * cam.z}px`,
          backgroundPosition: `${cam.x % (24 * cam.z)}px ${cam.y % (24 * cam.z)}px`,
        }}
      />

      {/* Canvas event capture */}
      <div
        ref={wrapRef}
        className="absolute inset-0"
        onPointerDown={onPtrDown}
        onPointerMove={onPtrMove}
        onPointerUp={onPtrUp}
        onContextMenu={handleContextMenu}
      >
        {/* Camera transform */}
        <div
          className="absolute origin-top-left"
          style={{ transform: `translate(${cam.x}px,${cam.y}px) scale(${cam.z})` }}
        >
          {/* Main elements loop */}
          {els.map(el => {
            if (el.type === "sticky") {
              return (
                <StickyNote
                  key={el.id} el={el}
                  selected={selIds.includes(el.id)} editing={editId === el.id}
                  zoom={cam.z}
                  onBlur={onBlur} onDblClick={onElDblClick}
                  onStartConnect={onStartConnect}
                  onUpdate={onUpdateEl}
                />
              );
            }
            if (el.type === "text") {
              return (
                <TextNode
                  key={el.id} el={el}
                  selected={selIds.includes(el.id)} editing={editId === el.id}
                  onBlur={onBlur} onDblClick={onElDblClick}
                />
              );
            }
            if (el.type === "shape") {
              return <ShapeNode key={el.id} el={el} selected={selIds.includes(el.id)} onStartConnect={onStartConnect} />;
            }
            if (el.type === "table") {
              return (
                <TableNode
                  key={el.id} el={el}
                  selected={selIds.includes(el.id)}
                  editingId={editId}
                  zoom={cam.z}
                  onBlur={onBlur}
                  onDblClick={onElDblClick}
                  onUpdate={onUpdateEl}
                />
              );
            }
            if (el.type === "connection") {
              const c = el as ConnectionEl;
              const fromEl = els.find(x => x.id === c.from);
              const toEl = els.find(x => x.id === c.to);
              if (!fromEl || !toEl) return null;

              const box1 = getElementBox(fromEl);
              const box2 = getElementBox(toEl);
              if (!box1 || !box2) return null;

              const pt1 = getBoundaryPt(box1.cx, box1.cy, box1.w, box1.h, box2.cx, box2.cy);
              const pt2 = getBoundaryPt(box2.cx, box2.cy, box2.w, box2.h, box1.cx, box1.cy);

              return (
                <svg key={c.id} className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: "none" }}>
                  <defs>
                    <marker id={`arrowhead-${c.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#1C1B1F" />
                    </marker>
                  </defs>
                  <g data-el-id={c.id}>
                    <line
                      x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                      stroke="transparent" strokeWidth="20"
                      style={{ pointerEvents: "stroke", cursor: tool === "select" ? "pointer" : undefined }}
                    />
                    <line
                      x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                      stroke={c.color} strokeWidth="3" markerEnd={`url(#arrowhead-${c.id})`}
                      style={{ pointerEvents: "none", filter: selIds.includes(c.id) ? "drop-shadow(0 0 4px #3742FA)" : undefined }}
                    />
                  </g>
                </svg>
              );
            }
            if (el.type === "free_arrow") {
              const fa = el as FreeArrowEl;
              const pt1 = { x: fa.x, y: fa.y };
              const pt2 = { x: fa.x + fa.dx, y: fa.y + fa.dy };
              return (
                <svg key={fa.id} className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: "none" }}>
                  <defs>
                    <marker id={`arrowhead-${fa.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill={fa.color} />
                    </marker>
                  </defs>
                  <g data-el-id={fa.id}>
                    <line
                      x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                      stroke="transparent" strokeWidth="20"
                      style={{ pointerEvents: "stroke", cursor: tool === "select" ? "pointer" : undefined }}
                    />
                    <line
                      x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                      stroke={fa.color} strokeWidth="3" markerEnd={`url(#arrowhead-${fa.id})`}
                      style={{ pointerEvents: "none", filter: selIds.includes(fa.id) ? "drop-shadow(0 0 4px #3742FA)" : undefined }}
                    />
                  </g>
                </svg>
              );
            }
            if (el.type === "path") {
              const p = el as PathEl;
              const isHighlighter = p.penType === "highlighter";
              return (
                <svg key={p.id} className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: "none" }}>
                  <g data-el-id={p.id}>
                    <path
                      d={pathD(p.pts)} stroke="transparent" strokeWidth={Math.max(20, p.sw + 10)} fill="none" strokeLinecap="round" strokeLinejoin="round"
                      style={{ pointerEvents: "stroke", cursor: tool === "select" ? "grab" : undefined }}
                    />
                    <path
                      d={pathD(p.pts)} stroke={p.color} strokeWidth={p.sw} fill="none" strokeLinecap="round" strokeLinejoin="round"
                      style={{ pointerEvents: "none", opacity: isHighlighter ? 0.3 : 1, mixBlendMode: isHighlighter ? "multiply" : undefined, filter: selIds.includes(p.id) ? "drop-shadow(0 0 4px #3742FA)" : undefined }}
                    />
                  </g>
                </svg>
              );
            }
            return null;
          })}

          {/* Live drawing preview */}
          {(livePts.length > 1 || liveArrow) && (
            <svg className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: "none", zIndex: 9999 }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#1C1B1F" />
                </marker>
              </defs>
              {livePts.length > 1 && (() => {
                const isHighlighter = penType === "highlighter";
                const liveSw = isHighlighter ? (penThickness === "thick" ? 48 : 24) :
                  penType === "marker" ? (penThickness === "thick" ? 16 : 8) :
                    (penThickness === "thick" ? 6 : 2);
                return (
                  <path d={pathD(livePts)} stroke={penColor} strokeWidth={liveSw} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: isHighlighter ? 0.3 : 1, mixBlendMode: isHighlighter ? "multiply" : undefined }} />
                );
              })()}
              {liveArrow && (
                <line x1={liveArrow.start.x} y1={liveArrow.start.y} x2={liveArrow.end.x} y2={liveArrow.end.y} stroke="#1C1B1F" strokeWidth="3" markerEnd="url(#arrowhead)" opacity={0.5} />
              )}
            </svg>
          )}

          {comments
            .filter((c) => c.boardId === currentBoardId)
            .map((c) => (
              <div
                key={c.id}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCommentId(c.id === selectedCommentId ? null : c.id);
                }}
                className="absolute flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-150 z-50 group pointer-events-auto"
                style={{
                  left: c.x - 16,
                  top: c.y - 16,
                  width: 32,
                  height: 32,
                }}
              >
                <div
                  className="w-full.h-full rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-md border-[2.5px] border-white w-8 h-8"
                  style={{ backgroundColor: c.color || "#3742FA" }}
                >
                  {c.author ? c.author.slice(0, 2).toUpperCase() : "C"}
                </div>
                {/* Popover content if selected or hovered */}
                {selectedCommentId === c.id ? (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute top-10 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 min-w-[200px] z-50"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1.5 mb-1.5">
                      <span className="font-semibold text-xs text-gray-800">{c.author}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap select-text">{c.text}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setComments(prev => prev.filter(x => x.id !== c.id));
                        setSelectedCommentId(null);
                      }}
                      className="mt-2 text-[10px] font-medium text-red-500 hover:text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900/95 text-white text-xs py-1 px-2 rounded-lg shadow-md whitespace-nowrap z-50 pointer-events-none">
                    <span className="font-semibold">{c.author}:</span> {c.text.length > 25 ? c.text.slice(0, 25) + "..." : c.text}
                  </div>
                )}
              </div>
            ))}

          {activePlacement && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-64 z-50 pointer-events-auto"
              style={{
                left: activePlacement.x,
                top: activePlacement.y,
              }}
            >
              <div className="text-xs font-semibold text-gray-600 mb-1">New comment by {getSessionUser()}</div>
              <textarea
                autoFocus
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (newCommentText.trim()) {
                      setComments(prev => [...prev, {
                        id: uid(),
                        boardId: currentBoardId,
                        x: activePlacement.x,
                        y: activePlacement.y,
                        text: newCommentText.trim(),
                        author: getSessionUser(),
                        createdAt: Date.now(),
                        color: "#3742FA"
                      }]);
                      setActivePlacement(null);
                      setTool("select");
                    }
                  } else if (e.key === "Escape") {
                    setActivePlacement(null);
                    setTool("select");
                  }
                }}
                className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#3742FA]/20 focus:border-[#3742FA] outline-none resize-none h-16 text-gray-800"
              />
              <div className="flex justify-end gap-1.5 mt-2">
                <button
                  onClick={() => {
                    setActivePlacement(null);
                    setTool("select");
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newCommentText.trim()) {
                      setComments(prev => [...prev, {
                        id: uid(),
                        boardId: currentBoardId,
                        x: activePlacement.x,
                        y: activePlacement.y,
                        text: newCommentText.trim(),
                        author: getSessionUser(),
                        createdAt: Date.now(),
                        color: "#3742FA"
                      }]);
                      setActivePlacement(null);
                      setTool("select");
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-[#3742FA] hover:bg-[#5B4FE8] rounded-lg transition-colors shadow-sm"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        tool={tool}
        setTool={(t) => {
          setTool(t);
          if (t === "comment") {
            setIsCommentWindowOpen(true);
          } else {
            setActivePlacement(null);
          }
        }}
        onZoom={doZoom}
        zoomLevel={cam.z}
        stickyColor={stickyColor}
        setStickyColor={(c) => {
          setStickyColor(c);
          setEls(p => p.map(el => selIds.includes(el.id) && el.type === "sticky" ? { ...el, color: c } : el));
        }}
        shapeColor={shapeColor}
        setShapeColor={(c) => {
          setShapeColor(c);
          setEls(p => p.map(el => selIds.includes(el.id) && el.type === "shape" ? { ...el, color: c } : el));
        }}
        shapeKind={shapeKind}
        setShapeKind={(k) => {
          setShapeKind(k);
          setEls(p => p.map(el => selIds.includes(el.id) && el.type === "shape" ? { ...el, kind: k } as El : el));
        }}
        penColor={penColor}
        setPenColor={(c) => {
          setPenColor(c);
          setEls(p => p.map(el => selIds.includes(el.id) && el.type === "path" ? { ...el, color: c } : el));
        }}
        penType={penType}
        setPenType={setPenType}
        penThickness={penThickness}
        setPenThickness={setPenThickness}
        toolMenuOpen={toolMenuOpen}
        setToolMenuOpen={setToolMenuOpen}
        onDelete={onDelete}
        hasSelection={selIds.length > 0}
      />

      {/* Top bar */}
      <TopBar
        boards={boards}
        currentBoardId={currentBoardId}
        boardName={boardName}
        boardBg={boardBg}
        onChangeBg={setBoardBg}
        onChangeBoard={(id) => {
          const board = boards.find(b => b.id === id);
          if (board) {
            setCurrentBoardId(board.id);
            setBoardName(board.name);
            setBoardBg(board.bg || "white");
            isUndoRedoRef.current = true;
            setEls(board.els);
            setHistory([board.els]);
            setHistoryIndex(0);
            setCam(board.cam);
            setSelIds([]);
            setEditId(null);
          }
        }}
        onNewBoard={() => {
          const id = uid();
          setCurrentBoardId(id);
          setBoardName("New Board");
          setEls([]);
        }}
        onRenameBoard={(name) => setBoardName(name)}
        simPeers={simPeers}
        onToggleSimPeers={() => setSimPeers(p => !p)}
      />

      {/* Peers / Simulated Multiplayer */}
      {simPeers && peers.map(p => (
        <div
          key={p.id}
          className="absolute top-0 left-0 pointer-events-none z-40 transition-transform duration-[50ms] ease-linear"
          style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
        >
          <svg width="20" height="26" viewBox="0 0 16 23" fill={p.color} stroke="white" strokeWidth="2" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>
            <path d="M1.3853 0.385299C0.840742 -0.159258 0 0.226343 0 0.996155V21.1398C0 21.9405 0.992646 22.3168 1.52355 21.7145L5.78762 16.8797L9.58801 22.6517C9.91428 23.1472 10.5843 23.2882 11.0853 22.9666L13.1118 21.6659C13.6128 21.3444 13.7538 20.6811 13.4276 20.1856L9.62719 14.4136H15.0038C15.7737 14.4136 16.1593 13.4834 15.6147 12.9388L1.3853 0.385299Z" />
          </svg>
          <div className="absolute top-5 left-4 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-md pointer-events-none" style={{ backgroundColor: p.color }}>
            {p.name}
          </div>
        </div>
      ))}

      {isCommentWindowOpen && (
        <div className="absolute top-24 right-6 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex flex-col z-50 pointer-events-auto overflow-hidden max-h-[500px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-800">
              <MessageSquare size={16} className="text-[#3742FA]" />
              <span className="font-bold text-sm">Comments</span>
            </div>
            <button
              onClick={() => {
                setIsCommentWindowOpen(false);
                if (tool === "comment") setTool("select");
              }}
              className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Prompt/Helper */}
          <div className="p-3 bg-blue-50/50 border-b border-blue-50/50 text-[11px] text-blue-600 leading-normal">
            💡 Select the Comment tool (or press C) and click anywhere on the canvas to place a comment!
          </div>

          {/* List of comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {comments.filter(c => c.boardId === currentBoardId).length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No comments on this board yet.
              </div>
            ) : (
              comments
                .filter(c => c.boardId === currentBoardId)
                .map(c => (
                  <div key={c.id} className="p-2.5 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-100/80 transition-all flex flex-col gap-1 relative group/item">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: c.color || "#3742FA" }}
                        >
                          {c.author ? c.author.slice(0, 2).toUpperCase() : "C"}
                        </div>
                        <span className="font-semibold text-xs text-gray-700">{c.author}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-650 pl-6 whitespace-pre-wrap select-text">{c.text}</p>
                    <div className="flex justify-between items-center mt-1 pl-6">
                      <button
                        onClick={() => {
                          // Center camera on the comment
                          setCam({ x: window.innerWidth / 2 - c.x * cam.z, y: window.innerHeight / 2 - c.y * cam.z, z: cam.z });
                          setSelectedCommentId(c.id);
                        }}
                        className="text-[10px] text-[#3742FA] hover:underline font-medium"
                      >
                        Find on canvas
                      </button>
                      <button
                        onClick={() => {
                          setComments(prev => prev.filter(x => x.id !== c.id));
                          if (selectedCommentId === c.id) setSelectedCommentId(null);
                        }}
                        className="text-[10px] text-red-500 hover:text-red-700 font-medium opacity-0 group-hover/item:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* AI Dialog */}
      <AIDialog open={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Floating AI Button */}
      {!aiOpen && (
        <div className="absolute bottom-6 right-6 z-50 pointer-events-auto">
          <button
            onClick={() => setAiOpen(true)}
            title="Open AI Assistant"
            className="relative flex items-center justify-center bg-white border border-gray-200 text-gray-800 shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden gap-2.5 px-5 h-14 rounded-full"
          >
            <Sparkles size={20} className="text-[#7B61FF] shrink-0" />
            <span className="font-semibold text-[15px] whitespace-nowrap">
              How can I help you?
            </span>
          </button>
        </div>
      )}


      {/* Space hint */}
      {spaceHeld && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-xs text-gray-500 px-3 py-1.5 rounded-full shadow-md border border-gray-100 pointer-events-none">
          Hold Space to pan
        </div>
      )}

      {/* Tool hint */}
      {!spaceHeld && tool !== "select" && tool !== "hand" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#3742FA] text-white text-xs px-3 py-1.5 rounded-full shadow-md pointer-events-none font-medium">
          {tool === "sticky" ? "Click to place sticky note" :
            tool === "text" ? "Click to place text" :
              tool === "shape" ? "Click to place shape" :
                tool === "arrow" ? "Drag to connect elements" :
                  tool === "pen" ? "Draw freely" :
                    tool === "comment" ? "Click anywhere to place a comment" : ""}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute z-[100] bg-white rounded-lg shadow-xl border border-gray-100 py-1 min-w-[150px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onPointerDown={e => e.stopPropagation()}
        >
          {contextMenu.id && (
            <button
              className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#3742FA] hover:text-white transition-colors"
              onClick={() => {
                if (selIds.length > 0) {
                  clipboardRef.current = els.filter(ex => selIds.includes(ex.id));
                }
                setContextMenu(null);
              }}
            >
              Copy
            </button>
          )}

          <button
            className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#3742FA] hover:text-white transition-colors"
            onClick={() => {
              if (clipboardRef.current.length > 0) {
                const newEls = clipboardRef.current.map(el => {
                  const newEl = { ...el, id: uid() };
                  if ('x' in newEl) newEl.x += 20;
                  if ('y' in newEl) newEl.y += 20;
                  return newEl;
                });
                setEls(p => [...p, ...newEls]);
                setSelIds(newEls.map(e => e.id));
              }
              setContextMenu(null);
            }}
            disabled={clipboardRef.current.length === 0}
            style={{ opacity: clipboardRef.current.length > 0 ? 1 : 0.5 }}
          >
            Paste
          </button>

          {selIds.length > 0 && (
            <>
              <button
                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#3742FA] hover:text-white transition-colors"
                onClick={() => {
                  setEls(p => {
                    const otherEls = p.filter(el => !selIds.includes(el.id));
                    const selEls = p.filter(el => selIds.includes(el.id));
                    return [...selEls, ...otherEls];
                  });
                  setContextMenu(null);
                }}
              >
                Send to back
              </button>

              <button
                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#3742FA] hover:text-white transition-colors"
                onClick={() => {
                  setEls(p => {
                    const otherEls = p.filter(el => !selIds.includes(el.id));
                    const selEls = p.filter(el => selIds.includes(el.id));
                    return [...otherEls, ...selEls];
                  });
                  setContextMenu(null);
                }}
              >
                Bring to front
              </button>

              <button
                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#3742FA] hover:text-white transition-colors"
                onClick={() => {
                  setEls(p => p.map(el => selIds.includes(el.id) ? { ...el, locked: !el.locked } : el));
                  setContextMenu(null);
                }}
              >
                {selIds.every(id => els.find(e => e.id === id)?.locked) ? "Unlock" : "Lock"}
              </button>

              <button
                className="w-full text-left px-4 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => {
                  setEls(p => p.filter(el => !selIds.includes(el.id)));
                  setSelIds([]);
                  setContextMenu(null);
                }}
                disabled={selIds.some(id => els.find(e => e.id === id)?.locked)}
                style={{ opacity: selIds.some(id => els.find(e => e.id === id)?.locked) ? 0.5 : 1 }}
              >
                Delete
              </button>

              <div className="w-full h-px bg-gray-100 my-1" />

              <button
                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#3742FA] hover:text-white transition-colors"
                onClick={async () => {
                  const node = document.querySelector(`[data-el-id="${contextMenu.id}"]`) as HTMLElement;
                  if (node) {
                    try {
                      const prevSel = selIdsRef.current;
                      setSelIds([]);
                      await new Promise(r => setTimeout(r, 50));
                      const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: "transparent" });
                      setSelIds(prevSel);
                      const res = await fetch(dataUrl);
                      const blob = await res.blob();
                      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                    } catch (e) {
                      console.error("Failed to copy PNG", e);
                    }
                  }
                  setContextMenu(null);
                }}
              >
                Copy as PNG
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
