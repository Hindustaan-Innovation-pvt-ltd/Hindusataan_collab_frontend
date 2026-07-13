import React, { useState } from "react";
import {
  Trash2, Minus, Plus, Pencil, Brush, Highlighter, Smile, Image as ImageIcon, Loader2
} from "lucide-react";

import type { PenThickness, PenType, ShapeKind, Tool } from "../types";
import { STICKY_COLORS, SHAPE_COLORS, PEN_COLORS, TOOLS, SHAPE_KINDS } from "../constants";
import ColorPalette from "./ColorPalette";
import { useWorkspaceTheme } from "../contexts/WorkspaceThemeContext";

import QuickInsertPanel from './QuickInsertPanel';

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
  hasSelection: boolean;
  onDelete: () => void;
  onInsertIcon?: (iconName: string, sizeScale?: number) => void;
  onUploadImage?: (file: File) => Promise<void>;
  isUploadingImage?: boolean;
  isEditingOrSelectedText?: boolean;
  textFontSize?: number;
  setTextFontSize?: (size: number) => void;
  textFontFamily?: string;
  setTextFontFamily?: (family: string) => void;
  onInsertEmoji?: (emoji: string, sizeScale: number) => void;
  onInsertShape?: (kind: string, sizeScale: number) => void;
  onInsertDeviceFrame?: (kind: string, sizeScale: number) => void;
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
  onInsertIcon,
  onUploadImage,
  isUploadingImage,
  isEditingOrSelectedText = false,
  textFontSize = 20,
  setTextFontSize,
  textFontFamily = "sans-serif",
  setTextFontFamily,
  onInsertEmoji, onInsertShape, onInsertDeviceFrame,
}: ToolbarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [quickInsertOpen, setQuickInsertOpen] = useState(false);
  const { layout } = useWorkspaceTheme();

  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const quickInsertPanelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        toolbarRef.current && !toolbarRef.current.contains(target) &&
        (!panelRef.current || !panelRef.current.contains(target)) &&
        (!quickInsertPanelRef.current || !quickInsertPanelRef.current.contains(target))
      ) {
        setQuickInsertOpen(false);
        setToolMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQuickInsertOpen(false);
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

  // Define layout styles for the main toolbar
  let containerClass = "";
  let itemGroupClass = "";
  let dividerClass = "";

  if (layout === "horizontal") {
    containerClass = "absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center pointer-events-none z-50";
    itemGroupClass = "flex items-center gap-1 bg-card/95 backdrop-blur-md rounded-full p-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-border/80 pointer-events-auto";
    dividerClass = "w-px h-5 bg-border mx-1";
  } else if (layout === "vertical") {
    containerClass = "absolute left-4 top-20 flex items-center pointer-events-none z-50";
    itemGroupClass = "flex flex-col items-center gap-1 bg-card/95 backdrop-blur-md rounded-full p-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-border/80 pointer-events-auto";
    dividerClass = "w-5 h-px bg-border my-1";
  }

  // Side-panel positions so they do not block drawing space
  const panelPositionClass = layout === "horizontal"
    ? "fixed left-5 top-24 z-50 w-64"
    : "fixed left-20 top-24 z-50 w-64";

  const quickInsertPanelPositionClass = layout === "horizontal"
    ? "fixed left-5 top-24 z-50 w-80"
    : "fixed left-20 top-24 z-50 w-80";

  const showOptionsPanel = toolMenuOpen && (tool === "pen" || tool === "shape" || tool === "sticky" || isEditingOrSelectedText);

  return (
    <>
      <div ref={toolbarRef} className={containerClass}>
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
                  if (id === "pen" || id === "shape" || id === "sticky" || id === "text") {
                    setToolMenuOpen(true);
                  } else {
                    setToolMenuOpen(false);
                  }
                }
                setQuickInsertOpen(false);
              }}
              className={`
                w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer
                ${tool === id
                  ? "bg-[#3742FA] text-white shadow-md scale-[1.02]"
                  : "text-[#4B5563] hover:bg-muted hover:text-foreground"}
              `}
            >
              {icon}
            </button>
          ))}

          <div className={dividerClass} />

          {/* Quick Insert search toggle button (Smile icon) */}
          <button
            title="Quick Insert (Assets)"
            onClick={() => {
              setQuickInsertOpen((prev) => !prev);
              setToolMenuOpen(false);
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${quickInsertOpen
              ? "bg-[#3742FA] text-white shadow-md scale-[1.02]"
              : "text-[#4B5563] hover:bg-muted hover:text-foreground"
              }`}
          >
            <Smile size={18} />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
            onChange={async (e) => {
              if (e.target.files && e.target.files[0] && onUploadImage) {
                await onUploadImage(e.target.files[0]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }
            }}
          />
          <button
            title="Upload image"
            disabled={isUploadingImage}
            onClick={() => {
              fileInputRef.current?.click();
              setToolMenuOpen(false);
              setQuickInsertOpen(false);
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 text-[#4B5563] hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
          >
            {isUploadingImage ? <Loader2 size={18} className="animate-spin text-[#3742FA]" /> : <ImageIcon size={18} />}
          </button>

          <div className={dividerClass} />

          {hasSelection && (
            <>
              <button
                onClick={onDelete}
                title="Delete selected (Del)"
                className="w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
              <div className={dividerClass} />
            </>
          )}

          <button
            onClick={() => onZoom(-1)}
            title="Zoom out"
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <Minus size={16} />
          </button>
          <div
            className={`text-xs font-semibold text-[#4B5563] text-center cursor-pointer hover:text-foreground flex items-center justify-center ${layout === "horizontal" ? "px-1 min-w-[40px]" : "py-1 min-h-[40px] w-8"
              }`}
            title="Reset zoom"
            onClick={() => {/* handled outside */ }}
          >
            {Math.round(zoomLevel * 100)}%
          </div>
          <button
            onClick={() => onZoom(1)}
            title="Zoom in"
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Unified Tool Options Panel docked to the side */}
      {showOptionsPanel && (
        <div ref={panelRef} className={`flex flex-col p-4 bg-card/95 backdrop-blur-md rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] border border-border/80 gap-3.5 pointer-events-auto transition-all animate-in fade-in slide-in-from-left-2 duration-200 ${panelPositionClass}`}>

          {/* Pen Tool Settings */}
          {tool === "pen" && (
            <>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-2 px-1 uppercase tracking-wider">Draw Style</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { type: "pen", icon: <Pencil size={15} />, color: "text-blue-500", label: "Pen" },
                    { type: "marker", icon: <Brush size={15} />, color: "text-purple-500", label: "Marker" },
                    { type: "highlighter", icon: <Highlighter size={15} />, color: "text-yellow-600", label: "Highlight" },
                  ].map(t => (
                    <button
                      key={t.type}
                      title={t.label}
                      onClick={() => setPenType(t.type as PenType)}
                      className={`h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${penType === t.type
                        ? "bg-muted shadow-inner scale-95 border border-border"
                        : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                        } ${t.color}`}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-semibold">
                        {t.icon}
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-1.5 px-1 uppercase tracking-wider flex justify-between items-center">
                  <span>Thickness</span>
                  <span className="font-bold text-foreground bg-muted px-1.5 py-0.5 rounded text-[11px]">{penThickness}px</span>
                </div>
                <div className="flex items-center gap-2 px-1 py-1">
                  <input
                    type="range"
                    min={1}
                    max={penType === "highlighter" ? 60 : penType === "marker" ? 40 : 20}
                    value={penThickness}
                    onChange={(e) => setPenThickness(parseInt(e.target.value))}
                    className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-[#3742FA]"
                    style={{ accentColor: "#3742FA" }}
                  />
                </div>
              </div>

              <div className="h-px bg-border/60 my-0.5" />

              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-2 px-1 uppercase tracking-wider">Colors</div>
                <ColorPalette colors={PEN_COLORS} active={penColor} onPick={setPenColor} flat={true} />
              </div>
            </>
          )}

          {/* Shape Tool Settings */}
          {tool === "shape" && (
            <>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-2 px-1 uppercase tracking-wider">Shapes</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {SHAPE_KINDS.map(({ kind, label, icon }) => (
                    <button
                      key={kind}
                      title={label}
                      onClick={() => setShapeKind(kind)}
                      className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all cursor-pointer ${shapeKind === kind
                        ? "bg-[#3742FA] text-white shadow-md scale-105"
                        : "text-[#4B5563] hover:bg-muted hover:text-foreground"
                        }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border/60 my-0.5" />

              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-2 px-1 uppercase tracking-wider">Colors</div>
                <ColorPalette colors={SHAPE_COLORS} active={shapeColor} onPick={setShapeColor} flat={true} />
              </div>
            </>
          )}

          {/* Sticky Note Settings */}
          {tool === "sticky" && (
            <div>
              <div className="text-[10px] font-bold text-muted-foreground mb-2 px-1 uppercase tracking-wider">Sticky Colors</div>
              <ColorPalette colors={STICKY_COLORS} active={stickyColor} onPick={setStickyColor} flat={true} />
            </div>
          )}

          {/* Font Settings for Text Editing / Text Tool */}
          {isEditingOrSelectedText && (
            <>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-1.5 px-1 uppercase tracking-wider">Font Family</div>
                <div className="relative">
                  <select
                    value={textFontFamily}
                    onChange={(e) => setTextFontFamily?.(e.target.value)}
                    className="w-full h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#3742FA] appearance-none cursor-pointer pr-8"
                  >
                    <option value="sans-serif">Sans-Serif (Modern)</option>
                    <option value="serif">Serif (Classic)</option>
                    <option value="monospace">Monospace (Code)</option>
                    <option value="cursive">Cursive (Handwritten)</option>
                    <option value="'Outfit', sans-serif">Outfit (Geometric)</option>
                    <option value="'Playfair Display', serif">Playfair Display (Elegant Serif)</option>
                    <option value="'Poppins', sans-serif">Poppins (Clean Sans-Serif)</option>
                    <option value="'Lobster', cursive">Lobster (Vintage/Bold)</option>
                    <option value="'Pacifico', cursive">Pacifico (Smooth Handwriting)</option>
                    <option value="'Caveat', cursive">Caveat (Natural Pen)</option>
                    <option value="'Lora', serif">Lora (Classic Book Serif)</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[9px]">
                    ▼
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-1.5 px-1 uppercase tracking-wider">Font Size</div>
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => setTextFontSize?.(Math.max(10, textFontSize - 2))}
                    className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-background border border-border font-bold text-sm cursor-pointer transition-all active:scale-90"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={textFontSize}
                    onChange={(e) => setTextFontSize?.(Math.max(8, parseInt(e.target.value) || 20))}
                    className="w-20 h-8 text-center text-xs font-bold bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3742FA]"
                  />
                  <button
                    onClick={() => setTextFontSize?.(Math.min(120, textFontSize + 2))}
                    className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-background border border-border font-bold text-sm cursor-pointer transition-all active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      )}

      {/* Quick Insert Panel docked to the side */}
      {quickInsertOpen && (
        <div ref={quickInsertPanelRef} className={`absolute z-50 pointer-events-auto transition-all animate-in fade-in slide-in-from-left-2 duration-200 ${quickInsertPanelPositionClass}`}>
          <QuickInsertPanel
            onInsertIcon={(name: string) => { onInsertIcon?.(name); setQuickInsertOpen(false); }}
            onInsertEmoji={(emoji: string) => { onInsertEmoji?.(emoji, 1); setQuickInsertOpen(false); }}
            onInsertShape={(kind: string) => { onInsertShape?.(kind, 1); setQuickInsertOpen(false); }}
            onInsertDeviceFrame={(kind: string) => { onInsertDeviceFrame?.(kind, 1); setQuickInsertOpen(false); }}
            onClose={() => setQuickInsertOpen(false)}
          />
        </div>
      )}
    </>
  );
}

export default Toolbar;

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
