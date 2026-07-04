import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Send, Bot, User } from "lucide-react";
import type { ChatMessage } from "../types";

// ── AI Constants ───────────────────────────────────────────────────────────────

const AI_SUGGESTIONS = [
  "Add 3 sticky notes for brainstorming",
  "Summarize what's on my board",
  "Suggest a layout for my ideas",
  "What can I create with FigJam?",
];

const AI_RESPONSES: Record<string, string> = {
  default: "I'm your FigJam AI assistant! I can help you brainstorm, organize ideas, suggest layouts, and more. What would you like to work on today?",
  brainstorm: "Great idea! For brainstorming sessions, I recommend starting with a central topic sticky note, then branching out to 4–6 theme clusters. Use color coding: yellow for problems, blue for solutions, pink for open questions. Want me to walk you through a structured brainstorm?",
  layout: "For a clean FigJam layout, try a 3-column structure: **Ideas** on the left, **In Progress** in the center, and **Done** on the right. Use shapes as column headers and sticky notes for individual items. This works beautifully for project tracking or sprint planning.",
  summary: "Looking at your board, I can see a few sticky notes and shapes placed around the canvas. It looks like you're in early ideation mode — great start! Consider grouping related notes together with colored sections to build structure. Would you like tips on organizing your board?",
  figjam: "FigJam is a collaborative whiteboard tool. You can: \n• Add sticky notes (press S) \n• Draw freehand (press P) \n• Place shapes like rectangles and ellipses \n• Move and zoom the infinite canvas \n• Use the AI assistant (that's me!) to get creative help. What would you like to explore?",
};

function simulateResponse(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("brainstorm") || p.includes("sticky") || p.includes("note")) return AI_RESPONSES.brainstorm;
  if (p.includes("layout") || p.includes("organiz") || p.includes("structure")) return AI_RESPONSES.layout;
  if (p.includes("summar") || p.includes("board") || p.includes("what")) return AI_RESPONSES.summary;
  if (p.includes("figjam") || p.includes("can i") || p.includes("create") || p.includes("help")) return AI_RESPONSES.figjam;
  return `That's an interesting question about "${prompt}". In a collaborative whiteboard context, I'd suggest starting by mapping out your key ideas visually — one concept per sticky note. Group related themes together, then draw connections between them. Would you like me to suggest a specific framework for this?`;
}

let _msgId = 0;
const msgId = () => `m${++_msgId}`;

// ── AIDialog Component ─────────────────────────────────────────────────────────

interface AIDialogProps {
  open: boolean;
  onClose: () => void;
}

function AIDialog({ open, onClose }: AIDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: msgId(),
      role: "assistant",
      content: AI_RESPONSES.default,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    setInput("");

    const userMsg: ChatMessage = { id: msgId(), role: "user", content: text };
    const assistantId = msgId();
    const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "", streaming: true };

    setMessages(p => [...p, userMsg, assistantMsg]);
    setIsTyping(true);

    // Simulate streaming token by token
    const response = simulateResponse(text);
    let i = 0;
    const tick = () => {
      if (i >= response.length) {
        setMessages(p => p.map(m => m.id === assistantId ? { ...m, streaming: false } : m));
        setIsTyping(false);
        return;
      }
      const chunk = response.slice(i, i + Math.floor(Math.random() * 4) + 2);
      i += chunk.length;
      setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m));
      setTimeout(tick, 18 + Math.random() * 20);
    };
    setTimeout(tick, 400);
  }, [isTyping]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-end pointer-events-none"
      style={{ padding: "0 24px 90px 0" }}
    >
      <div
        className="pointer-events-auto flex flex-col rounded-2xl overflow-hidden"
        style={{
          width: 380,
          height: 520,
          background: "#ffffff",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.07)",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] shrink-0"
          style={{ background: "linear-gradient(135deg, #3742FA 0%, #7B61FF 100%)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm leading-tight">AI Assistant</div>
              <div className="text-white/60 text-[11px] font-medium">Powered by Claude</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
          style={{ scrollbarWidth: "none" }}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${msg.role === "assistant"
                ? "bg-gradient-to-br from-[#3742FA] to-[#7B61FF]"
                : "bg-gray-200"
                }`}>
                {msg.role === "assistant"
                  ? <Bot size={12} className="text-white" />
                  : <User size={12} className="text-gray-600" />
                }
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                  ? "bg-[#3742FA] text-white rounded-tr-sm"
                  : "bg-gray-100 text-gray-800 rounded-tl-sm"
                  }`}
              >
                <span className="whitespace-pre-wrap">{msg.content}</span>
                {msg.streaming && (
                  <span className="inline-block w-1.5 h-4 bg-current opacity-70 ml-0.5 align-middle animate-pulse rounded-sm" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && !isTyping && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
            {AI_SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-2.5 py-1.5 rounded-full border border-[#3742FA]/30 text-[#3742FA] hover:bg-[#3742FA]/8 transition-colors font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 shrink-0 border-t border-black/[0.06]">
          <div className="flex items-end gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask AI anything…"
              disabled={isTyping}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 leading-relaxed max-h-24"
              style={{ fontFamily: "inherit", scrollbarWidth: "none" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 mb-0.5"
              style={{
                background: input.trim() && !isTyping ? "#3742FA" : "#E5E7EB",
                color: input.trim() && !isTyping ? "#fff" : "#9CA3AF",
              }}
            >
              <Send size={13} />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-1.5">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIDialog;
