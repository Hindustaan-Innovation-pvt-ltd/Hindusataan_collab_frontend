import { useState } from "react";
import type { TableEl, TableCell } from "../types";
import { AlignLeft, AlignCenter, AlignRight, Columns, Rows, Trash2, X } from "lucide-react";
import ColorPalette from "./ColorPalette";
import { TABLE_COLORS } from "../constants";

interface TableFormattingMenuProps {
  el: TableEl;
  selectedCellId: string | null;
  onUpdateTable: (id: string, partial: Partial<TableEl>) => void;
  onUpdateCell: (id: string, cellId: string, partial: Partial<TableCell>) => void;
  onAddRow: (id: string) => void;
  onAddCol: (id: string) => void;
  onDeleteRow: (id: string, rowIndex: number) => void;
  onDeleteCol: (id: string, colIndex: number) => void;
  onClose?: () => void;
}

function TableFormattingMenu({
  el,
  selectedCellId,
  onUpdateTable,
  onUpdateCell,
  onAddRow,
  onAddCol,
  onDeleteRow,
  onDeleteCol,
  onClose
}: TableFormattingMenuProps) {
  const [activeTab, setActiveTab] = useState<"table" | "cell">("table");

  // We can derive row and col from selectedCellId (e.g. "tableId-r-c")
  const parts = selectedCellId ? selectedCellId.split("-").slice(-2) : [null, null];
  const rStr = parts[0];
  const cStr = parts[1];
  const rowIndex = rStr ? parseInt(rStr, 10) : null;
  const colIndex = cStr ? parseInt(cStr, 10) : null;

  const currentCell = (rowIndex !== null && colIndex !== null && el.cells) ? el.cells[`${rowIndex},${colIndex}`] : null;

  return (
    <div 
      className="flex flex-col bg-card rounded-2xl shadow-xl border border-border overflow-hidden pointer-events-auto min-w-[280px]"
      onPointerDown={(e) => e.stopPropagation()} // Stop propagation so we don't deselect table
    >
      <div className="flex border-b border-border items-center">
        <button
          onClick={() => setActiveTab("table")}
          className={`flex-1 py-2 text-xs font-semibold ${activeTab === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
        >
          Table
        </button>
        <button
          onClick={() => setActiveTab("cell")}
          disabled={!selectedCellId}
          className={`flex-1 py-2 text-xs font-semibold ${!selectedCellId ? "opacity-50 cursor-not-allowed" : activeTab === "cell" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
        >
          Cell
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="p-3 flex flex-col gap-3 max-h-[300px] overflow-y-auto">
        {activeTab === "table" && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Style</span>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!el.headerRow}
                  onChange={(e) => onUpdateTable(el.id, { headerRow: e.target.checked })}
                  className="rounded border-border text-[#3742FA] focus:ring-[#3742FA]"
                />
                Header Row
              </label>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!el.altRowColors}
                  onChange={(e) => onUpdateTable(el.id, { altRowColors: e.target.checked })}
                  className="rounded border-border text-[#3742FA] focus:ring-[#3742FA]"
                />
                Alternate Row Colors
              </label>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Border Color</span>
              <ColorPalette
                colors={TABLE_COLORS}
                active={el.color || TABLE_COLORS[0]}
                onPick={(c) => onUpdateTable(el.id, { color: c })}
              />
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Structure</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onAddRow(el.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg bg-muted hover:bg-gray-200 transition-colors"
                >
                  <Rows size={14} /> Add Row
                </button>
                <button
                  onClick={() => onAddCol(el.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg bg-muted hover:bg-gray-200 transition-colors"
                >
                  <Columns size={14} /> Add Col
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === "cell" && rowIndex !== null && colIndex !== null && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alignment</span>
              <div className="flex gap-1.5">
                {(["left", "center", "right"] as const).map(a => (
                  <button
                    key={a}
                    onClick={() => onUpdateCell(el.id, `${rowIndex},${colIndex}`, { align: a })}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-colors ${currentCell?.align === a ? "bg-gray-800 text-white" : "bg-muted text-muted-foreground hover:bg-gray-200"}`}
                  >
                    {a === "left" && <AlignLeft size={14} />}
                    {a === "center" && <AlignCenter size={14} />}
                    {a === "right" && <AlignRight size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Background</span>
              <ColorPalette
                colors={["transparent", ...TABLE_COLORS.slice(0, 5)]}
                active={currentCell?.bg || "transparent"}
                onPick={(c) => onUpdateCell(el.id, `${rowIndex},${colIndex}`, { bg: c === "transparent" ? undefined : c })}
              />
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onDeleteRow(el.id, rowIndex)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={14} /> Del Row
                </button>
                <button
                  onClick={() => onDeleteCol(el.id, colIndex)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={14} /> Del Col
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TableFormattingMenu;
