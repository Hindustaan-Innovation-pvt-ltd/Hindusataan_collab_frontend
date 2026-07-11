import React from "react";
import type { FreeArrowEl, El } from "../types";
import { getElementBox, getBoundaryPt } from "../utils";

interface ArrowNodeProps {
  el: FreeArrowEl;
  selected: boolean;
  els: El[];
  zoom: number;
  onUpdate: (id: string, partial: Partial<FreeArrowEl>) => void;
}

export default function ArrowNode({ el, selected, els, zoom, onUpdate }: ArrowNodeProps) {
  let startX = el.x;
  let startY = el.y;
  let endX = el.x + el.dx;
  let endY = el.y + el.dy;

  let fromElBox = null;
  let toElBox = null;

  if (el.from) {
    const fromEl = els.find(e => e.id === el.from);
    if (fromEl) fromElBox = getElementBox(fromEl);
  }
  if (el.to) {
    const toEl = els.find(e => e.id === el.to);
    if (toEl) toElBox = getElementBox(toEl);
  }

  const targetForStart = toElBox ? { x: toElBox.cx, y: toElBox.cy } : { x: endX, y: endY };
  const targetForEnd = fromElBox ? { x: fromElBox.cx, y: fromElBox.cy } : { x: startX, y: startY };

  if (fromElBox) {
    const pt = getBoundaryPt(fromElBox.cx, fromElBox.cy, fromElBox.w, fromElBox.h, targetForStart.x, targetForStart.y);
    startX = pt.x;
    startY = pt.y;
  }
  if (toElBox) {
    const pt = getBoundaryPt(toElBox.cx, toElBox.cy, toElBox.w, toElBox.h, targetForEnd.x, targetForEnd.y);
    endX = pt.x;
    endY = pt.y;
  }

  const handlePointerDown = (e: React.PointerEvent, handle: "start" | "end" | "body") => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const initClientX = e.clientX;
    const initClientY = e.clientY;

    const initX = el.x;
    const initY = el.y;
    const initDx = el.dx;
    const initDy = el.dy;
    const initFrom = el.from;
    const initTo = el.to;

    let currentFrom = initFrom;
    let currentTo = initTo;

    const onMove = (me: PointerEvent) => {
      if (me.pointerId !== e.pointerId) return;

      const dX = (me.clientX - initClientX) / zoom;
      const dY = (me.clientY - initClientY) / zoom;

      if (handle === "body") {
        onUpdate(el.id, {
          x: initX + dX,
          y: initY + dY,
          from: undefined,
          to: undefined,
        });
      } else {
        const elsUnder = document.elementsFromPoint(me.clientX, me.clientY);
        const upTarget = elsUnder.map(node => node.closest("[data-el-id]")).find(node => node != null);
        const snapId = upTarget ? upTarget.getAttribute("data-el-id")! : undefined;

        const finalSnapId = snapId !== el.id ? snapId : undefined;

        if (handle === "start") {
          currentFrom = finalSnapId;
          onUpdate(el.id, {
            x: initX + dX,
            y: initY + dY,
            dx: initDx - dX,
            dy: initDy - dY,
            from: currentFrom,
          });
        } else if (handle === "end") {
          currentTo = finalSnapId;
          onUpdate(el.id, {
            dx: initDx + dX,
            dy: initDy + dY,
            to: currentTo,
          });
        }
      }
    };

    const onUp = (ue: PointerEvent) => {
      if (ue.pointerId !== e.pointerId) return;
      try { target.releasePointerCapture(e.pointerId); } catch {}
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <svg className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: "none" }}>
      <defs>
        <marker id={`arrowhead-${el.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={el.color} />
        </marker>
      </defs>
      <g data-el-id={el.id}>
        <line
          x1={startX} y1={startY} x2={endX} y2={endY}
          stroke="transparent" strokeWidth="20"
          style={{ pointerEvents: "stroke", cursor: "move" }}
          onPointerDown={(e) => handlePointerDown(e, "body")}
        />
        <line
          x1={startX} y1={startY} x2={endX} y2={endY}
          stroke={el.color} strokeWidth="3" markerEnd={`url(#arrowhead-${el.id})`}
          style={{ pointerEvents: "none", filter: selected ? "drop-shadow(0 0 4px #3742FA)" : undefined }}
        />
        {selected && (
          <>
            <circle
              cx={startX} cy={startY} r="5"
              fill="#fff" stroke="#3742FA" strokeWidth="2"
              style={{ pointerEvents: "all", cursor: "crosshair" }}
              onPointerDown={(e) => handlePointerDown(e, "start")}
            />
            <circle
              cx={endX} cy={endY} r="5"
              fill="#fff" stroke="#3742FA" strokeWidth="2"
              style={{ pointerEvents: "all", cursor: "crosshair" }}
              onPointerDown={(e) => handlePointerDown(e, "end")}
            />
          </>
        )}
      </g>
    </svg>
  );
}
