import React from "react";
import { toPng } from "html-to-image";
import type { El } from "../types";
import { uid } from "../utils";

interface ContextMenuProps {
  x: number;
  y: number;
  id: string | null;
  selIds: string[];
  els: El[];
  clipboardRef: React.MutableRefObject<El[]>;
  setEls: React.Dispatch<React.SetStateAction<El[]>>;
  setSelIds: React.Dispatch<React.SetStateAction<string[]>>;
  onClose: () => void;
}

const ContextMenu = React.memo(({
  x, y, id, selIds, els, clipboardRef, setEls, setSelIds, onClose
}: ContextMenuProps) => {
  return (
    <div
      className="absolute z-[100] bg-white rounded-lg shadow-xl border border-gray-100 py-1 min-w-[150px]"
      style={{ top: y, left: x }}
      onPointerDown={e => e.stopPropagation()}
    >
      {id && (
        <button
          className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#3742FA] hover:text-white transition-colors"
          onClick={() => {
            if (selIds.length > 0) {
              clipboardRef.current = els.filter(ex => selIds.includes(ex.id));
            }
            onClose();
          }}
        >
          Copy
        </button>
      )}

      <button
        className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#3742FA] hover:text-white transition-colors"
        onClick={() => {
          if (clipboardRef.current.length > 0) {
            const newEls = clipboardRef.current.map(el => {
              const newEl = { ...el, id: uid() };
              if ('x' in newEl) newEl.x += 20;
              if ('y' in newEl) newEl.y += 20;
              return newEl;
            });
            setEls(p => [...p, ...newEls]);
            setSelIds(newEls.map(e => e.id));
          }
          onClose();
        }}
        disabled={clipboardRef.current.length === 0}
        style={{ opacity: clipboardRef.current.length > 0 ? 1 : 0.5 }}
      >
        Paste
      </button>

      {selIds.length > 0 && (
        <>
          <button
            className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#3742FA] hover:text-white transition-colors"
            onClick={() => {
              setEls(p => {
                const otherEls = p.filter(el => !selIds.includes(el.id));
                const selEls = p.filter(el => selIds.includes(el.id));
                return [...selEls, ...otherEls];
              });
              onClose();
            }}
          >
            Send to back
          </button>

          <button
            className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#3742FA] hover:text-white transition-colors"
            onClick={() => {
              setEls(p => {
                const otherEls = p.filter(el => !selIds.includes(el.id));
                const selEls = p.filter(el => selIds.includes(el.id));
                return [...otherEls, ...selEls];
              });
              onClose();
            }}
          >
            Bring to front
          </button>

          <button
            className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#3742FA] hover:text-white transition-colors"
            onClick={() => {
              setEls(p => p.map(el => selIds.includes(el.id) ? { ...el, locked: !el.locked } : el));
              onClose();
            }}
          >
            {selIds.every(sid => els.find(e => e.id === sid)?.locked) ? "Unlock" : "Lock"}
          </button>

          <button
            className="w-full text-left px-4 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => {
              setEls(p => p.filter(el => !selIds.includes(el.id)));
              setSelIds([]);
              onClose();
            }}
            disabled={selIds.some(sid => els.find(e => e.id === sid)?.locked)}
            style={{ opacity: selIds.some(sid => els.find(e => e.id === sid)?.locked) ? 0.5 : 1 }}
          >
            Delete
          </button>

          <div className="w-full h-px bg-gray-100 my-1" />

          <button
            className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-[#3742FA] hover:text-white transition-colors"
            onClick={async () => {
              const node = document.querySelector(`[data-el-id="${id}"]`) as HTMLElement;
              if (node) {
                try {
                  const prevSel = [...selIds];
                  setSelIds([]);
                  await new Promise(r => setTimeout(r, 50));
                  const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: "transparent" });
                  setSelIds(prevSel);
                  const res = await fetch(dataUrl);
                  const blob = await res.blob();
                  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                } catch (e) {
                  console.error("Failed to copy PNG", e);
                }
              }
              onClose();
            }}
          >
            Copy as PNG
          </button>
        </>
      )}
    </div>
  );
});

export default ContextMenu;
