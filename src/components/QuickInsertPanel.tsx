import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import Fuse from "fuse.js";
import * as LucideIcons from "lucide-react";
import { SHAPE_KINDS } from "../constants";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useWorkspaceTheme } from "../contexts/WorkspaceThemeContext";

interface QuickInsertPanelProps {
  onInsertIcon: (name: string, sizeScale: number) => void;
  onInsertEmoji: (emoji: string, sizeScale: number) => void;
  onInsertShape: (kind: string, sizeScale: number) => void;
  onInsertDeviceFrame: (kind: string, sizeScale: number) => void;
  onClose: () => void;
}

// Prepare Lucide Icons
const NON_ICON_EXPORTS = new Set(["createLucideIcon", "default", "icons", "LucideIcon", "LucideProps"]);
const LUCIDE_ICONS = Object.entries(LucideIcons)
  .filter(([name, value]) => !NON_ICON_EXPORTS.has(name) && typeof value === "object" && /^[A-Z]/.test(name))
  .map(([name, Icon]) => {
    const words = name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
    return { id: `icon-${name}`, name, searchText: words, category: "Icon", type: "icon", Icon: Icon as React.ComponentType<{ size?: number }> };
  });

// Prepare Device Frames
const DEVICE_FRAMES = [
  { id: "df-browser", name: "Browser Window", searchText: "browser window web internet ui", category: "Device Frame", type: "device_frame", kind: "browser", emoji: "🌐" },
  { id: "df-desktop", name: "Desktop Monitor", searchText: "desktop monitor pc computer mac screen", category: "Device Frame", type: "device_frame", kind: "desktop", emoji: "🖥" },
  { id: "df-laptop", name: "Laptop", searchText: "laptop macbook notebook computer pc", category: "Device Frame", type: "device_frame", kind: "laptop", emoji: "💻" },
  { id: "df-tablet", name: "Tablet", searchText: "tablet ipad surface device", category: "Device Frame", type: "device_frame", kind: "tablet", emoji: "📱" },
  { id: "df-phone", name: "Mobile Phone", searchText: "mobile phone iphone smartphone android device cell", category: "Device Frame", type: "device_frame", kind: "phone", emoji: "📱" },
];

// Prepare Shapes
const SHAPES = SHAPE_KINDS.map(s => ({
  id: `shape-${s.kind}`, name: s.label, searchText: `${s.label.toLowerCase()} shape`, category: "Shape", type: "shape", kind: s.kind, Icon: () => <div className="scale-75 origin-center">{s.icon}</div>
}));

// Basic Emojis (subset for quick insert search)
const EMOJIS = [
  { id: "em-smile", name: "Smile", searchText: "smile happy face emoji", category: "Emoji", type: "emoji", emoji: "😊" },
  { id: "em-thumbsup", name: "Thumbs Up", searchText: "thumbs up good yes ok emoji", category: "Emoji", type: "emoji", emoji: "👍" },
  { id: "em-heart", name: "Heart", searchText: "heart love like emoji", category: "Emoji", type: "emoji", emoji: "❤️" },
  { id: "em-check", name: "Checkmark", searchText: "check tick done success emoji", category: "Emoji", type: "emoji", emoji: "✅" },
  { id: "em-cross", name: "Cross", searchText: "cross x no error fail emoji", category: "Emoji", type: "emoji", emoji: "❌" },
  { id: "em-warning", name: "Warning", searchText: "warning alert caution emoji", category: "Emoji", type: "emoji", emoji: "⚠️" },
  { id: "em-star", name: "Star", searchText: "star favorite emoji", category: "Emoji", type: "emoji", emoji: "⭐" },
  { id: "em-fire", name: "Fire", searchText: "fire hot trending emoji", category: "Emoji", type: "emoji", emoji: "🔥" },
  { id: "em-rocket", name: "Rocket", searchText: "rocket launch ship fast emoji", category: "Emoji", type: "emoji", emoji: "🚀" },
];

const SEARCH_DATA = [...DEVICE_FRAMES, ...SHAPES, ...EMOJIS, ...LUCIDE_ICONS];

const fuse = new Fuse(SEARCH_DATA, {
  keys: [
    { name: "searchText", weight: 1 },
    { name: "name", weight: 2 },
  ],
  threshold: 0.3,
  ignoreLocation: true,
});

export default function QuickInsertPanel({ onInsertIcon, onInsertEmoji, onInsertShape, onInsertDeviceFrame, onClose }: QuickInsertPanelProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"library" | "emojis">("library");
  const [sizeScale, setSizeScale] = useState<number>(1);
  const { layout } = useWorkspaceTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      return [
        ...DEVICE_FRAMES,
        ...SHAPES.slice(0, 5),
        ...EMOJIS,
        ...LUCIDE_ICONS.slice(0, 10),
      ];
    }
    
    // Exact category match boost
    let baseResults = fuse.search(query).map(r => r.item);
    
    // Sort logic to prioritize Device Frames if they match well
    baseResults.sort((a, b) => {
      // If both match well, boost Device Frame
      if (a.category === "Device Frame" && b.category !== "Device Frame") return -1;
      if (b.category === "Device Frame" && a.category !== "Device Frame") return 1;
      return 0;
    });
    
    return baseResults.slice(0, 50);
  }, [query]);

  const handleInsert = (item: any) => {
    if (item.type === "icon") {
      onInsertIcon(item.name, sizeScale);
    } else if (item.type === "emoji") {
      onInsertEmoji(item.emoji, sizeScale);
    } else if (item.type === "shape") {
      onInsertShape(item.kind, sizeScale);
    } else if (item.type === "device_frame") {
      onInsertDeviceFrame(item.kind, sizeScale);
    }
    onClose();
  };

  return (
    <div className="flex flex-col bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border w-[320px] mb-1 overflow-hidden" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex border-b border-border bg-muted/30">
        <button
          onClick={() => setActiveTab("library")}
          className={`flex-1 py-2 text-xs font-semibold transition-colors ${activeTab === "library" ? "text-foreground border-b-2 border-[#3742FA]" : "text-gray-400 hover:text-foreground"}`}
        >
          Library
        </button>
        <button
          onClick={() => setActiveTab("emojis")}
          className={`flex-1 py-2 text-xs font-semibold transition-colors ${activeTab === "emojis" ? "text-foreground border-b-2 border-[#3742FA]" : "text-gray-400 hover:text-foreground"}`}
        >
          Emojis
        </button>
      </div>

      {activeTab === "library" && (
        <>
          <div className="flex items-center gap-2 p-2.5 border-b border-border bg-muted/10">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Insert item..."
              className="flex-1 text-xs outline-none bg-transparent text-foreground placeholder:text-gray-400 font-medium"
              onKeyDown={(e) => {
                if (e.key === "Enter" && results.length > 0) {
                  handleInsert(results[0]);
                }
              }}
            />
            <button onClick={onClose} className="text-gray-400 hover:text-muted-foreground p-1 rounded hover:bg-muted">
              <X size={14} />
            </button>
          </div>
          
          <div className="max-h-[340px] overflow-y-auto p-1.5 flex flex-col gap-0.5">
            {results.length === 0 ? (
              <div className="text-center text-[11px] text-gray-400 py-8">
                No items found
              </div>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleInsert(item)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors text-left w-full group"
                >
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-[#4B5563] group-hover:text-foreground shrink-0 shadow-sm">
                    {item.type === "icon" ? (
                      <item.Icon size={20} />
                    ) : item.type === "emoji" || item.type === "device_frame" ? (
                      <span className="text-[20px] leading-none">{item.emoji}</span>
                    ) : item.type === "shape" ? (
                      <item.Icon />
                    ) : null}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-xs font-semibold text-foreground truncate">{item.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{item.category}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "emojis" && (
        <div className="flex flex-col">
          <EmojiPicker 
            theme={layout === "horizontal" ? Theme.LIGHT : Theme.DARK}
            onEmojiClick={(emojiData) => {
              onInsertEmoji(emojiData.emoji, sizeScale);
              onClose();
            }}
            width={318}
            height={380}
            style={{ border: 'none', borderRadius: 0 }}
          />
        </div>
      )}

      <div className="flex items-center justify-between p-2 border-t border-border bg-muted/30">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Insert Size</span>
        <div className="flex bg-background border border-border rounded-lg p-0.5 shadow-sm">
          {[
            { label: "S", scale: 0.5 },
            { label: "M", scale: 1 },
            { label: "L", scale: 2 }
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setSizeScale(s.scale)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                sizeScale === s.scale
                  ? "bg-[#3742FA] text-white shadow"
                  : "text-gray-400 hover:text-foreground hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
