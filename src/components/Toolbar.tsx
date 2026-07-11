import React, { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { 
  Trash2, Minus, Plus, Pencil, Brush, Highlighter, Search, X, Smile
} from "lucide-react";

import type { PenThickness, PenType, ShapeKind, Tool } from "../types";
import { STICKY_COLORS, SHAPE_COLORS, PEN_COLORS, TOOLS, SHAPE_KINDS } from "../constants";
import ColorPalette from "./ColorPalette";
import { useWorkspaceTheme } from "../contexts/WorkspaceThemeContext";

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
  onInsertIcon?: (iconName: string) => void;
}

// Exports from lucide-react that aren't actual icon components —
// filter these out so search results only contain real icons.
const NON_ICON_EXPORTS = new Set([
  "createLucideIcon",
  "default",
  "icons",
  "LucideIcon",
  "LucideProps",
]);

// Build the full icon catalog once, at module load — not on every render.
// Splits "CupSoda" -> "cup soda" so searches match readable words.
const ALL_ICONS: { name: string; Icon: React.ComponentType<{ size?: number }>; searchText: string }[] =
  Object.entries(LucideIcons)
    .filter(([name, value]) => !NON_ICON_EXPORTS.has(name) && typeof value === "object" && /^[A-Z]/.test(name))
    .map(([name, Icon]) => {
      const words = name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
      return { name, Icon: Icon as React.ComponentType<{ size?: number }>, searchText: words };
    });

const MAX_RESULTS = 60; // cap rendered results for performance on broad/empty queries

function Toolbar({
  tool, setTool, onZoom, zoomLevel,
  stickyColor, setStickyColor,
  shapeColor, setShapeColor, shapeKind, setShapeKind,
  penColor, setPenColor,
  penType, setPenType,
  penThickness, setPenThickness,
  toolMenuOpen, setToolMenuOpen,
  onDelete, hasSelection,
  onInsertIcon,
}: ToolbarProps) {
  const [iconSearchOpen, setIconSearchOpen] = useState(false);
  const [iconQuery, setIconQuery] = useState("");
  const { layout } = useWorkspaceTheme();
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setIconSearchOpen(false);
        setToolMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIconSearchOpen(false);
        setToolMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [setToolMenuOpen]);

  const palette =
    tool === "sticky" ? { colors: STICKY_COLORS, active: stickyColor, set: setStickyColor } :
      tool === "shape" ? { colors: SHAPE_COLORS, active: shapeColor, set: setShapeColor } :
        tool === "pen" ? { colors: PEN_COLORS, active: penColor, set: setPenColor } : null;

  const filteredIcons = useMemo(() => {
    const q = iconQuery.trim().toLowerCase();
    if (!q) return ALL_ICONS.slice(0, MAX_RESULTS);
    const matches = ALL_ICONS.filter((entry) => entry.searchText.includes(q));
    return matches.slice(0, MAX_RESULTS);
  }, [iconQuery]);

  // Define layout styles
  let containerClass = "";
  let innerClass = "";
  let itemGroupClass = "";
  let dividerClass = "";

  if (layout === "horizontal") {
    containerClass = "absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-50";
    innerClass = "flex flex-col gap-2 items-center pointer-events-auto";
    itemGroupClass = "flex items-center gap-1 bg-card rounded-full px-2.5 py-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border pointer-events-auto";
    dividerClass = "w-px h-5 bg-gray-200 mx-1.5";
  } else if (layout === "vertical") {
    containerClass = "absolute left-4 top-20 flex flex-row-reverse items-center gap-2 pointer-events-none z-50";
    innerClass = "flex flex-row-reverse gap-2 items-center pointer-events-auto";
    itemGroupClass = "flex flex-col items-center gap-1 bg-card rounded-full px-1.5 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border pointer-events-auto";
    dividerClass = "w-5 h-px bg-gray-200 my-1.5";
  }

  return (
    <div ref={toolbarRef} className={containerClass}>
      <div className={innerClass}>
        {/* Pen picker */}
        {tool === "pen" && toolMenuOpen && (
          <div className="flex flex-col p-2.5 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border gap-2 mb-1">
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
                      ? "bg-muted shadow-inner scale-95"
                      : "hover:bg-background"
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
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${penThickness === t.thick ? "bg-gray-800 text-white" : "bg-muted text-muted-foreground hover:bg-gray-200"
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
          <div className="flex flex-col p-2.5 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border">
            <div className="text-[10px] font-bold text-gray-400 mb-2 px-1.5 uppercase tracking-wider">Shapes</div>
            <div className="grid grid-cols-3 gap-1.5">
              {SHAPE_KINDS.map(({ kind, label, icon }) => (
                <button
                  key={kind}
                  title={label}
                  onClick={() => setShapeKind(kind)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${shapeKind === kind
                    ? "bg-[#3742FA] text-white shadow-md scale-105"
                    : "text-[#4B5563] hover:bg-muted hover:text-foreground"
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


        {/* Icon search picker — searches the full lucide-react library */}
        {iconSearchOpen && (
          <div className="flex flex-col p-2.5 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border w-80 mb-1">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={iconQuery}
                onChange={(e) => setIconQuery(e.target.value)}
                placeholder="Search 1000+ icons (e.g. cup, mobile, smiley)"
                className="flex-1 text-xs outline-none text-foreground placeholder:text-gray-400"
              />
              <button
                onClick={() => {
                  setIconSearchOpen(false);
                  setIconQuery("");
                }}
                className="text-gray-400 hover:text-muted-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredIcons.length === 0 ? (
                <div className="col-span-7 text-center text-[11px] text-gray-400 py-4">
                  No icons found
                </div>
              ) : (
                filteredIcons.map(({ name, Icon }) => (
                  <button
                    key={name}
                    title={name}
                    onClick={() => {
                      onInsertIcon?.(name);
                      setIconSearchOpen(false);
                      setIconQuery("");
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-[#4B5563] hover:bg-muted hover:text-foreground transition-all"
                  >
                    <Icon size={17} />
                  </button>
                ))
              )}
            </div>
            {!iconQuery && (
              <div className="text-[10px] text-gray-400 text-center mt-2">
                Showing first {MAX_RESULTS} icons — type to search all
              </div>
            )}
          </div>
        )}

      </div>

      <div className={itemGroupClass}>
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
              setIconSearchOpen(false);
            }}
            className={`
              w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200
              ${tool === id
                ? "bg-[#3742FA] text-white shadow-md scale-[1.02]"
                : "text-[#4B5563] hover:bg-muted hover:text-foreground"}
            `}
          >
            {icon}
          </button>
        ))}

        <div className={dividerClass} />

        {/* Icon search toggle button */}
        <button
          title="Insert icon"
          onClick={() => {
            setIconSearchOpen((prev) => !prev);
            setToolMenuOpen(false);
          }}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${iconSearchOpen
              ? "bg-[#3742FA] text-white shadow-md scale-[1.02]"
              : "text-[#4B5563] hover:bg-muted hover:text-foreground"
            }`}
        >
          <Smile size={18} />
        </button>

        <div className={dividerClass} />

        {hasSelection && (
          <>
            <button
              onClick={onDelete}
              title="Delete selected (Del)"
              className="w-9 h-9 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 size={18} />
            </button>
            <div className={dividerClass} />
          </>
        )}

        <button
          onClick={() => onZoom(-1)}
          title="Zoom out"
          className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Minus size={16} />
        </button>
        <div
          className={`text-xs font-medium text-[#4B5563] text-center cursor-pointer hover:text-foreground flex items-center justify-center ${
            layout === "horizontal" ? "px-1.5 min-w-[44px]" : "py-1.5 min-h-[44px] w-9"
          }`}
          title="Reset zoom"
          onClick={() => {/* handled outside */ }}
        >
          {Math.round(zoomLevel * 100)}%
        </div>
        <button
          onClick={() => onZoom(1)}
          title="Zoom in"
          className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

export default Toolbar;





// import React from "react";
// import { Trash2, Minus, Plus, Pencil, Brush, Highlighter } from "lucide-react";
// import type { PenThickness, PenType, ShapeKind, Tool } from "../types";
// import { STICKY_COLORS, SHAPE_COLORS, PEN_COLORS, TOOLS, SHAPE_KINDS } from "../constants";
// import ColorPalette from "./ColorPalette";

// interface ToolbarProps {
//   tool: Tool;
//   setTool: (t: Tool) => void;
//   onZoom: (dir: number) => void;
//   zoomLevel: number;
//   stickyColor: string;
//   setStickyColor: (c: string) => void;
//   shapeColor: string;
//   setShapeColor: (c: string) => void;
//   shapeKind: ShapeKind;
//   setShapeKind: (k: ShapeKind) => void;
//   penColor: string;
//   setPenColor: (c: string) => void;
//   penType: PenType;
//   setPenType: (t: PenType) => void;
//   penThickness: PenThickness;
//   setPenThickness: (t: PenThickness) => void;
//   toolMenuOpen: boolean;
//   setToolMenuOpen: (o: boolean) => void;
//   onDelete: () => void;
//   hasSelection: boolean;
// }

// function Toolbar({
//   tool, setTool, onZoom, zoomLevel,
//   stickyColor, setStickyColor,
//   shapeColor, setShapeColor, shapeKind, setShapeKind,
//   penColor, setPenColor,
//   penType, setPenType,
//   penThickness, setPenThickness,
//   toolMenuOpen, setToolMenuOpen,
//   onDelete, hasSelection,
// }: ToolbarProps) {
//   const palette =
//     tool === "sticky" ? { colors: STICKY_COLORS, active: stickyColor, set: setStickyColor } :
//       tool === "shape" ? { colors: SHAPE_COLORS, active: shapeColor, set: setShapeColor } :
//         tool === "pen" ? { colors: PEN_COLORS, active: penColor, set: setPenColor } : null;

//   return (
//     <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-50">
//       <div className="flex flex-col gap-2 items-center pointer-events-auto">
//         {/* Pen picker */}
//         {tool === "pen" && toolMenuOpen && (
//           <div className="flex flex-col p-2.5 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border gap-2 mb-1">
//             <div>
//               <div className="text-[10px] font-bold text-gray-400 mb-2 px-1.5 uppercase tracking-wider">Style</div>
//               <div className="grid grid-cols-3 gap-1.5">
//                 {[
//                   { type: "pen", icon: <Pencil size={18} />, color: "text-blue-500", label: "Pen" },
//                   { type: "marker", icon: <Brush size={18} />, color: "text-purple-500", label: "Marker" },
//                   { type: "highlighter", icon: <Highlighter size={18} />, color: "text-yellow-500", label: "Highlighter" },
//                 ].map(t => (
//                   <button
//                     key={t.type}
//                     title={t.label}
//                     onClick={() => setPenType(t.type as PenType)}
//                     className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${penType === t.type
//                         ? "bg-muted shadow-inner scale-95"
//                         : "hover:bg-background"
//                       } ${t.color}`}
//                   >
//                     {t.icon}
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <div>
//               <div className="text-[10px] font-bold text-gray-400 mb-2 px-1.5 uppercase tracking-wider">Thickness</div>
//               <div className="flex gap-1.5">
//                 {[
//                   { thick: "thin", label: "Thin" },
//                   { thick: "thick", label: "Thick" },
//                 ].map(t => (
//                   <button
//                     key={t.thick}
//                     onClick={() => setPenThickness(t.thick as PenThickness)}
//                     className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${penThickness === t.thick ? "bg-gray-800 text-white" : "bg-muted text-muted-foreground hover:bg-gray-200"
//                       }`}
//                   >
//                     {t.label}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Shape kind picker */}
//         {tool === "shape" && toolMenuOpen && (
//           <div className="flex flex-col p-2.5 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border">
//             <div className="text-[10px] font-bold text-gray-400 mb-2 px-1.5 uppercase tracking-wider">Shapes</div>
//             <div className="grid grid-cols-3 gap-1.5">
//               {SHAPE_KINDS.map(({ kind, label, icon }) => (
//                 <button
//                   key={kind}
//                   title={label}
//                   onClick={() => setShapeKind(kind)}
//                   className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${shapeKind === kind
//                       ? "bg-[#3742FA] text-white shadow-md scale-105"
//                       : "text-[#4B5563] hover:bg-muted hover:text-foreground"
//                     }`}
//                 >
//                   {icon}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {palette && toolMenuOpen && (
//           <div>
//             <ColorPalette colors={palette.colors} active={palette.active} onPick={palette.set} />
//           </div>
//         )}
//       </div>

//       <div className="flex items-center gap-1.5 bg-card rounded-full px-3 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border pointer-events-auto">
//         {TOOLS.map(({ id, label, key, icon }) => (
//           <button
//             key={id}
//             title={`${label} (${key})`}
//             onClick={() => {
//               if (id === tool) {
//                 setToolMenuOpen(!toolMenuOpen);
//               } else {
//                 setTool(id as Tool);
//                 if (id === "pen" || id === "shape" || id === "sticky") {
//                   setToolMenuOpen(true);
//                 } else {
//                   setToolMenuOpen(false);
//                 }
//               }
//             }}
//             className={`
//               w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200
//               ${tool === id
//                 ? "bg-[#3742FA] text-white shadow-md scale-[1.02]"
//                 : "text-[#4B5563] hover:bg-muted hover:text-foreground"}
//             `}
//           >
//             {icon}
//           </button>
//         ))}

//         <div className="w-px h-6 bg-gray-200 mx-2" />

//         {hasSelection && (
//           <>
//             <button
//               onClick={onDelete}
//               title="Delete selected (Del)"
//               className="w-10 h-10 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
//             >
//               <Trash2 size={18} />
//             </button>
//             <div className="w-px h-6 bg-gray-200 mx-2" />
//           </>
//         )}

//         <button
//           onClick={() => onZoom(-1)}
//           title="Zoom out"
//           className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
//         >
//           <Minus size={16} />
//         </button>
//         <div
//           className="px-2 text-xs font-medium text-[#4B5563] min-w-[48px] text-center cursor-pointer hover:text-foreground"
//           title="Reset zoom"
//           onClick={() => {/* handled outside */ }}
//         >
//           {Math.round(zoomLevel * 100)}%
//         </div>
//         <button
//           onClick={() => onZoom(1)}
//           title="Zoom in"
//           className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
//         >
//           <Plus size={16} />
//         </button>
//       </div>
//     </div>
//   );
// }

// export default Toolbar;
