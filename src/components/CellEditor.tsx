import { useEffect, useRef } from "react";

interface CellEditorProps {
  cellId: string;
  cellText: string;
  onBlur: (id: string, text: string) => void;
}

function CellEditor({ cellId, cellText, onBlur }: CellEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Defer focus to the next frame so any pointerup/click handling
    // from the same double-click (e.g. canvas selection logic) settles
    // before we steal focus — avoids the cursor appearing then vanishing.
    const raf = requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={cellText}
      className="absolute inset-0 w-full h-full bg-blue-50 text-sm text-center font-medium outline-none border-2 border-[#3742FA] rounded z-30 text-foreground px-1"
      onBlur={(e) => onBlur(cellId, e.target.value)}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          inputRef.current?.blur();
        }
      }}
    />
  );
}

export default CellEditor;


// import React, { useRef, useEffect } from "react";

// interface CellEditorProps {
//   cellId: string;
//   cellText: string;
//   onBlur: (id: string, text: string) => void;
// }

// function CellEditor({ cellId, cellText, onBlur }: CellEditorProps) {
//   const ref = useRef<HTMLTextAreaElement>(null);
//   useEffect(() => {
//     if (ref.current) {
//       ref.current.focus();
//       ref.current.selectionStart = ref.current.value.length;
//     }
//   }, []);

//   return (
//     <textarea
//       ref={ref}
//       defaultValue={cellText}
//       onBlur={(e) => onBlur(cellId, e.target.value)}
//       onPointerDown={e => e.stopPropagation()}
//       onKeyDown={e => e.stopPropagation()}
//       className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none text-sm text-center p-2 font-medium text-foreground"
//       style={{ pointerEvents: "auto" }}
//     />
//   );
// }

// export default CellEditor;
