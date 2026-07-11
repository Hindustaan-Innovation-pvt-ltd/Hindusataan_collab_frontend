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
export type PenThickness = number;

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
  tx?: number;
  ty?: number;
  selIds?: string[];
  isTyping?: boolean;
  editingId?: string | null;
  lastUpdate?: number;
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

export interface BoardMeta {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Collaborator {
  id: string;
  board_id: string;
  user_id: string;
  role: string;
}

export interface Invite {
  id: string;
  board_id: string;
  inviter_id: string;
  invitee_email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
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
  fontFamily?: string;
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
  label?: string;
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

export type DeviceFrameKind = "browser" | "phone";
export interface DeviceFrameEl extends BaseEl {
  type: "device_frame";
  kind: DeviceFrameKind;
  w: number;
  h: number;
  color: string;
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
  | GraphEl
  | DeviceFrameEl;

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  streaming?: boolean;
}