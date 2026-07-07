import React, { useRef } from "react";
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
}

const DOUBLE_CLICK_MS = 400;

function TableNode({ el, selected, editingId, zoom, onBlur, onDblClick, onUpdate }: TableNodeProps) {
  const { x, y, rows, cols, cellW, cellH, data } = el;
  const w = cols * cellW;
  const h = rows * cellH;

  // Manual double-click tracking — the browser's native dblclick event
  // gets retargeted to the canvas wrapper once it captures the pointer
  // for dragging, so we can't rely on onDoubleClick here.
  const lastClickRef = useRef<{ cellId: string | null; time: number }>({ cellId: null, time: 0 });

  const handleGridResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startCols = cols;
    const startRows = rows;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== e.pointerId) return;

      const dX = (moveEvent.clientX - startX) / zoom;
      const dY = (moveEvent.clientY - startY) / zoom;

      const newCols = Math.max(1, startCols + Math.round(dX / cellW));
      const newRows = Math.max(1, startRows + Math.round(dY / cellH));

      if (newCols !== cols || newRows !== rows) {
        onUpdate(el.id, {
          cols: newCols,
          rows: newRows
        });
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== e.pointerId) return;

      try {
        target.releasePointerCapture(e.pointerId);
      } catch (err) {}

      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", onPointerUp);
    };

    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
  };

  // Runs on every cell pointerdown. Detects a "double click" ourselves via
  // timing, so it works regardless of whether the event gets retargeted.
  const handleCellPointerDown = (e: React.PointerEvent<HTMLDivElement>, cellId: string) => {
    const now = Date.now();
    const isDoubleClick =
      lastClickRef.current.cellId === cellId &&
      now - lastClickRef.current.time < DOUBLE_CLICK_MS;

    if (isDoubleClick) {
      // This click completes a double-click on the same cell — enter edit mode.
      // Stop it here so the canvas doesn't also start a fresh drag/select.
      e.stopPropagation();
      e.preventDefault();
      onDblClick(cellId);
      lastClickRef.current = { cellId: null, time: 0 };
    } else {
      // First click — remember it, but let it bubble up so the canvas's
      // normal select/drag logic still engages (whole-table dragging).
      lastClickRef.current = { cellId, time: now };
    }
  };

  return (
    <div
      data-el-id={el.id}
      className="absolute group"
      style={{ left: x, top: y, width: w, height: h, cursor: "grab" }}
    >
      <div
        className="absolute inset-0 bg-white border-2 border-gray-300 rounded overflow-hidden flex flex-col shadow-sm"
        style={{ boxShadow: selected ? "0 0 0 2px #3742FA" : undefined }}
      >
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex flex-1 w-full border-b border-gray-200 last:border-b-0">
            {Array.from({ length: cols }).map((_, c) => {
              const cellId = `${el.id}-${r}-${c}`;
              const isEditing = editingId === cellId;
              const cellText = data[`${r},${c}`] || "";

              return (
                <div
                  key={c}
                  className="flex-1 border-r border-gray-200 last:border-r-0 relative flex items-center justify-center p-1.5 hover:bg-gray-50/80 transition-colors"
                  onPointerDown={(e) => {
                    if (isEditing) return; // let the input handle its own pointer events
                    handleCellPointerDown(e, cellId);
                  }}
                  style={{ width: cellW, height: cellH }}
                >
                  {isEditing ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <CellEditor
                        cellId={cellId}
                        cellText={cellText}
                        onBlur={onBlur}
                      />
                    </div>
                  ) : (
                    <div className="w-full text-sm text-center font-medium overflow-hidden whitespace-pre-wrap text-gray-900 break-words pointer-events-none select-none px-1">
                      {cellText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selected && !editingId && (
        <div
          onPointerDown={handleGridResizePointerDown}
          className="absolute flex items-center justify-center z-20 transition-transform hover:scale-110 active:scale-95"
          style={{
            right: -8,
            bottom: -8,
            width: 20,
            height: 20,
            cursor: "cell",
            touchAction: "none",
          }}
          title="Drag down to add rows, drag right to add columns"
        >
          <div className="w-4 h-4 rounded-full bg-[#3742FA] shadow-md border border-white flex items-center justify-center relative">
            <div className="absolute w-2 h-0.5 bg-white rounded-sm" />
            <div className="absolute h-2 w-0.5 bg-white rounded-sm" />
          </div>
        </div>
      )}
    </div>
  );
}

export default TableNode;



