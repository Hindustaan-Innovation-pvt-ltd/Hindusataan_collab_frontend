// types.ts

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