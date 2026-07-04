import React, { useRef, useEffect } from "react";

interface CellEditorProps {
  cellId: string;
  cellText: string;
  onBlur: (id: string, text: string) => void;
}

function CellEditor({ cellId, cellText, onBlur }: CellEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.selectionStart = ref.current.value.length;
    }
  }, []);

  return (
    <textarea
      ref={ref}
      defaultValue={cellText}
      onBlur={(e) => onBlur(cellId, e.target.value)}
      onPointerDown={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none text-sm text-center p-2 font-medium text-gray-900"
      style={{ pointerEvents: "auto" }}
    />
  );
}

export default CellEditor;
