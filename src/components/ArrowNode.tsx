import React from "react";
import type { FreeArrowEl, El } from "../types";
import { getElementBox, getBoundaryPt, smartExtendEngine } from "../utils";
import { connectorEngine } from "../utils/connectorEngine";

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

  const handlePointerDown = (e: React.PointerEvent, handle: "start" | "end" | "bend") => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const initClientX = e.clientX;
    const initClientY = e.clientY;

    const initFrom = el.from;
    const initTo = el.to;
    const initBend = el.bend;

    let currentFrom = initFrom;
    let currentTo = initTo;

    const routingType = el.routing || "straight";
    const initBendPt = connectorEngine.getRoutingPath(
      { x: startX, y: startY },
      { x: endX, y: endY },
      initBend as any,
      routingType
    ).bendPt;

    const onMove = (me: PointerEvent) => {
      if (me.pointerId !== e.pointerId) return;

      const dX = (me.clientX - initClientX) / zoom;
      const dY = (me.clientY - initClientY) / zoom;

      if (handle === "bend") {
        const targetPt = {
          x: initBendPt.x + dX,
          y: initBendPt.y + dY,
        };
        const newBend = connectorEngine.calculateBendFromPoint({ x: startX, y: startY }, { x: endX, y: endY }, targetPt);
        onUpdate(el.id, { bend: newBend as any });
        return;
      }

      const elsUnder = document.elementsFromPoint(me.clientX, me.clientY);
      const upTarget = elsUnder.map(node => node.closest("[data-el-id]")).find(node => {
        if (!node) return false;
        const tid = node.getAttribute("data-el-id");
        const targetEl = els.find(x => x.id === tid);
        return targetEl && targetEl.type !== "free_arrow" && targetEl.type !== "connection" && targetEl.type !== "path";
      });
      const snapId = upTarget ? upTarget.getAttribute("data-el-id")! : undefined;

      const finalSnapId = snapId !== el.id ? snapId : undefined;

      if (handle === "start") {
        currentFrom = finalSnapId;
        const ext = smartExtendEngine.extendLine(el, dX, dY, "start", me.shiftKey);
        onUpdate(el.id, {
          ...ext,
          from: currentFrom,
        });
      } else if (handle === "end") {
        currentTo = finalSnapId;
        const ext = smartExtendEngine.extendLine(el, dX, dY, "end", me.shiftKey);
        onUpdate(el.id, {
          ...ext,
          to: currentTo,
        });
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

  const sw = el.sw || 4;
  const dash = el.dash === "dashed" ? `${sw * 2.5}, ${sw * 2.5}` : undefined;
  const color = el.color || "#6B7280";

  const routingType = el.routing || "straight";
  const { d, bendPt, angle } = connectorEngine.getRoutingPath(
    { x: startX, y: startY },
    { x: endX, y: endY },
    el.bend,
    routingType
  );

  // Open V-shaped arrowhead (not filled triangle, proportionally scaled with sw)
  const wingLen = Math.max(16, sw * 3.8);
  const wingAngle = 26 * (Math.PI / 180);

  const wing1X = endX - wingLen * Math.cos(angle - wingAngle);
  const wing1Y = endY - wingLen * Math.sin(angle - wingAngle);
  const wing2X = endX - wingLen * Math.cos(angle + wingAngle);
  const wing2Y = endY - wingLen * Math.sin(angle + wingAngle);

  const arrowheadD = `M ${wing1X} ${wing1Y} L ${endX} ${endY} L ${wing2X} ${wing2Y}`;

  return (
    <svg className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: "none", shapeRendering: "geometricPrecision" }}>
      <g data-el-id={el.id}>
        {/* Invisible thick hit target for easy clicking/dragging */}
        <path
          d={d}
          stroke="transparent" strokeWidth={Math.max(20, sw + 14)} fill="none"
          style={{ pointerEvents: "stroke", cursor: "move" }}
        />
        {/* Main stem line */}
        <path
          d={d}
          stroke={color} strokeWidth={sw} strokeDasharray={dash} fill="none"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ pointerEvents: "none", filter: selected ? "drop-shadow(0 0 5px #3742FA)" : undefined }}
        />
        {/* Hollow V-shaped arrowhead */}
        {el.arrowHead !== false && (
          <path
            d={arrowheadD}
            stroke={color} strokeWidth={sw} fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ pointerEvents: "none", filter: selected ? "drop-shadow(0 0 5px #3742FA)" : undefined }}
          />
        )}
        {selected && (
          <>
            <circle
              cx={startX} cy={startY} r="6"
              fill="#fff" stroke="#3742FA" strokeWidth="2.5"
              style={{ pointerEvents: "all", cursor: "crosshair", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
              onPointerDown={(e) => handlePointerDown(e, "start")}
            />
            <circle
              cx={endX} cy={endY} r="6"
              fill="#fff" stroke="#3742FA" strokeWidth="2.5"
              style={{ pointerEvents: "all", cursor: "crosshair", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
              onPointerDown={(e) => handlePointerDown(e, "end")}
            />
            <circle
              cx={bendPt.x} cy={bendPt.y} r="6"
              fill="#fff" stroke="#3742FA" strokeWidth="2.5"
              style={{ pointerEvents: "all", cursor: "pointer", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
              onPointerDown={(e) => handlePointerDown(e, "bend")}
            />
          </>
        )}
      </g>
    </svg>
  );
}
