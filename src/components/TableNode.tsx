import React from "react";
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

function TableNode({ el, selected, editingId, zoom, onBlur, onDblClick, onUpdate }: TableNodeProps) {
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

export default TableNode;
