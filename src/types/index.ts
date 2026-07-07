// ── Types ─────────────────────────────────────────────────────────────────────

export type Tool = "select" | "hand" | "sticky" | "text" | "shape" | "pen" | "eraser" | "arrow" | "table" | "comment";
export type ShapeKind = "rect" | "ellipse" | "diamond" | "triangle" | "hexagon" | "star" | "parallelogram" | "arrow_right" | "document" | "cross" | "pentagon" | "octagon";

export interface Pt { x: number; y: number }
export type Base = { id: string; x: number; y: number; locked?: boolean };

export type StickyEl = Base & { type: "sticky"; w: number; h: number; text: string; color: string };
export type TextEl = Base & { type: "text"; text: string; fontSize: number; color: string };
export type ShapeEl = Base & { type: "shape"; kind: ShapeKind; w: number; h: number; color: string; text?: string };
export type PenType = "pen" | "marker" | "highlighter";
export type PenThickness = "thin" | "thick";
export type PathEl = Base & { type: "path"; pts: Pt[]; color: string; sw: number; penType?: PenType };
export type ConnectionEl = Base & { type: "connection"; from: string; to: string; color: string };
export type FreeArrowEl = Base & { type: "free_arrow"; dx: number; dy: number; color: string };
export type TableEl = Base & { type: "table"; rows: number; cols: number; cellW: number; cellH: number; data: Record<string, string>; color: string };
export type GraphEl = Base & { type: "graph"; w: number; h: number; graphData: any; color: string };
export type El = StickyEl | TextEl | ShapeEl | PathEl | ConnectionEl | TableEl | FreeArrowEl | GraphEl;

export interface Cam { x: number; y: number; z: number }

export interface Board {
  id: string;
  name: string;
  bg?: "white" | "black" | "green";
  els: El[];
  cam: Cam;
  updatedAt: number;
}

export interface Peer {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
}

export interface Comment {
  id: string;
  boardId: string;
  x: number;
  y: number;
  text: string;
  author: string;
  createdAt: number;
  color: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  graphData?: any;
}
