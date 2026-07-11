import React from "react";
import * as LucideIcons from "lucide-react";
import { Icon as IconifyIcon } from "@iconify/react";
import type { IconEl } from "../types";

interface IconNodeProps {
  el: IconEl;
  selected: boolean;
  onResize: (id: string, size: number) => void;
}

const MIN_SIZE = 16;

function IconNode({ el, selected, onResize }: IconNodeProps) {
  const { x, y, size, color, iconName } = el;

  const isIconify = iconName.includes(":");
  const IconComponent = isIconify ? null : (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[iconName];

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = size;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== e.pointerId) return;
      // Use the larger of dx/dy so diagonal drag feels natural, keep icon square
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      const newSize = Math.max(MIN_SIZE, startSize + delta);
      onResize(el.id, newSize);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== e.pointerId) return;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch (err) {}
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  if (!isIconify && !IconComponent) {
    return (
      <div
        data-el-id={el.id}
        className="absolute flex items-center justify-center text-red-400 text-xs border border-dashed border-red-300 rounded"
        style={{ left: x, top: y, width: size, height: size, cursor: "grab" }}
      >
        ?
      </div>
    );
  }

  return (
    <div
      data-el-id={el.id}
      className="absolute flex items-center justify-center"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        cursor: "grab",
        outline: selected ? "2px solid #3742FA" : "2px dashed transparent",
        outlineOffset: 6,
        borderRadius: 6,
      }}
    >
      {isIconify ? (
        <IconifyIcon icon={iconName} width={size} height={size} color={color} />
      ) : (
        IconComponent && <IconComponent size={size} color={color} />
      )}

      {selected && (
        <div
          onPointerDown={handleResizePointerDown}
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

export default IconNode;

// import React from "react";
// import * as LucideIcons from "lucide-react";
// import type { IconEl } from "../types";

// interface IconNodeProps {
//   el: IconEl;
//   selected: boolean;
// }

// function IconNode({ el, selected }: IconNodeProps) {
//   const { x, y, size, color, iconName } = el;

//   // Look up the icon component dynamically by name from the full library —
//   // matches whatever was picked in the Toolbar's search, no hardcoded list.
//   const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[iconName];

//   if (!IconComponent) {
//     // Icon name doesn't exist in the library (e.g. corrupted data) — render a visible fallback instead of crashing
//     return (
//       <div
//         data-el-id={el.id}
//         className="absolute flex items-center justify-center text-red-400 text-xs border border-dashed border-red-300 rounded"
//         style={{ left: x, top: y, width: size, height: size, cursor: "grab" }}
//       >
//         ?
//       </div>
//     );
//   }

//   return (
//     <div
//       data-el-id={el.id}
//       className="absolute flex items-center justify-center"
//       style={{
//         left: x,
//         top: y,
//         width: size,
//         height: size,
//         cursor: "grab",
//         outline: selected ? "2px solid #3742FA" : "2px dashed transparent",
//         outlineOffset: 6,
//         borderRadius: 6,
//       }}
//     >
//       <IconComponent size={size} color={color} />
//     </div>
//   );
// }

// export default IconNode;