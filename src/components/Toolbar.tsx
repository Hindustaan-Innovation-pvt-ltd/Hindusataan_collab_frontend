import React from "react";
import { Trash2, Minus, Plus, Pencil, Brush, Highlighter } from "lucide-react";
import type { PenThickness, PenType, ShapeKind, Tool } from "../types";
import { STICKY_COLORS, SHAPE_COLORS, PEN_COLORS, TOOLS, SHAPE_KINDS } from "../constants";
import ColorPalette from "./ColorPalette";

interface ToolbarProps {
  tool: Tool;
  setTool: (t: Tool) => void;
  onZoom: (dir: number) => void;
  zoomLevel: number;
  stickyColor: string;
  setStickyColor: (c: string) => void;
  shapeColor: string;
  setShapeColor: (c: string) => void;
  shapeKind: ShapeKind;
  setShapeKind: (k: ShapeKind) => void;
  penColor: string;
  setPenColor: (c: string) => void;
  penType: PenType;
  setPenType: (t: PenType) => void;
  penThickness: PenThickness;
  setPenThickness: (t: PenThickness) => void;
  toolMenuOpen: boolean;
  setToolMenuOpen: (o: boolean) => void;
  onDelete: () => void;
  hasSelection: boolean;
}

function Toolbar({
  tool, setTool, onZoom, zoomLevel,
  stickyColor, setStickyColor,
  shapeColor, setShapeColor, shapeKind, setShapeKind,
  penColor, setPenColor,
  penType, setPenType,
  penThickness, setPenThickness,
  toolMenuOpen, setToolMenuOpen,
  onDelete, hasSelection,
}: ToolbarProps) {
  const palette =
    tool === "sticky" ? { colors: STICKY_COLORS, active: stickyColor, set: setStickyColor } :
      tool === "shape" ? { colors: SHAPE_COLORS, active: shapeColor, set: setShapeColor } :
        tool === "pen" ? { colors: PEN_COLORS, active: penColor, set: setPenColor } : null;

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-50">
      <div className="flex flex-col gap-2 items-center pointer-events-auto">
        {/* Pen picker */}
        {tool === "pen" && toolMenuOpen && (
          <div className="flex flex-col p-2.5 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 gap-2 mb-1">
            <div>
              <div className="text-[10px] font-bold text-gray-400 mb-2 px-1.5 uppercase tracking-wider">Style</div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { type: "pen", icon: <Pencil size={18} />, color: "text-blue-500", label: "Pen" },
                  { type: "marker", icon: <Brush size={18} />, color: "text-purple-500", label: "Marker" },
                  { type: "highlighter", icon: <Highlighter size={18} />, color: "text-yellow-500", label: "Highlighter" },
                ].map(t => (
                  <button
                    key={t.type}
                    title={t.label}
                    onClick={() => setPenType(t.type as PenType)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${penType === t.type
                        ? "bg-gray-100 shadow-inner scale-95"
                        : "hover:bg-gray-50"
                      } ${t.color}`}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 mb-2 px-1.5 uppercase tracking-wider">Thickness</div>
              <div className="flex gap-1.5">
                {[
                  { thick: "thin", label: "Thin" },
                  { thick: "thick", label: "Thick" },
                ].map(t => (
                  <button
                    key={t.thick}
                    onClick={() => setPenThickness(t.thick as PenThickness)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${penThickness === t.thick ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Shape kind picker */}
        {tool === "shape" && toolMenuOpen && (
          <div className="flex flex-col p-2.5 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 mb-2 px-1.5 uppercase tracking-wider">Shapes</div>
            <div className="grid grid-cols-3 gap-1.5">
              {SHAPE_KINDS.map(({ kind, label, icon }) => (
                <button
                  key={kind}
                  title={label}
                  onClick={() => setShapeKind(kind)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${shapeKind === kind
                      ? "bg-[#3742FA] text-white shadow-md scale-105"
                      : "text-[#4B5563] hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        )}

        {palette && toolMenuOpen && (
          <div>
            <ColorPalette colors={palette.colors} active={palette.active} onPick={palette.set} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 pointer-events-auto">
        {TOOLS.map(({ id, label, key, icon }) => (
          <button
            key={id}
            title={`${label} (${key})`}
            onClick={() => {
              if (id === tool) {
                setToolMenuOpen(!toolMenuOpen);
              } else {
                setTool(id as Tool);
                if (id === "pen" || id === "shape" || id === "sticky") {
                  setToolMenuOpen(true);
                } else {
                  setToolMenuOpen(false);
                }
              }
            }}
            className={`
              w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200
              ${tool === id
                ? "bg-[#3742FA] text-white shadow-md scale-[1.02]"
                : "text-[#4B5563] hover:bg-gray-100 hover:text-gray-900"}
            `}
          >
            {icon}
          </button>
        ))}

        <div className="w-px h-6 bg-gray-200 mx-2" />

        {hasSelection && (
          <>
            <button
              onClick={onDelete}
              title="Delete selected (Del)"
              className="w-10 h-10 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 size={18} />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
          </>
        )}

        <button
          onClick={() => onZoom(-1)}
          title="Zoom out"
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Minus size={16} />
        </button>
        <div
          className="px-2 text-xs font-medium text-[#4B5563] min-w-[48px] text-center cursor-pointer hover:text-gray-900"
          title="Reset zoom"
          onClick={() => {/* handled outside */ }}
        >
          {Math.round(zoomLevel * 100)}%
        </div>
        <button
          onClick={() => onZoom(1)}
          title="Zoom in"
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
