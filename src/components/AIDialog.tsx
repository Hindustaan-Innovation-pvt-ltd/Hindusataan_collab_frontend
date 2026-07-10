import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Send, Bot, User, Paperclip } from "lucide-react";
import { toPng } from "html-to-image";
import type { ChatMessage, El } from "../types";
import { chatService } from "../services/chatService";

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



let _msgId = 0;
const msgId = () => `m${++_msgId}`;

// ── AIDialog Component ─────────────────────────────────────────────────────────

interface AIDialogProps {
  open: boolean;
  onClose: () => void;
  boardId?: string;
  boardName?: string;
  els?: El[];
  onAIAction?: (action: string, data: any) => void;
}

export const AIDialog = React.memo(function AIDialog({ open, onClose, boardId, boardName, els = [], onAIAction }: AIDialogProps) {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsTyping(true);
    const userMsgId = msgId();
    const userMsg: ChatMessage = { id: userMsgId, role: "user", content: `Uploading file: ${file.name}... (0%)` };
    setMessages(p => [...p, userMsg]);
    
    try {
      const taskId = await chatService.uploadFile(file, (progress: number) => {
        setMessages(p => p.map(m => m.id === userMsgId ? { ...m, content: `Uploading file: ${file.name}... (${progress}%)` } : m));
      });
      const assistantId = msgId();
      setMessages(p => [...p, { id: assistantId, role: "assistant", content: "Processing file, please wait..." }]);
      
      const checkStatus = async () => {
        try {
          const status = await chatService.checkFileStatus(taskId);
          if (status.status !== "Ready" && status.status !== "Error") {
            setTimeout(checkStatus, 2000);
          } else if (status.status === "Ready") {
            setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: "File processed successfully! You can now query it using the `/doc <question>` command." } : m));
            setIsTyping(false);
          } else {
            const errorMsg = status.error ? `Error processing file: ${status.error}` : "Error processing file.";
            setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: errorMsg } : m));
            setIsTyping(false);
          }
        } catch (err: any) {
          setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: `Error processing file: ${err.message}` } : m));
          setIsTyping(false);
        }
      };
      setTimeout(checkStatus, 2000);
    } catch (err) {
      setMessages(p => [...p, { id: msgId(), role: "assistant", content: "Error uploading file." }]);
      setIsTyping(false);
    }
    // reset input
    e.target.value = '';
  };

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

    const sessionId = "session-" + (boardId || "default");
    
    try {
      const lower = text.toLowerCase();
      const isBoardCapture = lower.includes("what is written on this board") || lower.includes("read the board") || lower.includes("handwritten") || lower.includes("handwriting") || text.startsWith("/vision");
      const isDoc = text.startsWith("/doc") || lower.includes("this pdf") || lower.includes("the pdf") || lower.includes("this document") || lower.includes("the document") || lower.includes("this file") || lower.includes("the file") || lower.includes("uploaded file") || lower.includes("this image") || lower.includes("the image") || lower.includes("this pic") || lower.includes("the pic") || lower.includes("this jpeg") || lower.includes("this png") || lower.includes("this doc") || lower === "explain this";

      if (isBoardCapture) {
        try {
          const boardNode = document.getElementById("figjam-board-capture");
          if (boardNode) {
            setMessages(p => [...p, { id: assistantId, role: "assistant", content: "Capturing whiteboard and analyzing handwriting..." }]);
            
            const dataUrl = await toPng(boardNode, { backgroundColor: "#f5f5f5" });
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], "board_capture.png", { type: "image/png" });
            
            const taskId = await chatService.uploadFile(file);
            
            const checkStatus = async () => {
              try {
                const status = await chatService.checkFileStatus(taskId);
                if (status.status !== "Ready" && status.status !== "Error") {
                  setTimeout(checkStatus, 2000);
                } else if (status.status === "Ready") {
                  setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: "Reading handwriting...\n\n" } : m));
                  try {
                    const answer = await chatService.searchDocument(boardId || "", text);
                    setMessages(p => p.map(m => m.id === assistantId ? { ...m, streaming: false, content: "Reading handwriting...\n\n" + answer } : m));
                  } catch (err) {
                    console.error(err);
                    setMessages(p => p.map(m => m.id === assistantId ? { ...m, streaming: false, content: m.content + "\n\n(Error: Unable to reach vision backend)" } : m));
                  }
                  setIsTyping(false);
                } else {
                  setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: "Error processing handwriting." } : m));
                  setIsTyping(false);
                }
              } catch (err) {
                setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: "Error communicating with vision server." } : m));
                setIsTyping(false);
              }
            };
            setTimeout(checkStatus, 2000);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (isDoc) {
        let prompt = text;
        if (text.startsWith("/doc")) {
          prompt = text.replace("/doc", "").trim() || "Summarize the document";
        }
        try {
          const answer = await chatService.searchDocument(boardId || "", prompt);
          setMessages(p => p.map(m => m.id === assistantId ? { ...m, streaming: false, content: answer } : m));
        } catch (err) {
          console.error(err);
          setMessages(p => p.map(m => m.id === assistantId ? { ...m, streaming: false, content: "\n\n(Error: Unable to reach document backend)" } : m));
        }
        setIsTyping(false);
        return;
      }

      const isFlowchart = text.startsWith("/flowchart");
      if (isFlowchart) {
        let prompt = text.replace("/flowchart", "").trim() || "Generate a flowchart";
        setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: "Generating flowchart..." } : m));
        try {
          const mermaid = await chatService.generateFlowchart(prompt);
          if (onAIAction) onAIAction("create_flowchart", { mermaid });
          setMessages(p => p.map(m => m.id === assistantId ? { ...m, streaming: false, content: "I've created the flowchart on the board for you!" } : m));
        } catch (err) {
          console.error(err);
          setMessages(p => p.map(m => m.id === assistantId ? { ...m, streaming: false, content: "\n\n(Error: Unable to generate flowchart)" } : m));
        }
        setIsTyping(false);
        return;
      }

      const isGraph = text.startsWith("/graph");
      if (isGraph) {
        let prompt = text.replace("/graph", "").trim() || "Generate a graph";
        setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: "Generating graph..." } : m));
        try {
          const graphData = await chatService.generateGraph(prompt, boardId);
          if (onAIAction) onAIAction("create_graph", graphData);
          setMessages(p => p.map(m => m.id === assistantId ? { ...m, streaming: false, content: "I've created the graph on the board for you!" } : m));
        } catch (err) {
          console.error(err);
          setMessages(p => p.map(m => m.id === assistantId ? { ...m, streaming: false, content: "\n\n(Error: Unable to generate graph)" } : m));
        }
        setIsTyping(false);
        return;
      }

      await chatService.askStream(
        text,
        sessionId,
        { boardId, boardName, nodes: els },
        (chunk) => {
          setMessages(p => p.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m));
        },
        () => {
          setMessages(p => {
            const finalMsgs = [...p];
            const msg = finalMsgs.find(m => m.id === assistantId);
            if (msg) {
              msg.streaming = false;
              console.log("Raw AI stream response:", msg.content);
              let hasAction = false;
              
              // We parse out JSON action blocks
              // First look for markdown-wrapped JSON
              const mdRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/ig;
              let match;
              let foundMd = false;

              const parseAndDispatch = (jsonStr: string) => {
                let cleanedJsonStr = jsonStr.replace(/;\s*\}/g, '}').replace(/;\s*\]/g, ']');
                let success = false;

                try {
                  const actionObj = JSON.parse(cleanedJsonStr);
                  if (actionObj && onAIAction && actionObj.action) {
                    console.log("Dispatching AI Action:", actionObj.action, actionObj.data);
                    onAIAction(actionObj.action, actionObj.data);
                    success = true;
                  }
                } catch (e) {
                  // Auto-fix LLM formatting issues
                  const fixes = ["}", "}}", "]}", "]}}", "}]}", "}]}}", '"}', '"}}', '"]}', '"]}}'];
                  for (const fix of fixes) {
                    try {
                      let testStr = cleanedJsonStr.replace(/[;,]\s*$/, '') + fix;
                      const actionObj = JSON.parse(testStr);
                      if (actionObj && onAIAction && actionObj.action) {
                        console.log("Dispatching AI Action:", actionObj.action, actionObj.data);
                        onAIAction(actionObj.action, actionObj.data);
                        success = true;
                        break;
                      }
                    } catch (e2) {}
                  }
                  
                  // Try parsing as JSON lines (multiple objects)
                  if (!success) {
                    const lines = cleanedJsonStr.split('\n');
                    for (let line of lines) {
                      try {
                        line = line.trim();
                        if (!line) continue;
                        if (line.endsWith(',')) line = line.slice(0, -1);
                        const obj = JSON.parse(line);
                        if (obj && onAIAction && obj.action) {
                          console.log("Dispatching AI Action (line):", obj.action, obj.data);
                          onAIAction(obj.action, obj.data);
                          success = true;
                        }
                      } catch (e3) {}
                    }
                  }

                  // If JSON parse STILL fails, use regex extraction for flowcharts or graphs
                  if (!success) {
                    if (cleanedJsonStr.includes('"create_flowchart"')) {
                      const mermaidMatch = cleanedJsonStr.match(/"mermaid"\s*:\s*"([\s\S]*)/);
                      if (mermaidMatch) {
                        let str = mermaidMatch[1];
                        str = str.replace(/"\s*(\}\s*)*$/, '');
                        if (onAIAction) onAIAction("create_flowchart", { mermaid: str.replace(/\\n/g, '\n') });
                        success = true;
                      }
                    } else if (cleanedJsonStr.includes('"create_graph"')) {
                      const titleMatch = cleanedJsonStr.match(/"title"\s*:\s*"([^"]+)"/);
                      const typeMatch = cleanedJsonStr.match(/"chartType"\s*:\s*"([^"]+)"/);
                      if (typeMatch && onAIAction) {
                        onAIAction("create_graph", { 
                          title: titleMatch ? titleMatch[1] : "Graph", 
                          chartType: typeMatch[1],
                          labels: ["Q1", "Q2", "Q3", "Q4"],
                          datasets: [{ label: "Data", data: [10, 20, 30, 40] }]
                        });
                        success = true;
                      }
                    }
                  }
                }
                
                if (!success) console.error("Failed to parse action json", jsonStr);
                return success;
              };

              while ((match = mdRegex.exec(msg.content)) !== null) {
                foundMd = true;
                if (parseAndDispatch(match[1].trim())) hasAction = true;
              }

              // If no markdown block found, check if the entire message (or part of it) is a raw JSON object
              if (!foundMd) {
                const rawRegex = /\{[\s\S]*"action"\s*:\s*"[^"]+"[\s\S]*\}/g;
                while ((match = rawRegex.exec(msg.content)) !== null) {
                  if (parseAndDispatch(match[0].trim())) hasAction = true;
                }
              }

              // Strip JSON block from chat display so it just shows the text part
              if (hasAction) {
                msg.content = msg.content
                  .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/ig, "")
                  .replace(/```mermaid\s*[\s\S]*?\s*```/gi, "")
                  .replace(/\{[\s\S]*"action"\s*:\s*"[^"]+"[\s\S]*\}/g, "")
                  .trim();
                
                if (!msg.content) {
                  msg.content = "I've created that on the canvas for you!";
                } else {
                  msg.content += "\n\n*(Created on the canvas!)*";
                }
              }
            }
            return finalMsgs;
          });
          setIsTyping(false);
        },
        (err) => {
          console.error(err);
          setMessages(p => p.map(m => m.id === assistantId ? { ...m, streaming: false, content: m.content + "\n\n(Error: Unable to reach backend)" } : m));
          setIsTyping(false);
        }
      );
    } catch (err) {
      console.error(err);
      setMessages(p => p.map(m => m.id === assistantId ? { ...m, streaming: false, content: m.content + "\n\n(Error: Request failed)" } : m));
      setIsTyping(false);
    }
  }, [isTyping, boardId, boardName, els, onAIAction]);

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
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
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
            <input type="file" ref={fileInputRef} hidden accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.pptx,.md" onChange={handleFileUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 mb-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200"
              title="Upload File (Image, PDF, Word, Excel, etc.)"
            >
              <Paperclip size={16} />
            </button>
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
});

export default AIDialog;
