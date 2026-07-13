// import { useRef, useEffect } from "react";
// import type { TextEl } from "../types";

// interface TextNodeProps {
//   el: TextEl;
//   selected: boolean;
//   editing: boolean;
//   onBlur: (id: string, text: string) => void;
//   onDblClick: (id: string) => void;
// }

// function TextNode({ el, selected, editing, onBlur, onDblClick }: TextNodeProps) {
//   const ref = useRef<HTMLTextAreaElement>(null);
//   useEffect(() => {
//     if (editing) { ref.current?.focus(); ref.current?.select(); }
//   }, [editing]);

//   return (
//     <div
//       data-el-id={el.id}
//       onDoubleClick={(e) => { e.stopPropagation(); onDblClick(el.id); }}
//       className="absolute"
//       style={{
//         left: el.x, top: el.y,
//         outline: selected ? "2.5px solid #3742FA" : "2px dashed transparent",
//         outlineOffset: 6,
//         cursor: editing ? "text" : "grab",
//         borderRadius: 5,
//       }}
//     >
//       {editing ? (
//         <textarea
//           ref={ref}
//           defaultValue={el.text}
//           className="bg-transparent resize-none outline-none"
//           style={{
//             fontSize: el.fontSize, color: el.color,
//             fontFamily: "inherit", fontWeight: 600,
//             minWidth: 80, minHeight: el.fontSize * 1.6,
//             lineHeight: 1.4,
//           }}
//           onBlur={(e) => onBlur(el.id, e.target.value)}
//           onPointerDown={(e) => e.stopPropagation()}
//         />
//       ) : (
//         <div
//           className="font-semibold whitespace-pre"
//           style={{ fontSize: el.fontSize, color: el.color, lineHeight: 1.4 }}
//         >
//           {el.text}
//         </div>
//       )}
//     </div>
//   );
// }

// export default TextNode;

import { useRef, useEffect, useState } from "react";
import type { TextEl } from "../types";

interface TextNodeProps {
  el: TextEl;
  selected: boolean;
  editing: boolean;
  zoom: number;
  onBlur: (id: string, text: string) => void;
  onDblClick: (id: string) => void;
  onResize: (id: string, partial: Partial<TextEl>) => void;
}

type HandlePosition = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r";

function TextNode({ el, selected, editing, zoom, onBlur, onDblClick, onResize }: TextNodeProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [textVal, setTextVal] = useState(el.text);
  const textValRef = useRef(textVal);
  const hasCommitted = useRef(false);

  // Sync with prop updates (e.g. from collaborative changes)
  useEffect(() => {
    setTextVal(el.text);
    textValRef.current = el.text;
  }, [el.text]);

  const commit = (val: string) => {
    if (hasCommitted.current) return;
    hasCommitted.current = true;
    onBlur(el.id, val);
  };

  useEffect(() => {
    hasCommitted.current = false;
    textValRef.current = textVal;
  }, [textVal]);

  // Sync state on edit toggling or component unmount to prevent data loss
  useEffect(() => {
    if (editing) {
      hasCommitted.current = false;
    } else if (textValRef.current !== el.text) {
      commit(textValRef.current);
    }
    return () => {
      commit(textValRef.current);
    };
  }, [editing]);

  useEffect(() => {
    if (editing) {
      const raf = requestAnimationFrame(() => {
        const textarea = ref.current;
        if (textarea) {
          textarea.focus();
          const val = textarea.value;
          // Only select all if it's the default placeholder text "Text"
          if (val === "Text") {
            textarea.select();
          } else {
            const length = val.length;
            textarea.setSelectionRange(length, length);
          }
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [editing]);

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>, handle: HandlePosition) => {
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;

    const initialX = el.x;
    const initialY = el.y;

    const rect = target.parentElement?.getBoundingClientRect();
    const initialW = el.w || (rect ? rect.width / zoom : 120);
    const initialH = el.h || (rect ? rect.height / zoom : el.fontSize * 1.6);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== e.pointerId) return;

      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;

      let newX = initialX;
      let newY = initialY;
      let newW = initialW;
      let newH = initialH;

      // Handle horizontal sizing
      if (handle === "tl" || handle === "bl" || handle === "l") {
        const potentialW = initialW - dx;
        if (potentialW >= 30) {
          newW = potentialW;
          newX = initialX + dx;
        } else {
          newW = 30;
          newX = initialX + (initialW - 30);
        }
      } else if (handle === "tr" || handle === "br" || handle === "r") {
        newW = Math.max(30, initialW + dx);
      }

      // Handle vertical sizing
      if (handle === "tl" || handle === "tr" || handle === "t") {
        const potentialH = initialH - dy;
        if (potentialH >= 20) {
          newH = potentialH;
          newY = initialY + dy;
        } else {
          newH = 20;
          newY = initialY + (initialH - 20);
        }
      } else if (handle === "bl" || handle === "br" || handle === "b") {
        newH = Math.max(20, initialH + dy);
      }

      const update: Partial<TextEl> = { x: newX, w: newW };

      // Only force height constraints if the drag has a vertical component
      if (handle.includes("t") || handle.includes("b")) {
        update.y = newY;
        update.h = newH;
      }

      onResize(el.id, update);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== e.pointerId) return;
      try { target.releasePointerCapture(e.pointerId); } catch (err) {}
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handles: { position: HandlePosition; style: React.CSSProperties; cursor: string }[] = [
    { position: "tl", cursor: "nwse-resize", style: { top: -6, left: -6 } },
    { position: "tr", cursor: "nesw-resize", style: { top: -6, right: -6 } },
    { position: "bl", cursor: "nesw-resize", style: { bottom: -6, left: -6 } },
    { position: "br", cursor: "nwse-resize", style: { bottom: -6, right: -6 } },
    { position: "t", cursor: "ns-resize", style: { top: -6, left: "calc(50% - 6px)" } },
    { position: "b", cursor: "ns-resize", style: { bottom: -6, left: "calc(50% - 6px)" } },
    { position: "l", cursor: "ew-resize", style: { top: "calc(50% - 6px)", left: -6 } },
    { position: "r", cursor: "ew-resize", style: { top: "calc(50% - 6px)", right: -6 } },
  ];

  return (
    <div
      data-el-id={el.id}
      onPointerDown={(e) => {
        if (editing) e.stopPropagation();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onDblClick(el.id);
      }}
      className="absolute"
      style={{
        left: el.x, top: el.y,
        width: el.w || "auto",
        height: el.h || "auto",
        maxWidth: el.w ? undefined : 600,
        outline: selected ? "2.5px solid #3742FA" : "2px dashed transparent",
        outlineOffset: 6,
        cursor: editing ? "text" : "grab",
        borderRadius: 5,
        userSelect: editing ? "text" : "none",      // ⬅️ avoid stray selection while dragging
      }}
    >
      {editing ? (
        <div className="grid relative" style={{ minWidth: 80, width: "100%", height: el.h ? "100%" : "auto", gridTemplateColumns: "1fr", boxSizing: "border-box" }}>
          {/* The hidden element that sizes the parent container */}
          {!el.h && (
            <div
              style={{
                fontSize: el.fontSize,
                color: "transparent",
                fontFamily: el.fontFamily || "sans-serif",
                fontWeight: 600,
                lineHeight: 1.4,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                padding: 0,
                border: "none",
                margin: 0,
                gridArea: "1 / 1 / 2 / 2",
                minHeight: el.fontSize * 1.6,
                boxSizing: "border-box",
                paddingRight: 4, // Prevents cursor clipping
                pointerEvents: "none",
              }}
            >
              {textVal + (textVal.endsWith("\n") ? " " : "")}
            </div>
          )}
          <textarea
            ref={ref}
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            className="bg-transparent resize-none outline-none overflow-hidden"
            style={{
              fontSize: el.fontSize,
              color: el.color,
              fontFamily: el.fontFamily || "sans-serif",
              fontWeight: 600,
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              padding: 0,
              border: "none",
              margin: 0,
              gridArea: el.h ? undefined : "1 / 1 / 2 / 2",
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              overflow: el.h ? "auto" : "hidden",
              userSelect: "text",
              WebkitUserSelect: "text",
              pointerEvents: "auto",
            }}
            onBlur={() => commit(textVal)}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <div
          className="font-semibold whitespace-pre-wrap break-words"
          style={{
            fontSize: el.fontSize,
            color: el.color,
            lineHeight: 1.4,
            fontFamily: el.fontFamily || "sans-serif",
            minWidth: 80,
            width: "100%",
            height: el.h ? "100%" : "auto",
            overflow: el.h ? "hidden" : "visible",
            boxSizing: "border-box",
          }}
        >
          {el.text}
        </div>
      )}

      {selected && !editing && (
        handles.map((hnd) => (
          <div
            key={hnd.position}
            onPointerDown={(e) => handleResizePointerDown(e, hnd.position)}
            style={{
              position: "absolute",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#fff",
              border: "2px solid #3742FA",
              cursor: hnd.cursor,
              touchAction: "none",
              zIndex: 50,
              ...hnd.style,
            }}
          />
        ))
      )}
    </div>
  );
}

export default TextNode;
