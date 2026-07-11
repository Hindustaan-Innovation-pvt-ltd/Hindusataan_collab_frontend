import React, { useRef, useEffect } from "react";
import type { StickyEl } from "../types";
import ConnectionNodes from "./ConnectionNodes";

interface StickyNoteProps {
  el: StickyEl;
  selected: boolean;
  editing: boolean;
  zoom: number;
  onBlur: (id: string, text: string) => void;
  onDblClick: (id: string) => void;
  onStartConnect?: (e: React.PointerEvent, id: string) => void;
  onUpdate: (id: string, partial: Partial<StickyEl>) => void;
}

function StickyNote({
  el, selected, editing, zoom, onBlur, onDblClick, onStartConnect, onUpdate
}: StickyNoteProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const onDragHandle = (e: React.PointerEvent, corner: 'nw' | 'ne' | 'sw' | 'se') => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = el.w;
    const startH = el.h;
    const startElX = el.x;
    const startElY = el.y;

    const onMove = (me: PointerEvent) => {
      const dX = (me.clientX - startX) / zoom;
      const dY = (me.clientY - startY) / zoom;

      let newW = startW;
      let newH = startH;
      let newX = startElX;
      let newY = startElY;

      if (corner === 'se') {
        newW = Math.max(100, startW + dX);
        newH = Math.max(100, startH + dY);
      } else if (corner === 'sw') {
        newW = Math.max(100, startW - dX);
        newH = Math.max(100, startH + dY);
        newX = startElX + (startW - newW);
      } else if (corner === 'ne') {
        newW = Math.max(100, startW + dX);
        newH = Math.max(100, startH - dY);
        newY = startElY + (startH - newH);
      } else if (corner === 'nw') {
        newW = Math.max(100, startW - dX);
        newH = Math.max(100, startH - dY);
        newX = startElX + (startW - newW);
        newY = startElY + (startH - newH);
      }

      onUpdate(el.id, { w: newW, h: newH, x: newX, y: newY });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      data-el-id={el.id}
      onDoubleClick={(e) => { e.stopPropagation(); onDblClick(el.id); }}
      className="absolute rounded-sm select-none group"
      style={{
        left: el.x, top: el.y, width: el.w, height: el.h,
        backgroundColor: el.color,
        boxShadow: selected
          ? `0 0 0 2.5px #3742FA, 5px 8px 20px rgba(0,0,0,0.18)`
          : `5px 7px 18px rgba(0,0,0,0.12)`,
        cursor: editing ? "default" : "grab",
      }}
    >
      <ConnectionNodes id={el.id} w={el.w} h={el.h} selected={selected} onStartConnect={onStartConnect} />

      {/* Header strip */}
      <div
        className="h-7 flex items-center px-2.5 gap-1"
        style={{ backgroundColor: "rgba(0,0,0,0.07)" }}
      >
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.25)" }} />
        ))}
      </div>

      {editing ? (
        <textarea
          ref={ref}
          defaultValue={el.text}
          className="absolute inset-x-0 bottom-0 bg-transparent resize-none p-2.5 text-sm leading-relaxed text-foreground outline-none w-full"
          style={{ top: "1.75rem", fontFamily: "inherit", fontWeight: 500 }}
          onBlur={(e) => onBlur(el.id, e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="px-2.5 pb-2.5 pt-1.5 text-sm leading-relaxed text-foreground font-medium whitespace-pre-wrap break-words overflow-hidden"
          style={{ height: "calc(100% - 1.75rem)" }}
        >
          {el.text || (
            <span className="text-muted-foreground/60 text-xs italic">Double-click to edit…</span>
          )}
        </div>
      )}

      {selected && (
        <>
          <div className="absolute top-0 left-0 w-3.5 h-3.5 bg-card border-[2.5px] border-[#3742FA] rounded-sm -translate-x-1.5 -translate-y-1.5 cursor-nwse-resize z-20 hover:scale-125 transition-transform" onPointerDown={(e) => onDragHandle(e, 'nw')} />
          <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-card border-[2.5px] border-[#3742FA] rounded-sm translate-x-1.5 -translate-y-1.5 cursor-nesw-resize z-20 hover:scale-125 transition-transform" onPointerDown={(e) => onDragHandle(e, 'ne')} />
          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-card border-[2.5px] border-[#3742FA] rounded-sm -translate-x-1.5 translate-y-1.5 cursor-nesw-resize z-20 hover:scale-125 transition-transform" onPointerDown={(e) => onDragHandle(e, 'sw')} />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-card border-[2.5px] border-[#3742FA] rounded-sm translate-x-1.5 translate-y-1.5 cursor-nwse-resize z-20 hover:scale-125 transition-transform" onPointerDown={(e) => onDragHandle(e, 'se')} />
        </>
      )}
    </div>
  );
}

export default StickyNote;
