import React from "react";

interface ConnectionNodesProps {
  id: string;
  w: number;
  h: number;
  selected?: boolean;
  onStartConnect?: (e: React.PointerEvent, id: string) => void;
}

const ConnectionNodes = ({ id, w, h, selected, onStartConnect }: ConnectionNodesProps) => {
  if (!onStartConnect) return null;
  const nodeClass = `absolute w-3 h-3 bg-card border-[2px] border-[#3742FA] rounded-full transition-opacity cursor-crosshair z-10 pointer-events-auto hover:scale-125 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`;
  return (
    <>
      <div className={nodeClass} style={{ top: -6, left: w / 2 - 6 }} onPointerDown={(e) => onStartConnect(e, id)} />
      <div className={nodeClass} style={{ bottom: -6, left: w / 2 - 6 }} onPointerDown={(e) => onStartConnect(e, id)} />
      <div className={nodeClass} style={{ left: -6, top: h / 2 - 6 }} onPointerDown={(e) => onStartConnect(e, id)} />
      <div className={nodeClass} style={{ right: -6, top: h / 2 - 6 }} onPointerDown={(e) => onStartConnect(e, id)} />
    </>
  );
};

export default ConnectionNodes;
