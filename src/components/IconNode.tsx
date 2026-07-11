import React from "react";
import * as LucideIcons from "lucide-react";
import type { IconEl } from "../types";

interface IconNodeProps {
  el: IconEl;
  selected: boolean;
  zoom: number;
  onResize: (id: string, partial: Partial<IconEl>) => void;
}

const MIN_SIZE = 16;

// 1. Emoji detect karne ke liye helper regex
const isEmoji = (str: string) => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
  return emojiRegex.test(str);
};

// 2. Emoji ko Fluent Emoji CDN URL mein badalne ka function (Eraser.io Premium Look)
const getFluentEmojiUrl = (emoji: string) => {
  // Emoji ka unified unicode code-point nikalna (e.g., 🚀 -> 1f680)
  const codePoints = Array.from(emoji)
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join("-");

  // Microsoft Fluent Emojis ka high-quality flat/3d public CDN
  return `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/${codePoints}_flat.svg`;
};

function IconNode({ el, selected, zoom, onResize }: IconNodeProps) {
  const { x, y, size, color, iconName } = el;

  const isAnEmoji = isEmoji(iconName);
  const fluentEmojiUrl = isAnEmoji ? getFluentEmojiUrl(iconName) : null;

  const IconComponent = !isAnEmoji
    ? (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[iconName]
    : null;

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>, corner: 'nw' | 'ne' | 'sw' | 'se') => {
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = size;
    const startElX = x;
    const startElY = y;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== e.pointerId) return;
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      
      // We want to keep it square. We'll use the dominant movement axis.
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      
      let newSize = startSize;
      let newX = startElX;
      let newY = startElY;

      if (corner === 'se') {
        newSize = Math.max(MIN_SIZE, startSize + delta);
      } else if (corner === 'sw') {
        newSize = Math.max(MIN_SIZE, startSize - dx);
        newX = startElX + (startSize - newSize);
      } else if (corner === 'ne') {
        newSize = Math.max(MIN_SIZE, startSize + dx);
        newY = startElY + (startSize - newSize);
      } else if (corner === 'nw') {
        newSize = Math.max(MIN_SIZE, startSize - dx);
        newX = startElX + (startSize - newSize);
        newY = startElY + (startSize - newSize);
      }

      onResize(el.id, { size: newSize, x: newX, y: newY });
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

  // Fallback state agar kuch na mile
  if (!IconComponent && !isAnEmoji) {
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
        userSelect: "none",
      }}
    >
      {/* Option B Implementation: Render Vector CDN image for Emojis */}
      {isAnEmoji && fluentEmojiUrl ? (
        <img
          src={fluentEmojiUrl}
          alt={iconName}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none", // Image drag issue prevent karne ke liye
          }}
          onError={(e) => {
            // Agar kisi rare emoji ka SVG CDN par nahi milta, toh standard text rendering fallback ho jayega
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              const span = document.createElement("span");
              span.innerText = iconName;
              span.style.fontSize = `${size * 0.8}px`;
              parent.appendChild(span);
            }
          }}
        />
      ) : (
        IconComponent && <IconComponent size={size} color={color} />
      )}

      {/* Resize Handles */}
      {selected && (
        <>
          <div className="absolute top-0 left-0 w-3.5 h-3.5 bg-card border-[2.5px] border-[#3742FA] rounded-sm -translate-x-1.5 -translate-y-1.5 cursor-nwse-resize z-10 hover:scale-125 transition-transform" onPointerDown={(e) => handleResizePointerDown(e, 'nw')} />
          <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-card border-[2.5px] border-[#3742FA] rounded-sm translate-x-1.5 -translate-y-1.5 cursor-nesw-resize z-10 hover:scale-125 transition-transform" onPointerDown={(e) => handleResizePointerDown(e, 'ne')} />
          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-card border-[2.5px] border-[#3742FA] rounded-sm -translate-x-1.5 translate-y-1.5 cursor-nesw-resize z-10 hover:scale-125 transition-transform" onPointerDown={(e) => handleResizePointerDown(e, 'sw')} />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-card border-[2.5px] border-[#3742FA] rounded-sm translate-x-1.5 translate-y-1.5 cursor-nwse-resize z-10 hover:scale-125 transition-transform" onPointerDown={(e) => handleResizePointerDown(e, 'se')} />
        </>
      )}
    </div>
  );
}

export default IconNode;