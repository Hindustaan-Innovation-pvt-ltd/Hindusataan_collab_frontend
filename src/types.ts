export type ShapeKind = "rect" | "ellipse" | "triangle" | "diamond" | "arrow" | "hexagon" | "star" | "parallelogram" | "arrow_right" | "document" | "cross" | "pentagon" | "octagon";

export type Tool =
  | "select"
  | "hand"
  | "pen"
  | "shape"
  | "sticky"
  | "text"
  | "table"
  | "icon"
  | "eraser"
  | "arrow"
  | "comment";

export type PenType = "pen" | "marker" | "highlighter";
export type PenThickness = "thin" | "thick";

export interface Pt {
  x: number;
  y: number;
}

export interface Cam {
  x: number;
  y: number;
  z: number;
}

export interface Board {
  id: string;
  name: string;
  els: El[];
  cam: Cam;
  updatedAt: number;
  bg?: "white" | "black" | "green";
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
  color?: string;
}

// Fields shared by every canvas element
interface BaseEl {
  id: string;
  x: number;
  y: number;
  locked?: boolean;
}

export interface StickyEl extends BaseEl {
  type: "sticky";
  w: number;
  h: number;
  text: string;
  color: string;
}

export interface TextEl extends BaseEl {
  type: "text";
  text: string;
  fontSize: number;
  color: string;
}

export interface ShapeEl extends BaseEl {
  type: "shape";
  kind: ShapeKind;
  w: number;
  h: number;
  color: string;
  text?: string;
}

export interface TableEl extends BaseEl {
  type: "table";
  rows: number;
  cols: number;
  cellW: number;
  cellH: number;
  // Cell contents keyed by "row,col" — e.g. data["0,1"] = "Header B"
  data: Record<string, string>;
  color?: string;
}

export interface IconEl extends BaseEl {
  type: "icon";
  iconName: string; // matches a lucide-react export name, e.g. "CupSoda", "Smile"
  size: number;
  color: string;
}

export interface ConnectionEl extends BaseEl {
  type: "connection";
  from: string;
  to: string;
  color: string;
}

export interface FreeArrowEl extends BaseEl {
  type: "free_arrow";
  dx: number;
  dy: number;
  color: string;
}

export interface PathEl extends BaseEl {
  type: "path";
  pts: Pt[];
  color: string;
  sw: number;
  penType: PenType;
}

export interface GraphEl extends BaseEl {
  type: "graph";
  w: number;
  h: number;
  color: string;
  graphData: any;
}

export type El =
  | StickyEl
  | TextEl
  | ShapeEl
  | TableEl
  | IconEl
  | ConnectionEl
  | FreeArrowEl
  | PathEl
  | GraphEl;

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  streaming?: boolean;
}



// export type ShapeKind = "rect" | "ellipse" | "triangle" | "diamond" | "arrow";
// export type El = TextEl | ShapeEl | TableEl | IconEl;

// export interface ShapeEl {
//   id: string;
//   x: number;
//   y: number;
//   w: number;
//   h: number;
//   color: string;
//   kind: ShapeKind;
//   text?: string;
// }

// export interface TextEl {
//   id: string;
//   x: number;
//   y: number;
//   text: string;
//   fontSize: number;
//   color: string;
// }

// export interface TableEl {
//   id: string;
//   x: number;
//   y: number;
//   rows: number;
//   cols: number;
//   cellW: number;
//   cellH: number;
//   // Cell contents keyed by "row,col" — e.g. data["0,1"] = "Header B"
//   data: Record<string, string>;
// }

// export interface IconEl {
//   id: string;
//   type: "icon";
//   iconName: string; // e.g. "CupSoda", "Smile" — matches a lucide-react export name
//   x: number;
//   y: number;
//   size: number;
//   color: string;
// }

// export type Tool = "select" | "pen" | "shape" | "sticky" | "text" | "table"|"icon";
// export type PenType = "pen" | "marker" | "highlighter";
// export type PenThickness = "thin" | "thick";