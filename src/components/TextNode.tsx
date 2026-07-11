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

import { useRef, useEffect } from "react";
import type { TextEl } from "../types";

interface TextNodeProps {
  el: TextEl;
  selected: boolean;
  editing: boolean;
  onBlur: (id: string, text: string) => void;
  onDblClick: (id: string) => void;
  onResize: (id: string, fontSize: number) => void;
}

function TextNode({ el, selected, editing, onBlur, onDblClick, onResize }: TextNodeProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      // Defer to next frame so the stage's own pointerup/click handling
      // (from the same double-click) fully finishes before we steal focus.
      const raf = requestAnimationFrame(() => {
        ref.current?.focus();
        ref.current?.select();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [editing]);

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
        outline: selected ? "2.5px solid #3742FA" : "2px dashed transparent",
        outlineOffset: 6,
        cursor: editing ? "text" : "grab",
        borderRadius: 5,
        userSelect: editing ? "text" : "none",      // ⬅️ avoid stray selection while dragging
      }}
    >
      {editing ? (
        <textarea
          ref={ref}
          defaultValue={el.text}
          className="bg-transparent resize-none outline-none"
          style={{
            fontSize: el.fontSize, color: el.color,
            fontFamily: el.fontFamily || "sans-serif", fontWeight: 600,
            minWidth: 80, minHeight: el.fontSize * 1.6,
            lineHeight: 1.4,
          }}
          onBlur={(e) => onBlur(el.id, e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="font-semibold whitespace-pre"
          style={{ fontSize: el.fontSize, color: el.color, lineHeight: 1.4, fontFamily: el.fontFamily || "sans-serif" }}
        >
          {el.text}
        </div>
      )}

      {selected && !editing && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            const target = e.currentTarget;
            target.setPointerCapture(e.pointerId);

            const startX = e.clientX;
            const startFontSize = el.fontSize || 24;

            const onPointerMove = (moveEvent: PointerEvent) => {
              if (moveEvent.pointerId !== e.pointerId) return;
              const dx = moveEvent.clientX - startX;
              const newSize = Math.max(12, startFontSize + dx * 0.5);
              onResize(el.id, newSize);
            };

            const onPointerUp = (upEvent: PointerEvent) => {
              if (upEvent.pointerId !== e.pointerId) return;
              try { target.releasePointerCapture(e.pointerId); } catch (err) {}
              window.removeEventListener("pointermove", onPointerMove);
              window.removeEventListener("pointerup", onPointerUp);
            };

            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
          }}
          style={{
            position: "absolute",
            right: -7,
            bottom: -7,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            border: "2px solid #3742FA",
            cursor: "nwse-resize",
            touchAction: "none",
          }}
        />
      )}
    </div>
  );
}

export default TextNode;
