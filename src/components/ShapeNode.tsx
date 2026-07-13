import React, { useRef, useEffect } from "react";
import type { ShapeEl, ShapeKind } from "../types";
import { shapePathD } from "../utils/util";
import ConnectionNodes from "./ConnectionNodes";

interface ShapeNodeProps {
  el: ShapeEl;
  selected: boolean;
  editing: boolean;
  onStartConnect?: (e: React.PointerEvent, id: string) => void;
  onResize: (id: string, partial: Partial<ShapeEl>) => void;
  onDblClick: (id: string) => void;
  onBlur: (id: string, text: string) => void;
}

const MIN_SIZE = 30;

type HandlePosition = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r";

function ShapeNode({
  el,
  selected,
  editing,
  onStartConnect,
  onResize,
  onDblClick,
  onBlur,
}: ShapeNodeProps) {
  const { x, y, w, h, color, kind } = el;
  const sel = selected ? "#3742FA" : "transparent";
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      const raf = requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          const val = textarea.value;
          if (val === "" || val === "Text" || val === "Shape") {
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

    const initialX = x;
    const initialY = y;
    const initialW = w;
    const initialH = h;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== e.pointerId) return;

      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newX = initialX;
      let newY = initialY;
      let newW = initialW;
      let newH = initialH;

      const ratio = initialW / initialH;

      if (handle === "tl" || handle === "bl" || handle === "l") {
        const potentialW = initialW - dx;
        if (potentialW >= MIN_SIZE) {
          newW = potentialW;
          newX = initialX + dx;
        } else {
          newW = MIN_SIZE;
          newX = initialX + (initialW - MIN_SIZE);
        }
      } else if (handle === "tr" || handle === "br" || handle === "r") {
        newW = Math.max(MIN_SIZE, initialW + dx);
      }

      if (handle === "tl" || handle === "tr" || handle === "t") {
        const potentialH = initialH - dy;
        if (potentialH >= MIN_SIZE) {
          newH = potentialH;
          newY = initialY + dy;
        } else {
          newH = MIN_SIZE;
          newY = initialY + (initialH - MIN_SIZE);
        }
      } else if (handle === "bl" || handle === "br" || handle === "b") {
        newH = Math.max(MIN_SIZE, initialH + dy);
      }

      if (moveEvent.shiftKey && handle.length === 2) {
        if (Math.abs(dx) > Math.abs(dy)) {
          let adjH = newW / ratio;
          if (adjH < MIN_SIZE) {
            adjH = MIN_SIZE;
            newW = MIN_SIZE * ratio;
            if (handle === "tl" || handle === "bl") {
              newX = initialX + (initialW - newW);
            }
          }
          if (handle === "tl" || handle === "tr") {
            newY = initialY + (initialH - adjH);
          }
          newH = adjH;
        } else {
          let adjW = newH * ratio;
          if (adjW < MIN_SIZE) {
            adjW = MIN_SIZE;
            newH = MIN_SIZE / ratio;
            if (handle === "tl" || handle === "tr") {
              newY = initialY + (initialH - newH);
            }
          }
          if (handle === "tl" || handle === "bl") {
            newX = initialX + (initialW - adjW);
          }
          newW = adjW;
        }
      }

      onResize(el.id, { x: newX, y: newY, w: newW, h: newH });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== e.pointerId) return;

      try {
        target.releasePointerCapture(e.pointerId);
      } catch (err) {}

      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", onPointerUp);
    };

    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
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
      className="absolute group"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        cursor: editing ? "text" : "grab",
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onDblClick(el.id);
      }}
    >
      <ConnectionNodes
        id={el.id}
        w={w}
        h={h}
        selected={selected}
        onStartConnect={onStartConnect}
      />

      <svg
        width={w}
        height={h}
        overflow="visible"
        className="absolute top-0 left-0 pointer-events-none"
      >
        {selected && (
          <rect
            x="-4"
            y="-4"
            width={w + 8}
            height={h + 8}
            rx="4"
            fill="none"
            stroke={sel}
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        )}

        {kind === "rect" && (
          <rect
            x="1.25"
            y="1.25"
            width={w - 2.5}
            height={h - 2.5}
            rx="6"
            fill={color + "28"}
            stroke={color}
            strokeWidth="2.5"
            className="pointer-events-auto"
          />
        )}

        {kind === "ellipse" && (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={(w - 2.5) / 2}
            ry={(h - 2.5) / 2}
            fill={color + "28"}
            stroke={color}
            strokeWidth="2.5"
            className="pointer-events-auto"
          />
        )}

        {kind !== "rect" && kind !== "ellipse" && (
          <path
            d={shapePathD(kind as ShapeKind, w, h)}
            fill={color + "28"}
            stroke={color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="pointer-events-auto"
          />
        )}
      </svg>

      <div
        className="absolute inset-0 flex items-center justify-center p-3 overflow-hidden select-none pointer-events-none"
        style={{ contentVisibility: "auto" }}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            defaultValue={el.text ?? ""}
            className="w-full h-full bg-transparent resize-none outline-none text-center font-semibold pointer-events-auto overflow-hidden break-words"
            style={{
              color,
              fontFamily: "inherit",
              lineHeight: 1.3,
              fontSize: Math.max(12, h / 6),
            }}
            onBlur={(e) => onBlur(el.id, e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                textareaRef.current?.blur();
              }
            }}
          />
        ) : (
          el.text && (
            <div
              className="w-full font-semibold text-center whitespace-pre-wrap break-words"
              style={{
                color,
                lineHeight: 1.3,
                fontSize: Math.max(12, h / 6),
              }}
            >
              {el.text}
            </div>
          )
        )}
      </div>

      {selected &&
        !editing &&
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
        ))}
    </div>
  );
}

export default ShapeNode;


// import React, { useRef, useEffect } from "react";
// import type { ShapeEl, ShapeKind } from "../types";
// import { shapePathD } from "../utils/util";
// import ConnectionNodes from "./ConnectionNodes";

// interface ShapeNodeProps {
//   el: ShapeEl;
//   selected: boolean;
//   editing: boolean;
//   onStartConnect?: (e: React.PointerEvent, id: string) => void;
//   onResize: (id: string, w: number, h: number) => void;
//   onDblClick: (id: string) => void;
//   onBlur: (id: string, text: string) => void;
// }

// const MIN_SIZE = 24;

// function ShapeNode({
//   el,
//   selected,
//   editing,
//   onStartConnect,
//   onResize,
//   onDblClick,
//   onBlur,
// }: ShapeNodeProps) {
//   const { w, h, color, kind } = el;
//   const sel = selected ? "#3742FA" : "transparent";
//   const textareaRef = useRef<HTMLTextAreaElement>(null);

//   useEffect(() => {
//     if (editing) {
//       const raf = requestAnimationFrame(() => {
//         textareaRef.current?.focus();
//         textareaRef.current?.select();
//       });
//       return () => cancelAnimationFrame(raf);
//     }
//   }, [editing]);

//   const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
//     e.stopPropagation();
//     e.preventDefault();

//     const target = e.target as HTMLDivElement;
//     target.setPointerCapture(e.pointerId);

//     const startX = e.clientX;
//     const startY = e.clientY;
//     const startW = w;
//     const startH = h;

//     const onPointerMove = (moveEvent: PointerEvent) => {
//       const dx = moveEvent.clientX - startX;
//       const dy = moveEvent.clientY - startY;
//       const newW = Math.max(MIN_SIZE, startW + dx);
//       const newH = Math.max(MIN_SIZE, startH + dy);
//       onResize(el.id, newW, newH);
//     };

//     const onPointerUp = () => {
//       window.removeEventListener("pointermove", onPointerMove);
//       window.removeEventListener("pointerup", onPointerUp);
//     };

//     window.addEventListener("pointermove", onPointerMove);
//     window.addEventListener("pointerup", onPointerUp);
//   };

//   return (
//     <div
//       data-el-id={el.id}
//       className="absolute group"
//       style={{
//         left: el.x,
//         top: el.y,
//         width: w,
//         height: h,
//         cursor: editing ? "text" : "grab",
//       }}
//       onDoubleClick={(e) => {
//         e.stopPropagation();
//         e.preventDefault();
//         onDblClick(el.id);
//       }}
//     >
//       <ConnectionNodes
//         id={el.id}
//         w={w}
//         h={h}
//         selected={selected}
//         onStartConnect={onStartConnect}
//       />

//       <svg width={w} height={h} overflow="visible">
//         {selected && (
//           <rect
//             x="-5"
//             y="-5"
//             width={w + 10}
//             height={h + 10}
//             rx="4"
//             fill="none"
//             stroke={sel}
//             strokeWidth="2"
//             strokeDasharray="5 3"
//           />
//         )}

//         {kind === "rect" && (
//           <rect
//             x="1.25"
//             y="1.25"
//             width={w - 2.5}
//             height={h - 2.5}
//             rx="6"
//             fill={color + "28"}
//             stroke={color}
//             strokeWidth="2.5"
//           />
//         )}

//         {kind === "ellipse" && (
//           <ellipse
//             cx={w / 2}
//             cy={h / 2}
//             rx={(w - 2.5) / 2}
//             ry={(h - 2.5) / 2}
//             fill={color + "28"}
//             stroke={color}
//             strokeWidth="2.5"
//           />
//         )}

//         {kind !== "rect" && kind !== "ellipse" && (
//           <path
//             d={shapePathD(kind as ShapeKind, w, h)}
//             fill={color + "28"}
//             stroke={color}
//             strokeWidth="2.5"
//             strokeLinejoin="round"
//           />
//         )}
//       </svg>

//       {selected && !editing && (
//         <div
//           onPointerDown={handleResizePointerDown}
//           style={{
//             position: "absolute",
//             right: -7,
//             bottom: -7,
//             width: 14,
//             height: 14,
//             borderRadius: "50%",
//             background: "#fff",
//             border: "2px solid #3742FA",
//             cursor: "nwse-resize",
//             touchAction: "none",
//           }}
//         />
//       )}

//       {editing ? (
//         <textarea
//           ref={textareaRef}
//           defaultValue={el.text ?? ""}
//           className="absolute bg-transparent resize-none outline-none text-center"
//           style={{
//             left: 0,
//             top: 0,
//             width: w,
//             height: h,
//             color,
//             fontFamily: "inherit",
//             fontWeight: 600,
//             lineHeight: 1.4,
//           }}
//           onBlur={(e) => onBlur(el.id, e.target.value)}
//           onPointerDown={(e) => e.stopPropagation()}
//         />
//       ) : (
//         el.text && (
//           <div
//             className="absolute inset-0 flex items-center justify-center font-semibold text-center whitespace-pre-wrap pointer-events-none"
//             style={{ color, lineHeight: 1.4 }}
//           >
//             {el.text}
//           </div>
//         )
//       )}
//     </div>
//   );
// }

// export default ShapeNode;