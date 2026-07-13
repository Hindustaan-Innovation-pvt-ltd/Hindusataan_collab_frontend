import React, { useRef, useMemo } from "react";
import type { TableEl } from "../types";
import CellEditor from "./CellEditor";

interface TableNodeProps {
  el: TableEl;
  selected: boolean;
  editingId: string | null;
  zoom: number;
  onBlur: (id: string, text: string) => void;
  onDblClick: (id: string) => void;
  onUpdate: (id: string, partial: Partial<TableEl>) => void;
  selectedCellId?: string | null;
  onSelectCell?: (cellId: string | null) => void;
}

const DOUBLE_CLICK_MS = 400;
const MIN_CELL_W = 40;
const MIN_CELL_H = 20;

export default function TableNode({ 
  el, selected, editingId, zoom, onBlur, onDblClick, onUpdate,
  selectedCellId, onSelectCell
}: TableNodeProps) {
  const { x, y, rows, cols, rowHeights = {}, colWidths = {}, cells = {}, color, headerRow, altRowColors } = el;
  
  // Calculate total width and height
  const w = useMemo(() => Array.from({length: cols}).reduce((sum: number, _, c) => sum + (colWidths[c] || 120), 0), [cols, colWidths]);
  const h = useMemo(() => Array.from({length: rows}).reduce((sum: number, _, r) => sum + (rowHeights[r] || 40), 0), [rows, rowHeights]);

  const lastClickRef = useRef<{ cellId: string | null; time: number }>({ cellId: null, time: 0 });

  const handleCellPointerDown = (e: React.PointerEvent<HTMLDivElement>, cellId: string) => {
    const now = Date.now();
    const isDoubleClick =
      lastClickRef.current.cellId === cellId &&
      now - lastClickRef.current.time < DOUBLE_CLICK_MS;

    if (isDoubleClick) {
      e.stopPropagation();
      e.preventDefault();
      onDblClick(cellId);
      lastClickRef.current = { cellId: null, time: 0 };
    } else {
      lastClickRef.current = { cellId, time: now };
      if (onSelectCell) {
        onSelectCell(cellId);
      }
    }
  };

  // Resizing Rows
  const handleRowResizeStart = (e: React.PointerEvent, r: number) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    
    const startY = e.clientY;
    const startH = rowHeights[r] || 40;

    const onMove = (e: Event) => {
      const me = e as PointerEvent;
      const dy = (me.clientY - startY) / zoom;
      const newH = Math.max(MIN_CELL_H, startH + dy);
      onUpdate(el.id, {
        rowHeights: { ...rowHeights, [r]: newH }
      });
    };

    const onUp = () => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
    };

    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  };

  // Resizing Cols
  const handleColResizeStart = (e: React.PointerEvent, c: number) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    
    const startX = e.clientX;
    const startW = colWidths[c] || 120;

    const onMove = (e: Event) => {
      const me = e as PointerEvent;
      const dx = (me.clientX - startX) / zoom;
      const newW = Math.max(MIN_CELL_W, startW + dx);
      onUpdate(el.id, {
        colWidths: { ...colWidths, [c]: newW }
      });
    };

    const onUp = () => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
    };

    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  };

  // Grid sizing overall (bottom right corner)
  const handleGridResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startCols = cols;
    const startRows = rows;
    
    // avg current widths
    const avgW = w / cols;
    const avgH = h / rows;

    const onPointerMove = (e: Event) => {
      const moveEvent = e as PointerEvent;
      const dX = (moveEvent.clientX - startX) / zoom;
      const dY = (moveEvent.clientY - startY) / zoom;

      const newCols = Math.max(1, startCols + Math.round(dX / avgW));
      const newRows = Math.max(1, startRows + Math.round(dY / avgH));

      if (newCols !== cols || newRows !== rows) {
        onUpdate(el.id, { cols: newCols, rows: newRows });
      }
    };

    const onPointerUp = () => {
      try { target.releasePointerCapture(e.pointerId); } catch (err) {}
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", onPointerUp);
    };

    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div
      data-el-id={el.id}
      className="absolute group"
      style={{ left: x, top: y, width: w, height: h, cursor: "grab" }}
    >
      <div
        className="absolute inset-0 rounded flex flex-col shadow-sm"
        style={{ 
          boxShadow: selected ? "0 0 0 2.5px #3742FA" : "0 0 0 1.5px var(--color-border)",
          backgroundColor: color || "var(--color-card)",
          borderCollapse: "collapse",
          overflow: "hidden"
        }}
      >
        {Array.from({ length: rows }).map((_, r) => {
          const isHeader = headerRow && r === 0;
          const isAlt = altRowColors && !isHeader && r % 2 === 1;
          const rH = rowHeights[r] || 40;

          return (
            <div key={r} className="flex w-full relative" style={{ height: rH }}>
              {Array.from({ length: cols }).map((_, c) => {
                const cellId = `${el.id}-${r}-${c}`;
                const isEditing = editingId === cellId;
                const cellData = cells[`${r},${c}`] || { text: "" };
                const cW = colWidths[c] || 120;
                const isSelected = selectedCellId === cellId;

                let bg = cellData.bg;
                if (!bg) {
                  if (isHeader) bg = "var(--color-muted)";
                  else if (isAlt) bg = "rgba(0,0,0,0.02)";
                  else bg = "transparent";
                }

                return (
                  <div
                    key={c}
                    className="relative flex items-center p-1.5 transition-colors"
                    onPointerDown={(e) => {
                      if (isEditing) return;
                      handleCellPointerDown(e, cellId);
                    }}
                    style={{ 
                      width: cW, 
                      height: rH,
                      backgroundColor: bg,
                      borderRight: c < cols - 1 ? "1.5px solid var(--color-border)" : "none",
                      borderBottom: r < rows - 1 ? "1.5px solid var(--color-border)" : "none",
                      boxShadow: isSelected ? "inset 0 0 0 2px #3742FA" : undefined,
                      justifyContent: cellData.align === "center" ? "center" : cellData.align === "right" ? "flex-end" : "flex-start",
                      alignItems: cellData.vAlign === "bottom" ? "flex-end" : cellData.vAlign === "top" ? "flex-start" : "center",
                    }}
                  >
                    {isEditing ? (
                      <div className="w-full h-full flex items-center" style={{
                        justifyContent: cellData.align === "center" ? "center" : cellData.align === "right" ? "flex-end" : "flex-start"
                      }}>
                        <CellEditor cellId={cellId} cellText={cellData.text} onBlur={onBlur} />
                      </div>
                    ) : (
                      <div 
                        className="w-full text-sm font-medium overflow-hidden whitespace-pre-wrap text-foreground break-words pointer-events-none select-none px-1"
                        style={{
                          textAlign: cellData.align || (isHeader ? "center" : "left"),
                          fontWeight: cellData.fontBold || isHeader ? 700 : 500,
                          fontStyle: cellData.fontItalic ? "italic" : "normal",
                        }}
                      >
                        {cellData.text}
                      </div>
                    )}

                    {/* Col Resize Handle */}
                    {selected && !editingId && c < cols - 1 && (
                      <div
                        onPointerDown={(e) => handleColResizeStart(e, c)}
                        className="absolute right-[-4px] top-0 bottom-0 w-[8px] cursor-col-resize z-10 hover:bg-[#3742FA]"
                      />
                    )}
                  </div>
                );
              })}

              {/* Row Resize Handle */}
              {selected && !editingId && r < rows - 1 && (
                <div
                  onPointerDown={(e) => handleRowResizeStart(e, r)}
                  className="absolute bottom-[-4px] left-0 right-0 h-[8px] cursor-row-resize z-10 hover:bg-[#3742FA]"
                />
              )}
            </div>
          );
        })}
      </div>

      {selected && !editingId && (
        <div
          onPointerDown={handleGridResizePointerDown}
          className="absolute flex items-center justify-center z-20 transition-transform hover:scale-110 active:scale-95"
          style={{ right: -8, bottom: -8, width: 20, height: 20, cursor: "cell", touchAction: "none" }}
        >
          <div className="w-2.5 h-2.5 bg-[#3742FA] rounded-full shadow-sm border border-white" />
        </div>
      )}
    </div>
  );
}
