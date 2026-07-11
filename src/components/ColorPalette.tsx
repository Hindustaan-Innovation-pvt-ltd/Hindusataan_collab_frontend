interface ColorPaletteProps {
  colors: string[];
  active: string;
  onPick: (c: string) => void;
  flat?: boolean;
}

function ColorPalette({ colors, active, onPick, flat = false }: ColorPaletteProps) {
  return (
    <div className={flat 
      ? "flex flex-wrap items-center justify-start gap-2.5 px-1 py-1"
      : "flex items-center gap-2.5 bg-card rounded-full px-3 py-2 shadow-lg border border-border"
    }>
      {colors.map(c => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className="w-5 h-5 rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer shrink-0"
          style={{
            backgroundColor: c,
            outline: active === c ? "2.5px solid #3742FA" : "2px solid rgba(0,0,0,0.12)",
            outlineOffset: active === c ? 2 : 0,
            transform: active === c ? "scale(1.15)" : undefined,
          }}
          title={c}
        />
      ))}
    </div>
  );
}

export default ColorPalette;
