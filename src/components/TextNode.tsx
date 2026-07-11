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
}

function TextNode({ el, selected, editing, onBlur, onDblClick }: TextNodeProps) {
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
        e.preventDefault();                        // ⬅️ stop native word-select on dblclick
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
            fontFamily: "inherit", fontWeight: 600,
            minWidth: 80, minHeight: el.fontSize * 1.6,
            lineHeight: 1.4,
          }}
          onBlur={(e) => onBlur(el.id, e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="font-semibold whitespace-pre"
          style={{ fontSize: el.fontSize, color: el.color, lineHeight: 1.4 }}
        >
          {el.text}
        </div>
      )}
    </div>
  );
}

export default TextNode;
