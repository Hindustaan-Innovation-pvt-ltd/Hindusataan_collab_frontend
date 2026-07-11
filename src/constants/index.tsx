import type { JSX } from "react";
import {
  MousePointer2, Hand, Type, Square, Circle, Pen,
  ArrowUpRight, Eraser, Table, StickyNote as StickyNoteIcon, MessageSquare
} from "lucide-react";
import type { El, ShapeKind, Tool } from "../types";

// ── Colors ─────────────────────────────────────────────────────────────────────

export const STICKY_COLORS = ["#FFE566", "#FF9EAF", "#7BC8F6", "#B5EAD7", "#FFBF69", "#D4A1FF"];
export const SHAPE_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#F7C59F", "#C9B1FF"];
export const PEN_COLORS = ["var(--color-foreground)", "#000000", "#FFFFFF", "#FF4757", "#2ED573", "#1E90FF", "#FFE566", "#FF6B9D"];

// ── Tools ──────────────────────────────────────────────────────────────────────

export const TOOLS: { id: Tool; label: string; key: string; icon: JSX.Element }[] = [
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

// ── Shape Kinds ────────────────────────────────────────────────────────────────

export const SHAPE_KINDS: { kind: ShapeKind; label: string; icon: JSX.Element }[] = [
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

// ── Initial Board Elements ─────────────────────────────────────────────────────

export const INIT_ELS: El[] = [
  { id: "i1", type: "sticky", x: -260, y: -180, w: 200, h: 200, text: "🎉 Welcome to HIXCanvas!\n\nDrag me around.", color: "#FFE566" },
  { id: "i2", type: "sticky", x: 20, y: -200, w: 200, h: 200, text: "Double-click any sticky to edit text ✏️", color: "#7BC8F6" },
  { id: "i3", type: "sticky", x: 300, y: -140, w: 200, h: 200, text: "Use the toolbar to add shapes, draw, and more.", color: "#FF9EAF" },
  { id: "i4", type: "shape", kind: "ellipse", x: -220, y: 100, w: 160, h: 100, color: "#4ECDC4" },
  { id: "i5", type: "shape", kind: "rect", x: 60, y: 90, w: 160, h: 100, color: "#FF6B6B" },
  { id: "i6", type: "text", x: -10, y: 240, text: "Press V · H · S · T · R · P for tools", fontSize: 15, color: "#7A7870" },
];
