export type ShapeKind = "rect" | "ellipse" | "triangle" | "diamond" | "arrow";

export interface ShapeEl {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  kind: ShapeKind;
  text?: string;
}

export interface TextEl {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}

export interface TableEl {
  id: string;
  x: number;
  y: number;
  rows: number;
  cols: number;
  cellW: number;
  cellH: number;
  // Cell contents keyed by "row,col" — e.g. data["0,1"] = "Header B"
  data: Record<string, string>;
}