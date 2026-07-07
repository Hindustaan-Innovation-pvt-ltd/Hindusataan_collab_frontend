import { El, ShapeEl, ConnectionEl, ShapeKind } from "../types";
import { uid } from "./index";

export function parseMermaidToElements(mermaid: string, startX: number, startY: number): El[] {
  const lines = mermaid.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("flowchart") && !l.startsWith("graph"));
  
  const nodes = new Map<string, { id: string, text: string, kind: ShapeKind }>();
  const connections: ConnectionEl[] = [];
  
  // Clean up inline comments
  const cleanLines = lines.map(l => l.split("%%")[0].trim());

  const registerNode = (key: string, text: string, bracket: string) => {
    let kind: ShapeKind = "rect";
    if (bracket === "{" || bracket === "{{") kind = "diamond";
    else if (bracket === "([" || bracket === "((" || bracket === "(") kind = "ellipse"; 
    else if (bracket === ">") kind = "rect"; // Treat flag as rect for now
    
    // Unescape quotes and common markdown if necessary
    let cleanText = text.replace(/^["']|["']$/g, "").replace(/<br\s*\/?>/gi, "\n");
    
    if (!nodes.has(key)) {
      nodes.set(key, { id: uid(), text: cleanText || key, kind });
    } else if (cleanText && cleanText !== key && nodes.get(key)!.text === key) {
      // Update with richer text/kind if defined later
      nodes.get(key)!.text = cleanText;
      nodes.get(key)!.kind = kind;
    }
  };

  // 1. Extract node definitions
  const nodePattern = /([A-Za-z0-9_]+)\s*(\(\[|\(\(|\(|\[\[|\[|\{\{|{|>)(.+?)(\]\)|\]\]|\]|\}\}|}|\)|\)\))/g;
  for (const line of cleanLines) {
    let match;
    while ((match = nodePattern.exec(line)) !== null) {
      registerNode(match[1], match[3].trim(), match[2]);
    }
  }

  // 2. Extract edges robustly by splitting on arrow sequences
  for (const line of cleanLines) {
    let strippedLine = line;
    strippedLine = strippedLine.replace(nodePattern, "$1");
    
    const arrowRegex = /\s*(?:-[->]+|==+>|-\.-+>)(?:\|[^|]+\|)?\s*|\s*--[^-]+-->\s*|\s*-\.[^-]+\.->\s*|\s*==[^=]+==>\s*/g;
    const parts = strippedLine.split(arrowRegex).filter(p => p.trim() !== "");
    
    if (parts.length > 1) {
      for (let i = 0; i < parts.length - 1; i++) {
        const fromMatch = parts[i].match(/^\s*([A-Za-z0-9_]+)/);
        const toMatch = parts[i+1].match(/^\s*([A-Za-z0-9_]+)/);
        
        if (fromMatch && toMatch) {
          const fromKey = fromMatch[1];
          const toKey = toMatch[1];
          
          if (!nodes.has(fromKey)) registerNode(fromKey, fromKey, "[");
          if (!nodes.has(toKey)) registerNode(toKey, toKey, "[");
          
          connections.push({
            id: uid(),
            type: "connection",
            from: nodes.get(fromKey)!.id,
            to: nodes.get(toKey)!.id,
            color: "#1C1B1F",
            x: 0, y: 0
          });
        }
      }
    }
  }

  // 3. Layout Algorithm (Longest-path layering / Topological Sort)
  const layers = new Map<string, number>();
  for (const key of nodes.keys()) layers.set(key, 0);

  const nodeKeys = Array.from(nodes.keys());
  // Relax edges up to V times
  for (let i = 0; i < nodeKeys.length; i++) {
    let changed = false;
    for (const c of connections) {
      const fromKey = nodeKeys.find(k => nodes.get(k)!.id === c.from);
      const toKey = nodeKeys.find(k => nodes.get(k)!.id === c.to);
      if (fromKey && toKey) {
        if (layers.get(fromKey)! + 1 > layers.get(toKey)!) {
          layers.set(toKey, layers.get(fromKey)! + 1);
          changed = true;
        }
      }
    }
    if (!changed) break; // Reached stable DAG layout
  }
  
  // Group by layer
  let maxLayer = 0;
  for (const layer of layers.values()) {
    if (layer > maxLayer) maxLayer = layer;
  }
  
  const layerGroups: string[][] = [];
  for (let i = 0; i <= maxLayer; i++) layerGroups.push([]);
  for (const [key, layer] of layers.entries()) {
    if (layerGroups[layer]) layerGroups[layer].push(key);
  }

  const NODE_W = 160;
  const NODE_H = 80;
  const GAP_X = 80;
  const GAP_Y = 100;
  
  const els: El[] = [];

  for (let i = 0; i < layerGroups.length; i++) {
    const group = layerGroups[i];
    const totalW = group.length * NODE_W + (group.length - 1) * GAP_X;
    let currX = startX - totalW / 2;
    const currY = startY + i * (NODE_H + GAP_Y);
    
    for (const key of group) {
      const n = nodes.get(key)!;
      const shape: ShapeEl = {
        id: n.id,
        type: "shape",
        kind: n.kind,
        w: NODE_W, 
        h: NODE_H,
        color: "#3742FA",
        x: currX, 
        y: currY,
        text: n.text
      };
      els.push(shape);
      currX += NODE_W + GAP_X;
    }
  }

  // Append connections
  els.push(...connections);

  return els;
}
