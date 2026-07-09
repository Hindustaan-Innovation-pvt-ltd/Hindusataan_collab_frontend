import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, MessageSquare } from "lucide-react";
import IconNode from "../components/IconNode";
// import { toPng } from "html-to-image";

import type { Tool, ShapeKind, Pt, ShapeEl, PenType, PenThickness, PathEl, ConnectionEl, FreeArrowEl, El, Cam, Board, Peer, Comment, StickyEl, GraphEl, TableEl } from "../types";
import { STICKY_COLORS, SHAPE_COLORS, PEN_COLORS, INIT_ELS } from "../constants";
import { uid, worldPt, pathD, getElementBox, getBoundaryPt } from "../utils";

import StickyNote from "../components/StickyNote";
import TextNode from "../components/TextNode";
import ShapeNode from "../components/ShapeNode";
import TableNode from "../components/TableNode";
import GraphNode from "../components/GraphNode";
import AIDialog from "../components/AIDialog";
import Toolbar from "../components/Toolbar";
import { parseMermaidToElements } from "../utils/mermaidParser";

import TopBar from "../components/TopBar";
import ContextMenu from "../components/ContextMenu";
import { BoardChat } from "../components/BoardChat";
import { liveChatService, type LiveChatMessage } from "../services/liveChatService";
import { websocketService } from '../services/websocketService';

// ── App ───────────────────────────────────────────────────────────────────────



const getSessionUser = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "Guest";
    const s = localStorage.getItem("figjam_session");
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed && parsed.name) return parsed.name;
    }
  } catch (e) { }
  return "Guest";
};

interface AppProps {
  initialBoardId?: string;
  initialName?: string;
  initialEls?: El[];
  initialCam?: Cam;
  onSave?: (name: string, els: El[], cam: Cam) => void;
  role?: "owner" | "editor" | "viewer";
}

export default function App({ initialBoardId, initialName, initialEls, initialCam, onSave, role = "owner" }: AppProps = {}) {
  const [tool, setTool] = useState<Tool>("select");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommentWindowOpen, setIsCommentWindowOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [activePlacement, setActivePlacement] = useState<{ x: number, y: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [els, setEls] = useState<El[]>(INIT_ELS);
  const [currentBoardId, setCurrentBoardId] = useState<string>("");
  const [boardName, setBoardName] = useState("Untitled Board");
  const [boardBg, setBoardBg] = useState<"white" | "black" | "green">("white");
  const [selIds, setSelIds] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Live Chat State
  const [liveChatMessages, setLiveChatMessages] = useState<LiveChatMessage[]>([]);
  const [liveChatTypingUsers, setLiveChatTypingUsers] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [cam, setCam] = useState<Cam>({ x: 0, y: 0, z: 1 });
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0]);
  const [shapeColor, setShapeColor] = useState(SHAPE_COLORS[0]);
  const [shapeKind, setShapeKind] = useState<ShapeKind>("rect");
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [penType, setPenType] = useState<PenType>("pen");
  const [penThickness, setPenThickness] = useState<PenThickness>("thin");
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const [livePts, setLivePts] = useState<Pt[]>([]);
  const [liveArrow, setLiveArrow] = useState<{ start: Pt, end: Pt } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string | null } | null>(null);

  const [history, setHistory] = useState<El[][]>([INIT_ELS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoRef = useRef(false);
  const isRemoteUpdateRef = useRef(false);

  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      setHistory(h => {
        if (h[historyIndex] === els) return h;
        const newHistory = h.slice(0, historyIndex + 1);
        newHistory.push(els);
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, 300);
    return () => clearTimeout(t);
  }, [els, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEls(history[newIndex]);
      setSelIds([]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEls(history[newIndex]);
      setSelIds([]);
    }
  }, [historyIndex, history]);

  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  undoRef.current = undo;
  redoRef.current = redo;

  const wrapRef = useRef<HTMLDivElement>(null);
  const clipboardRef = useRef<El[]>([]);

  // Stable refs for use inside callbacks
  const camRef = useRef(cam);
  const elsRef = useRef(els);
  const toolRef = useRef(tool);
  const editIdRef = useRef(editId);
  const selIdsRef = useRef(selIds);
  const stickyColorRef = useRef(stickyColor);
  const shapeColorRef = useRef(shapeColor);
  const shapeKindRef = useRef(shapeKind);
  const penColorRef = useRef(penColor);
  const penTypeRef = useRef(penType);
  const penThicknessRef = useRef(penThickness);
  const boardBgRef = useRef(boardBg);
  const spaceRef = useRef(false);

  useEffect(() => { camRef.current = cam; }, [cam]);
  useEffect(() => { elsRef.current = els; }, [els]);
  useEffect(() => { editIdRef.current = editId; }, [editId]);
  useEffect(() => { selIdsRef.current = selIds; }, [selIds]);
  useEffect(() => { stickyColorRef.current = stickyColor; }, [stickyColor]);
  useEffect(() => { shapeColorRef.current = shapeColor; }, [shapeColor]);
  useEffect(() => { shapeKindRef.current = shapeKind; }, [shapeKind]);
  useEffect(() => {
    penColorRef.current = penColor;
    penTypeRef.current = penType;
    penThicknessRef.current = penThickness;
    toolRef.current = tool;
  }, [penColor, penType, penThickness, tool]);
  useEffect(() => { boardBgRef.current = boardBg; }, [boardBg]);
  
  const lastCursorSendRef = useRef<number>(0);
  const lastSentCursorPtRef = useRef<{ x: number, y: number } | null>(null);
  const pendingCursorTimerRef = useRef<number | null>(null);
  const cursorStatsRef = useRef({ total: 0, sent: 0, droppedThrottle: 0, droppedTiny: 0, lastLog: Date.now() });

  // Interaction state refs
  const panRef = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number }[] | null>(null);
  const hasDraggedRef = useRef(false);
  const clickEditRef = useRef<string | null>(null);
  const drawRef = useRef<Pt[]>([]);
  const arrowRef = useRef<{ id: string; start: Pt } | null>(null);

  // Center canvas on mount and load board
  useEffect(() => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    if (initialBoardId) {
      setCurrentBoardId(initialBoardId);
      setBoardName(initialName || "Untitled Board");
      setEls(initialEls !== undefined ? initialEls : INIT_ELS);
      setCam(initialCam || { x: cx, y: cy, z: 1 });
      return;
    }

    setCam({ x: cx, y: cy, z: 1 });
    setEls(INIT_ELS);
  }, [initialBoardId]);

  // Load chat history
  useEffect(() => {
    if (currentBoardId) {
      liveChatService.getChatHistory(currentBoardId)
        .then(msgs => setLiveChatMessages(msgs))
        .catch(err => console.error("Failed to load chat history:", err));
    }
  }, [currentBoardId]);

  // Handle incoming websocket updates
  useEffect(() => {
    websocketService.onMessageCallback = (msg) => {
      if (msg.type === "board_update" && msg.payload) {
        isRemoteUpdateRef.current = true;
        if (msg.payload.els) setEls(msg.payload.els);
        if (msg.payload.cam) setCam(msg.payload.cam);
      } else if (msg.type === "cursor_update" && msg.payload) {
        console.log("Cursor message received:", msg.payload);
        setPeers(prev => {
          const idx = prev.findIndex(p => p.id === msg.payload.user_id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], tx: msg.payload.x, ty: msg.payload.y };
            console.log("Remote cursor state updated for:", msg.payload.user_id);
            return next;
          }
          return prev;
        });
      } else if (msg.type === "presence") {
        setOnlineUsers(msg.online_users || []);
        setPeers(prev => {
           const next = [...prev];
           const currentIds = next.map(p => p.id);
           (msg.online_users || []).forEach((u: any) => {
             if (!currentIds.includes(u.user_id)) {
               // initialize at center or arbitrary point, it will quickly lerp
               next.push({ id: u.user_id, name: u.name, color: u.color, x: 0, y: 0, tx: 0, ty: 0 });
             }
           });
           const onlineIds = (msg.online_users || []).map((u: any) => u.user_id);
           const nextFiltered = next.filter(p => {
             const keep = onlineIds.includes(p.id);
             if (!keep) console.log("User disconnected, removing cursor for:", p.id);
             return keep;
           });
           return nextFiltered;
        });
      } else if (msg.type === "chat_message") {
        setLiveChatMessages(prev => [...prev, msg.payload as LiveChatMessage]);
        if (!isChatOpen) {
          setChatUnreadCount(prev => prev + 1);
        }
      } else if (msg.type === "typing_start") {
        setLiveChatTypingUsers(prev => {
          if (!prev.includes(msg.payload.username)) return [...prev, msg.payload.username];
          return prev;
        });
      } else if (msg.type === "typing_stop") {
        setLiveChatTypingUsers(prev => prev.filter(name => name !== msg.payload.username));
      }
    };
    return () => {
      websocketService.onMessageCallback = null;
    };
  }, [isChatOpen]);

  // Send websocket updates (debounced)
  useEffect(() => {
    if (!currentBoardId || role === "viewer") return;
    
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      websocketService.send("board_update", { els, cam });
    }, 100);

    return () => clearTimeout(timeout);
  }, [els, cam, currentBoardId, role]);

  // Save to backend
  useEffect(() => {
    if (!currentBoardId || role === "viewer") return;
    
    if (onSave) {
      onSave(boardName, els, cam);
    }
  }, [els, cam, boardName, currentBoardId, boardBg, onSave]);

  // Load comments
  useEffect(() => {
    const saved = localStorage.getItem("figjam-comments");
    if (saved) {
      try {
        setComments(JSON.parse(saved));
      } catch (e) { }
    }
  }, []);

  // Save comments
  useEffect(() => {
    localStorage.setItem("figjam-comments", JSON.stringify(comments));
  }, [comments]);

  // Cursor Interpolation Loop
  useEffect(() => {
    let animationFrameId: number;
    const loop = () => {
      setPeers(prev => {
        let changed = false;
        const next = prev.map(p => {
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            changed = true;
            return { ...p, x: p.x + dx * 0.3, y: p.y + dy * 0.3 };
          }
          return p;
        });
        return changed ? next : prev;
      });
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // ── Zoom ──────────────────────────────────────────────────────────────────

  const doZoom = useCallback((dir: number, cx?: number, cy?: number) => {
    setCam(prev => {
      const factor = dir > 0 ? 1.02 : 1 / 1.02;
      const nz = Math.max(0.08, Math.min(6, prev.z * factor));
      const px = cx ?? (wrapRef.current ? wrapRef.current.clientWidth / 2 : 0);
      const py = cy ?? (wrapRef.current ? wrapRef.current.clientHeight / 2 : 0);
      return {
        z: nz,
        x: px - (px - prev.x) * (nz / prev.z),
        y: py - (py - prev.y) * (nz / prev.z),
      };
    });
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.target !== document.body && (e.target as HTMLElement).tagName !== "DIV") return;
      if (editIdRef.current) return;

      if (e.code === "Space") {
        spaceRef.current = true;
        setSpaceHeld(true);
        e.preventDefault();
        return;
      }

      if (role === "viewer") return; // Viewers can only pan


      if (e.key === "Delete" || e.key === "Backspace") {
        if (selIdsRef.current.length > 0) {
          setEls(p => p.filter(el => !selIdsRef.current.includes(el.id)));
          setSelIds([]);
        }
        return;
      }

      if (e.key === "Escape") { setSelIds([]); setEditId(null); return; }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          redoRef.current();
        } else {
          undoRef.current();
        }
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        redoRef.current();
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (selIdsRef.current.length > 0) {
          clipboardRef.current = elsRef.current.filter(ex => selIdsRef.current.includes(ex.id));
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (clipboardRef.current.length > 0) {
          const newEls = clipboardRef.current.map(el => {
            const newEl = { ...el, id: uid() };
            if ('x' in newEl) newEl.x += 20;
            if ('y' in newEl) newEl.y += 20;
            return newEl;
          });
          setEls(p => [...p, ...newEls]);
          setSelIds(newEls.map(e => e.id));
        }
        return;
      }

      const toolMap: Record<string, Tool> = {
        v: "select", h: "hand", s: "sticky", t: "text", r: "shape", p: "pen", e: "eraser", a: "arrow", l: "table", c: "comment"
      };
      if (e.ctrlKey || e.metaKey) {
        const mapped = toolMap[e.key.toLowerCase()];
        if (mapped) {
          e.preventDefault();
          setTool(mapped);
        }
      }
    };

    const onUp = (e: KeyboardEvent) => {
      if (e.code === "Space") { spaceRef.current = false; setSpaceHeld(false); }
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, []);

  // ── Wheel ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        doZoom(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY);
      } else {
        setCam(p => ({ ...p, x: p.x - e.deltaX * 0.8, y: p.y - e.deltaY * 0.8 }));
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [doZoom]);

  // ── Pointer events ────────────────────────────────────────────────────────

  const getRect = () => wrapRef.current!.getBoundingClientRect();

  const onPtrDown = useCallback((e: React.PointerEvent) => {
    setToolMenuOpen(false);
    setAiOpen(false);
    setContextMenu(null);
    if (e.button === 2) return; // Right click

    if (editIdRef.current) return;
    
    const isPan = toolRef.current === "hand" || spaceRef.current;

    if (role === "viewer" && !isPan) return; // Viewers can only pan

    if (isPan) {
      panRef.current = { px: e.clientX, py: e.clientY, cx: camRef.current.x, cy: camRef.current.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    const elTarget = (e.target as HTMLElement).closest("[data-el-id]");

    const doConnect = (id: string, clientX: number, clientY: number) => {
      const startPt = worldPt(clientX, clientY, getRect(), camRef.current);
      arrowRef.current = { id, start: startPt };
      setLiveArrow({ start: startPt, end: startPt });

      const onMove = (me: PointerEvent) => {
        const pt = worldPt(me.clientX, me.clientY, getRect(), camRef.current);
        setLiveArrow({ start: startPt, end: pt });
      };
      const onUp = (ue: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);

        const elsUnder = document.elementsFromPoint(ue.clientX, ue.clientY);
        const upTarget = elsUnder.map(el => el.closest("[data-el-id]")).find(el => el != null);

        if (upTarget) {
          const toId = upTarget.getAttribute("data-el-id")!;
          if (toId !== id) {
            setEls(p => [...p, { id: uid(), type: "connection", from: id, to: toId, color: "#1C1B1F", x: 0, y: 0 }]);
          }
        } else {
          const newId = uid();
          const pt = worldPt(ue.clientX, ue.clientY, getRect(), camRef.current);
          setEls(p => [...p, {
            id: newId, type: "free_arrow",
            x: startPt.x, y: startPt.y,
            dx: pt.x - startPt.x, dy: pt.y - startPt.y,
            color: "#1C1B1F"
          }]);
          setSelIds([newId]);
        }
        arrowRef.current = null;
        setLiveArrow(null);
        setTool("select");
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    if (elTarget && toolRef.current === "select") {
      const id = elTarget.getAttribute("data-el-id")!;
      const rect = getRect();
      const w = worldPt(e.clientX, e.clientY, rect, camRef.current);
      const found = elsRef.current.find(el => el.id === id);

      if (found && !found.locked) {
        let newSel = selIdsRef.current;
        const wasAlreadySelected = newSel.includes(id) && newSel.length === 1;
        clickEditRef.current = wasAlreadySelected && found.type === "sticky" ? id : null;
        hasDraggedRef.current = false;

        if (e.shiftKey) {
          if (newSel.includes(id)) newSel = newSel.filter(x => x !== id);
          else newSel = [...newSel, id];
        } else {
          if (!newSel.includes(id)) newSel = [id];
        }
        setSelIds(newSel);

        dragRef.current = newSel.map(sid => {
          const sEl = elsRef.current.find(x => x.id === sid);
          return sEl ? { id: sid, ox: w.x - sEl.x, oy: w.y - sEl.y } : null;
        }).filter(Boolean) as { id: string, ox: number, oy: number }[];

        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
      return;
    }

    // Clicked empty canvas
    if (toolRef.current === "select") {
      if (!e.shiftKey) setSelIds([]);
      return;
    }

    const rect = getRect();
    const w = worldPt(e.clientX, e.clientY, rect, camRef.current);

    if (toolRef.current === "comment") {
      setActivePlacement({ x: w.x, y: w.y });
      setNewCommentText("");
      return;
    }

    if (toolRef.current === "sticky") {
      const id = uid();
      setEls(p => [...p, {
        id, type: "sticky", x: w.x - 100, y: w.y - 100, w: 200, h: 200,
        text: "", color: stickyColorRef.current,
      }]);
      setSelIds([id]);
      setTool("select");
      return;
    }

    if (toolRef.current === "text") {
      const id = uid();
      const textColor = boardBgRef.current === "white" ? "#1C1B1F" : "#FFFFFF";
      setEls(p => [...p, { id, type: "text", x: w.x, y: w.y, text: "Text", fontSize: 20, color: textColor }]);
      setSelIds([id]);
      setEditId(id);
      setTool("select");
      return;
    }

    if (toolRef.current === "shape") {
      const id = uid();
      setEls(p => [...p, {
        id, type: "shape",
        kind: shapeKindRef.current,
        x: w.x - 80, y: w.y - 60, w: 160, h: 120,
        color: shapeColorRef.current,
      }]);
      setSelIds([id]);
      setTool("select");
      return;
    }

    if (toolRef.current === "table") {
      const id = uid();
      setEls(p => [...p, {
        id, type: "table",
        x: w.x - 120, y: w.y - 40,
        rows: 2, cols: 2, cellW: 120, cellH: 40,
        data: {}, color: "#FFFFFF"
      }]);
      setSelIds([id]);
      setTool("select");
      return;
    }

    if (toolRef.current === "pen") {
      const startPt = worldPt(e.clientX, e.clientY, getRect(), camRef.current);
      drawRef.current = [startPt];
      setLivePts([startPt]);

      const onMove = (me: PointerEvent) => {
        const pt = worldPt(me.clientX, me.clientY, getRect(), camRef.current);
        drawRef.current.push(pt);
        setLivePts(drawRef.current.slice());
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (drawRef.current.length > 1) {
          const pts = drawRef.current.slice();
          const id = uid();
          const sw = penTypeRef.current === "highlighter" ? (penThicknessRef.current === "thick" ? 48 : 24) :
            penTypeRef.current === "marker" ? (penThicknessRef.current === "thick" ? 16 : 8) :
              (penThicknessRef.current === "thick" ? 6 : 2);
          setEls(p => [...p, { id, type: "path", x: 0, y: 0, pts, color: penColorRef.current, sw, penType: penTypeRef.current }]);
        }
        drawRef.current = [];
        setLivePts([]);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return;
    }

    if (toolRef.current === "eraser") {
      const doErase = (clientX: number, clientY: number) => {
        const elsUnder = document.elementsFromPoint(clientX, clientY);
        const elTarget = elsUnder.map(el => el.closest("[data-el-id]")).find(el => el != null);
        if (elTarget) {
          const id = elTarget.getAttribute("data-el-id")!;
          setEls(p => p.filter(x => {
            if (x.id === id && !x.locked && x.type === "path") return false;
            return true;
          }));
        }
      };

      doErase(e.clientX, e.clientY);

      const onMove = (me: PointerEvent) => doErase(me.clientX, me.clientY);
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return;
    }

    if (toolRef.current === "arrow") {
      if (elTarget) {
        const id = elTarget.getAttribute("data-el-id")!;
        doConnect(id, e.clientX, e.clientY);
      } else {
        const startPt = worldPt(e.clientX, e.clientY, getRect(), camRef.current);
        setLiveArrow({ start: startPt, end: startPt });

        const onMove = (me: PointerEvent) => {
          setLiveArrow({ start: startPt, end: worldPt(me.clientX, me.clientY, getRect(), camRef.current) });
        };
        const onUp = (ue: PointerEvent) => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          const endPt = worldPt(ue.clientX, ue.clientY, getRect(), camRef.current);
          if (Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y) > 5) {
            const newId = uid();
            setEls(p => [...p, {
              id: newId, type: "free_arrow",
              x: startPt.x, y: startPt.y,
              dx: endPt.x - startPt.x, dy: endPt.y - startPt.y,
              color: "#1C1B1F"
            }]);
            setSelIds([newId]);
          }
          setLiveArrow(null);
          setTool("select");
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }
      return;
    }
  }, []);

  const onPtrMove = useCallback((e: React.PointerEvent) => {
    const now = Date.now();
    const pt = worldPt(e.clientX, e.clientY, getRect(), camRef.current);
    
    // --- Cursor Optimization Logic ---
    cursorStatsRef.current.total++;
    let isTiny = false;
    
    if (lastSentCursorPtRef.current) {
      const dx = pt.x - lastSentCursorPtRef.current.x;
      const dy = pt.y - lastSentCursorPtRef.current.y;
      if (dx * dx + dy * dy < 9) { // less than 3 pixels
        isTiny = true;
      }
    }
    
    const send = (sendPt: {x: number, y: number}) => {
      console.log("Cursor message sent");
      websocketService.send("cursor_update", sendPt);
      lastSentCursorPtRef.current = sendPt;
      lastCursorSendRef.current = Date.now();
      cursorStatsRef.current.sent++;
    };

    if (isTiny) {
      cursorStatsRef.current.droppedTiny++;
    } else if (now - lastCursorSendRef.current > 50) {
      if (pendingCursorTimerRef.current) {
        window.clearTimeout(pendingCursorTimerRef.current);
        pendingCursorTimerRef.current = null;
      }
      send(pt);
    } else {
      cursorStatsRef.current.droppedThrottle++;
      if (pendingCursorTimerRef.current) window.clearTimeout(pendingCursorTimerRef.current);
      pendingCursorTimerRef.current = window.setTimeout(() => {
        send(pt);
        pendingCursorTimerRef.current = null;
      }, 50);
    }
    
    if (now - cursorStatsRef.current.lastLog > 2000) {
      if (cursorStatsRef.current.total > 0) {
        console.log(`[Cursor Optimization] Total: ${cursorStatsRef.current.total} | Sent: ${cursorStatsRef.current.sent} | Dropped (Throttle): ${cursorStatsRef.current.droppedThrottle} | Dropped (Tiny Move): ${cursorStatsRef.current.droppedTiny}`);
      }
      cursorStatsRef.current = { total: 0, sent: 0, droppedThrottle: 0, droppedTiny: 0, lastLog: now };
    }
    // ---------------------------------

    if (panRef.current) {
      const { px, py, cx, cy } = panRef.current;
      setCam(p => ({ ...p, x: cx + (e.clientX - px), y: cy + (e.clientY - py) }));
      return;
    }

    if (dragRef.current) {
      hasDraggedRef.current = true;
      const rect = getRect();
      const w = worldPt(e.clientX, e.clientY, rect, camRef.current);
      const dr = dragRef.current;
      setEls(p => p.map(el => {
        const d = dr.find(x => x.id === el.id);
        return d ? { ...el, x: w.x - d.ox, y: w.y - d.oy } : el;
      }));
      return;
    }

    if (drawRef.current.length > 0) {
      const rect = getRect();
      const w = worldPt(e.clientX, e.clientY, rect, camRef.current);
      drawRef.current = [...drawRef.current, w];
      setLivePts([...drawRef.current]);
    }
  }, []);

  const onPtrUp = useCallback((_e: React.PointerEvent) => {
    panRef.current = null;

    if (dragRef.current) {
      if (!hasDraggedRef.current && clickEditRef.current) {
        setEditId(clickEditRef.current);
      }
      clickEditRef.current = null;
      dragRef.current = null;
      return;
    }
  }, []);

  const onElDblClick = useCallback((id: string) => {
    if (id.includes("-")) {
      setEditId(id);
      setSelIds([id.split("-")[0]]);
      return;
    }
    const el = elsRef.current.find(e => e.id === id);
    if (el && (el.type === "sticky" || el.type === "text")) {
      setEditId(id);
      setSelIds([id]);
    }
  }, []);

  const onBlur = useCallback((id: string, text: string) => {
    if (id.includes("-")) {
      const [tableId, r, c] = id.split("-");
      setEls(p => p.map(el => {
        if (el.id === tableId && el.type === "table") {
          return { ...el, data: { ...el.data, [`${r},${c}`]: text } };
        }
        return el;
      }));
    } else {
      setEls(p => p.map(el => el.id === id ? { ...el, text } as El : el));
    }
    setEditId(null);
  }, []);

  const onUpdateEl = useCallback((id: string, partial: Partial<El>) => {
    setEls(p => p.map(el => el.id === id ? { ...el, ...partial } as El : el));
  }, []);

  const onDelete = useCallback(() => {
    if (selIdsRef.current.length > 0) {
      setEls(p => p.filter(el => !selIdsRef.current.includes(el.id)));
      setSelIds([]);
    }
  }, []);

  // ── AI Action Dispatcher ──────────────────────────────────────────────────
  const handleAIAction = useCallback((action: string, data: any) => {
    const cx = (window.innerWidth / 2 - camRef.current.x) / camRef.current.z;
    const cy = (window.innerHeight / 2 - camRef.current.y) / camRef.current.z;
    
    // Find an empty spot loosely (just slightly offset)
    const offsetX = Math.random() * 50 - 25;
    const offsetY = Math.random() * 50 - 25;
    const startX = cx + offsetX;
    const startY = cy + offsetY;

    if (action === "create_flowchart" && data.mermaid) {
      const newEls = parseMermaidToElements(data.mermaid, startX, startY);
      setEls(p => [...p, ...newEls]);
    } 
    else if (action === "create_graph" && data.chartType) {
      const newGraph: GraphEl = {
        id: uid(),
        type: "graph",
        w: 400, h: 300,
        x: startX - 200, y: startY - 150,
        color: "#ffffff",
        graphData: data
      };
      setEls(p => [...p, newGraph]);
    }
    else if (action === "create_sticky_notes" && data.notes) {
      const newEls: StickyEl[] = data.notes.map((n: any, i: number) => ({
        id: uid(),
        type: "sticky",
        w: 200, h: 200,
        x: startX - 100 + (i * 220),
        y: startY - 100,
        color: n.color || STICKY_COLORS[0],
        text: n.text || ""
      }));
      setEls(p => [...p, ...newEls]);
    }
    else if (action === "create_kanban" && data.columns) {
      const newEls: El[] = [];
      data.columns.forEach((col: string, i: number) => {
        const colId = uid();
        const colX = startX - 450 + (i * 300);
        const colY = startY - 300;
        newEls.push({
          id: colId, type: "shape", kind: "rect",
          w: 280, h: 600, color: "#f3f4f6",
          x: colX, y: colY, text: col
        } as ShapeEl);

        const tasks = data.tasks?.filter((t: any) => t.column === col) || [];
        tasks.forEach((task: any, j: number) => {
          newEls.push({
            id: uid(), type: "sticky",
            w: 240, h: 100, color: STICKY_COLORS[Math.floor(Math.random()*STICKY_COLORS.length)],
            x: colX + 20, y: colY + 60 + (j * 120),
            text: task.text
          });
        });
      });
      setEls(p => [...p, ...newEls]);
    }
    else if (action === "create_mindmap" && data.root) {
      // Basic 1-level mindmap for now
      const rootId = uid();
      const newEls: El[] = [{
        id: rootId, type: "shape", kind: "ellipse",
        w: 200, h: 100, color: "#3742FA", text: data.root,
        x: startX - 100, y: startY - 50
      }];
      if (data.children) {
        const radius = 250;
        data.children.forEach((child: any, i: number) => {
          const angle = (Math.PI * 2 * i) / data.children.length;
          const cx = startX - 80 + Math.cos(angle) * radius;
          const cy = startY - 40 + Math.sin(angle) * radius;
          const childId = uid();
          newEls.push({
            id: childId, type: "shape", kind: "rect",
            w: 160, h: 80, color: "#1ABCFE", text: child.text,
            x: cx, y: cy
          } as ShapeEl);
          newEls.push({
            id: uid(), type: "connection", from: rootId, to: childId,
            color: "#1C1B1F", x: 0, y: 0
          });
        });
      }
      setEls(p => [...p, ...newEls]);
    }
    else if (action === "create_table" && data.rows) {
      const newTable: TableEl = {
        id: uid(), type: "table",
        rows: data.rows, cols: data.cols,
        cellW: 120, cellH: 40,
        x: startX - (data.cols * 60), y: startY - (data.rows * 20),
        color: "#ffffff",
        data: data.data || {}
      };
      setEls(p => [...p, newTable]);
    }
  }, []);

  // ── Cursor ────────────────────────────────────────────────────────────────

  const cursor = spaceHeld || tool === "hand" ? "grab" :
    tool === "eraser" ? "crosshair" :
      tool === "select" ? "default" : "crosshair";

  // ── Render ────────────────────────────────────────────────────────────────

  const onStartConnect = useCallback((e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const startPt = worldPt(e.clientX, e.clientY, getRect(), camRef.current);
    arrowRef.current = { id, start: startPt };
    setLiveArrow({ start: startPt, end: startPt });

    const onMove = (me: PointerEvent) => {
      const pt = worldPt(me.clientX, me.clientY, getRect(), camRef.current);
      setLiveArrow({ start: startPt, end: pt });
    };
    const onUp = (ue: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);

      const elsUnder = document.elementsFromPoint(ue.clientX, ue.clientY);
      const upTarget = elsUnder.map(el => el.closest("[data-el-id]")).find(el => el != null);

      if (upTarget) {
        const toId = upTarget.getAttribute("data-el-id")!;
        if (toId !== id) {
          setEls(p => [...p, { id: uid(), type: "connection", from: id, to: toId, color: "#1C1B1F", x: 0, y: 0 }]);
        }
      } else {
        const newId = uid();
        const pt = worldPt(ue.clientX, ue.clientY, getRect(), camRef.current);
        const newShape: ShapeEl = {
          id: newId, type: "shape", kind: shapeKindRef.current || "rect",
          x: pt.x - 80, y: pt.y - 60, w: 160, h: 120,
          color: shapeColorRef.current || "#FF6B6B"
        };
        setEls(p => [...p, newShape, { id: uid(), type: "connection", from: id, to: newId, color: "#1C1B1F", x: 0, y: 0 }]);
        setSelIds([newId]);
      }
      arrowRef.current = null;
      setLiveArrow(null);
      setTool("select");
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const elsUnder = document.elementsFromPoint(e.clientX, e.clientY);
    const elTarget = elsUnder.map(el => el.closest("[data-el-id]")).find(el => el != null);

    if (elTarget) {
      const id = elTarget.getAttribute("data-el-id")!;
      if (!selIdsRef.current.includes(id)) {
        setSelIds([id]);
      }
      setContextMenu({ x: e.clientX, y: e.clientY, id });
    } else {
      setContextMenu({ x: e.clientX, y: e.clientY, id: selIdsRef.current.length > 0 ? selIdsRef.current[0] : null });
    }
  }, []);

  const onInsertIcon = useCallback((iconName: string) => {
    // Place the new icon at the current center of the visible canvas
    const centerScreen = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const centerWorld = worldPt(centerScreen.x, centerScreen.y, getRect(), camRef.current);

    const id = uid();
    const size = 48;
    setEls(p => [...p, {
      id, type: "icon",
      iconName,
      x: centerWorld.x - size / 2,
      y: centerWorld.y - size / 2,
      size,
      color: "#1C1B1F",
    }]);
    setSelIds([id]);
  }, []);

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ cursor, fontFamily: "'Plus Jakarta Sans', sans-serif", userSelect: "none" }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-300"
        style={{
          backgroundColor: boardBg === "white" ? "#F5F5F5" : boardBg === "black" ? "#111111" : "#1B4D3E",
          backgroundImage: boardBg === "white"
            ? "radial-gradient(circle, #C0BEB6 1.3px, transparent 1.3px)"
            : boardBg === "black"
              ? "radial-gradient(circle, #333333 1.3px, transparent 1.3px)"
              : "radial-gradient(circle, rgba(255,255,255,0.12) 1.3px, transparent 1.3px)",
          backgroundSize: `${24 * cam.z}px ${24 * cam.z}px`,
          backgroundPosition: `${cam.x % (24 * cam.z)}px ${cam.y % (24 * cam.z)}px`,
        }}
      />

      {/* Canvas event capture */}
      <div
        id="figjam-board-capture"
        ref={wrapRef}
        className="absolute inset-0"
        onPointerDown={onPtrDown}
        onPointerMove={onPtrMove}
        onPointerUp={onPtrUp}
        onContextMenu={handleContextMenu}
      >
        {/* Camera transform */}
        <div
          className="absolute origin-top-left"
          style={{ transform: `translate(${cam.x}px,${cam.y}px) scale(${cam.z})` }}
        >
          {/* Main elements loop */}
          {els.map(el => {
            if (el.type === "sticky") {
              return (
                <StickyNote
                  key={el.id} el={el}
                  selected={selIds.includes(el.id)} editing={editId === el.id}
                  zoom={cam.z}
                  onBlur={onBlur} onDblClick={onElDblClick}
                  onStartConnect={onStartConnect}
                  onUpdate={onUpdateEl}
                />
              );
            }
            if (el.type === "text") {
              return (
                <TextNode
                  key={el.id} el={el}
                  selected={selIds.includes(el.id)} editing={editId === el.id}
                  onBlur={onBlur} onDblClick={onElDblClick}
                />
              );
            }
            // if (el.type === "shape") {
            //   return <ShapeNode key={el.id} el={el} selected={selIds.includes(el.id)} onStartConnect={onStartConnect} />;
            // }
            if (el.type === "shape") {
              return (
                <ShapeNode
                  key={el.id}
                  el={el as ShapeEl}
                  selected={selIds.includes(el.id)}
                  onStartConnect={onStartConnect}
                  editing={editId === el.id}

                  // Fixed: Using Object.assign to bypass type union spreading errors
                  onResize={(id, partial) => {
                    setEls((current) =>
                      current.map((item) =>
                        item.id === id ? (Object.assign({}, item, partial) as any) : item
                      ) as El[]
                    );
                  }}

                  onDblClick={(id) => setEditId(id)}

                  onBlur={(id, text) => {
                    setEls((current) =>
                      current.map((item) =>
                        item.id === id ? (Object.assign({}, item, { text }) as any) : item
                      ) as El[]
                    );
                    setEditId(null);
                  }}
                />
              );
            }



            if (el.type === "table") {
              return (
                <TableNode
                  key={el.id} el={el}
                  selected={selIds.includes(el.id)}
                  editingId={editId}
                  zoom={cam.z}
                  onBlur={onBlur}
                  onDblClick={onElDblClick}
                  onUpdate={onUpdateEl}
                />
              );
            }
            if (el.type === "icon") {
              return (
                <IconNode
                  key={el.id}
                  el={el}
                  selected={selIds.includes(el.id)}
                  onResize={(id, size) => onUpdateEl(id, { size })}
                />
              );
            }
            if (el.type === "connection") {
              const c = el as ConnectionEl;
              const fromEl = els.find(x => x.id === c.from);
              const toEl = els.find(x => x.id === c.to);
              if (!fromEl || !toEl) return null;

              const box1 = getElementBox(fromEl);
              const box2 = getElementBox(toEl);
              if (!box1 || !box2) return null;

              const pt1 = getBoundaryPt(box1.cx, box1.cy, box1.w, box1.h, box2.cx, box2.cy);
              const pt2 = getBoundaryPt(box2.cx, box2.cy, box2.w, box2.h, box1.cx, box1.cy);

              return (
                <svg key={c.id} className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: "none" }}>
                  <defs>
                    <marker id={`arrowhead-${c.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#1C1B1F" />
                    </marker>
                  </defs>
                  <g data-el-id={c.id}>
                    <line
                      x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                      stroke="transparent" strokeWidth="20"
                      style={{ pointerEvents: "stroke", cursor: tool === "select" ? "pointer" : undefined }}
                    />
                    <line
                      x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                      stroke={c.color} strokeWidth="3" markerEnd={`url(#arrowhead-${c.id})`}
                      style={{ pointerEvents: "none", filter: selIds.includes(c.id) ? "drop-shadow(0 0 4px #3742FA)" : undefined }}
                    />
                  </g>
                </svg>
              );
            }
            if (el.type === "free_arrow") {
              const fa = el as FreeArrowEl;
              const pt1 = { x: fa.x, y: fa.y };
              const pt2 = { x: fa.x + fa.dx, y: fa.y + fa.dy };
              return (
                <svg key={fa.id} className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: "none" }}>
                  <defs>
                    <marker id={`arrowhead-${fa.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill={fa.color} />
                    </marker>
                  </defs>
                  <g data-el-id={fa.id}>
                    <line
                      x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                      stroke="transparent" strokeWidth="20"
                      style={{ pointerEvents: "stroke", cursor: tool === "select" ? "pointer" : undefined }}
                    />
                    <line
                      x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                      stroke={fa.color} strokeWidth="3" markerEnd={`url(#arrowhead-${fa.id})`}
                      style={{ pointerEvents: "none", filter: selIds.includes(fa.id) ? "drop-shadow(0 0 4px #3742FA)" : undefined }}
                    />
                  </g>
                </svg>
              );
            }
            if (el.type === "path") {
              const p = el as PathEl;
              const isHighlighter = p.penType === "highlighter";
              return (
                <svg key={p.id} className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: "none" }}>
                  <g data-el-id={p.id}>
                    <path
                      d={pathD(p.pts)} stroke="transparent" strokeWidth={Math.max(20, p.sw + 10)} fill="none" strokeLinecap="round" strokeLinejoin="round"
                      style={{ pointerEvents: "stroke", cursor: tool === "select" ? "grab" : undefined }}
                    />
                    <path
                      d={pathD(p.pts)} stroke={p.color} strokeWidth={p.sw} fill="none" strokeLinecap="round" strokeLinejoin="round"
                      style={{ pointerEvents: "none", opacity: isHighlighter ? 0.3 : 1, mixBlendMode: isHighlighter ? "multiply" : undefined, filter: selIds.includes(p.id) ? "drop-shadow(0 0 4px #3742FA)" : undefined }}
                    />
                  </g>
                </svg>
              );
            }
            if (el.type === "graph") {
              return (
                <GraphNode
                  key={el.id} el={el as any}
                  selected={selIds.includes(el.id)}
                />
              );
            }
            return null;
          })}

          {/* Live drawing preview */}
          {(livePts.length > 1 || liveArrow) && (
            <svg className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: "none", zIndex: 9999 }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#1C1B1F" />
                </marker>
              </defs>
              {livePts.length > 1 && (() => {
                const isHighlighter = penType === "highlighter";
                const liveSw = isHighlighter ? (penThickness === "thick" ? 48 : 24) :
                  penType === "marker" ? (penThickness === "thick" ? 16 : 8) :
                    (penThickness === "thick" ? 6 : 2);
                return (
                  <path d={pathD(livePts)} stroke={penColor} strokeWidth={liveSw} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: isHighlighter ? 0.3 : 1, mixBlendMode: isHighlighter ? "multiply" : undefined }} />
                );
              })()}
              {liveArrow && (
                <line x1={liveArrow.start.x} y1={liveArrow.start.y} x2={liveArrow.end.x} y2={liveArrow.end.y} stroke="#1C1B1F" strokeWidth="3" markerEnd="url(#arrowhead)" opacity={0.5} />
              )}
            </svg>
          )}

          {comments
            .filter((c) => c.boardId === currentBoardId)
            .map((c) => (
              <div
                key={c.id}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCommentId(c.id === selectedCommentId ? null : c.id);
                }}
                className="absolute flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-150 z-50 group pointer-events-auto"
                style={{
                  left: c.x - 16,
                  top: c.y - 16,
                  width: 32,
                  height: 32,
                }}
              >
                <div
                  className="w-full.h-full rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-md border-[2.5px] border-white w-8 h-8"
                  style={{ backgroundColor: c.color || "#3742FA" }}
                >
                  {c.author ? c.author.slice(0, 2).toUpperCase() : "C"}
                </div>
                {/* Popover content if selected or hovered */}
                {selectedCommentId === c.id ? (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute top-10 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 min-w-[200px] z-50"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1.5 mb-1.5">
                      <span className="font-semibold text-xs text-gray-800">{c.author}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap select-text">{c.text}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setComments(prev => prev.filter(x => x.id !== c.id));
                        setSelectedCommentId(null);
                      }}
                      className="mt-2 text-[10px] font-medium text-red-500 hover:text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900/95 text-white text-xs py-1 px-2 rounded-lg shadow-md whitespace-nowrap z-50 pointer-events-none">
                    <span className="font-semibold">{c.author}:</span> {c.text.length > 25 ? c.text.slice(0, 25) + "..." : c.text}
                  </div>
                )}
              </div>
            ))}

          {activePlacement && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-64 z-50 pointer-events-auto"
              style={{
                left: activePlacement.x,
                top: activePlacement.y,
              }}
            >
              <div className="text-xs font-semibold text-gray-600 mb-1">New comment by {getSessionUser()}</div>
              <textarea
                autoFocus
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (newCommentText.trim()) {
                      setComments(prev => [...prev, {
                        id: uid(),
                        boardId: currentBoardId,
                        x: activePlacement.x,
                        y: activePlacement.y,
                        text: newCommentText.trim(),
                        author: getSessionUser(),
                        createdAt: Date.now(),
                        color: "#3742FA"
                      }]);
                      setActivePlacement(null);
                      setTool("select");
                    }
                  } else if (e.key === "Escape") {
                    setActivePlacement(null);
                    setTool("select");
                  }
                }}
                className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#3742FA]/20 focus:border-[#3742FA] outline-none resize-none h-16 text-gray-800"
              />
              <div className="flex justify-end gap-1.5 mt-2">
                <button
                  onClick={() => {
                    setActivePlacement(null);
                    setTool("select");
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newCommentText.trim()) {
                      setComments(prev => [...prev, {
                        id: uid(),
                        boardId: currentBoardId,
                        x: activePlacement.x,
                        y: activePlacement.y,
                        text: newCommentText.trim(),
                        author: getSessionUser(),
                        createdAt: Date.now(),
                        color: "#3742FA"
                      }]);
                      setActivePlacement(null);
                      setTool("select");
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-[#3742FA] hover:bg-[#5B4FE8] rounded-lg transition-colors shadow-sm"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        tool={tool}
        setTool={(t) => {
          setTool(t);
          if (t === "comment") {
            setIsCommentWindowOpen(true);
          } else {
            setActivePlacement(null);
          }
        }}
        onZoom={doZoom}
        zoomLevel={cam.z}
        stickyColor={stickyColor}
        setStickyColor={(c) => {
          setStickyColor(c);
          setEls(p => p.map(el => selIds.includes(el.id) && el.type === "sticky" ? { ...el, color: c } : el));
        }}
        shapeColor={shapeColor}
        setShapeColor={(c) => {
          setShapeColor(c);
          setEls(p => p.map(el => selIds.includes(el.id) && el.type === "shape" ? { ...el, color: c } : el));
        }}
        shapeKind={shapeKind}
        setShapeKind={(k) => {
          setShapeKind(k);
          setEls(p => p.map(el => selIds.includes(el.id) && el.type === "shape" ? { ...el, kind: k } as El : el));
        }}
        penColor={penColor}
        setPenColor={(c) => {
          setPenColor(c);
          setEls(p => p.map(el => selIds.includes(el.id) && el.type === "path" ? { ...el, color: c } : el));
        }}
        penType={penType}
        setPenType={setPenType}
        penThickness={penThickness}
        setPenThickness={setPenThickness}
        toolMenuOpen={toolMenuOpen}
        setToolMenuOpen={setToolMenuOpen}
        onDelete={onDelete}
        hasSelection={selIds.length > 0}
        onInsertIcon={onInsertIcon}
      />

      {/* Top bar */}
      <TopBar
        currentBoardId={currentBoardId}
        boardName={boardName}
        boardBg={boardBg}
        onChangeBg={setBoardBg}
        onRenameBoard={(name) => setBoardName(name)}
        role={role}
        onlineUsers={onlineUsers}
        chatOpen={isChatOpen}
        onToggleChat={() => {
          setIsChatOpen(prev => !prev);
          setChatUnreadCount(0);
        }}
        chatUnreadCount={chatUnreadCount}
      />

      {/* Real-time Multiplayer Cursors */}
      {peers.map(p => {
        const screenX = p.x * cam.z + cam.x;
        const screenY = p.y * cam.z + cam.y;
        
        // Log once per render per cursor (throttle spam)
        if (Math.random() < 0.02) console.log("Cursor rendered for:", p.id);
        
        return (
          <div
            key={p.id}
            className="absolute top-0 left-0 pointer-events-none z-40 transition-transform duration-[50ms] ease-linear"
            style={{ transform: `translate(${screenX}px, ${screenY}px)` }}
          >
            <svg width="20" height="26" viewBox="0 0 16 23" fill={p.color} stroke="white" strokeWidth="2" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>
              <path d="M1.3853 0.385299C0.840742 -0.159258 0 0.226343 0 0.996155V21.1398C0 21.9405 0.992646 22.3168 1.52355 21.7145L5.78762 16.8797L9.58801 22.6517C9.91428 23.1472 10.5843 23.2882 11.0853 22.9666L13.1118 21.6659C13.6128 21.3444 13.7538 20.6811 13.4276 20.1856L9.62719 14.4136H15.0038C15.7737 14.4136 16.1593 13.4834 15.6147 12.9388L1.3853 0.385299Z" />
            </svg>
            <div className="absolute top-5 left-4 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-md pointer-events-none" style={{ backgroundColor: p.color }}>
              {p.name}
            </div>
          </div>
        );
      })}

      {/* Collaboration Chat */}
      {currentBoardId && (
        <BoardChat
          messages={liveChatMessages}
          currentUserId={onlineUsers.find(u => u.name === getSessionUser())?.user_id || ""}
          typingUsers={liveChatTypingUsers}
          onSendMessage={(message) => {
            const currentUserId = onlineUsers.find(u => u.name === getSessionUser())?.user_id || "";
            const optimisticMsg: LiveChatMessage = {
              board_id: currentBoardId,
              user_id: currentUserId,
              username: getSessionUser(),
              message,
              timestamp: new Date().toISOString()
            };
            setLiveChatMessages(prev => [...prev, optimisticMsg]);
            websocketService.send("chat_message", { message });
          }}
          onTyping={(isTyping) => {
            websocketService.send(isTyping ? "typing_start" : "typing_stop", {});
          }}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          unreadCount={chatUnreadCount}
          onToggle={() => {
            setIsChatOpen(prev => !prev);
            setChatUnreadCount(0);
          }}
        />
      )}

      {isCommentWindowOpen && (
        <div className="absolute top-24 right-6 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex flex-col z-50 pointer-events-auto overflow-hidden max-h-[500px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-800">
              <MessageSquare size={16} className="text-[#3742FA]" />
              <span className="font-bold text-sm">Comments</span>
            </div>
            <button
              onClick={() => {
                setIsCommentWindowOpen(false);
                if (tool === "comment") setTool("select");
              }}
              className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Prompt/Helper */}
          <div className="p-3 bg-blue-50/50 border-b border-blue-50/50 text-[11px] text-blue-600 leading-normal">
            💡 Select the Comment tool (or press C) and click anywhere on the canvas to place a comment!
          </div>

          {/* List of comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {comments.filter(c => c.boardId === currentBoardId).length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No comments on this board yet.
              </div>
            ) : (
              comments
                .filter(c => c.boardId === currentBoardId)
                .map(c => (
                  <div key={c.id} className="p-2.5 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-100/80 transition-all flex flex-col gap-1 relative group/item">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: c.color || "#3742FA" }}
                        >
                          {c.author ? c.author.slice(0, 2).toUpperCase() : "C"}
                        </div>
                        <span className="font-semibold text-xs text-gray-700">{c.author}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-650 pl-6 whitespace-pre-wrap select-text">{c.text}</p>
                    <div className="flex justify-between items-center mt-1 pl-6">
                      <button
                        onClick={() => {
                          // Center camera on the comment
                          setCam({ x: window.innerWidth / 2 - c.x * cam.z, y: window.innerHeight / 2 - c.y * cam.z, z: cam.z });
                          setSelectedCommentId(c.id);
                        }}
                        className="text-[10px] text-[#3742FA] hover:underline font-medium"
                      >
                        Find on canvas
                      </button>
                      <button
                        onClick={() => {
                          setComments(prev => prev.filter(x => x.id !== c.id));
                          if (selectedCommentId === c.id) setSelectedCommentId(null);
                        }}
                        className="text-[10px] text-red-500 hover:text-red-700 font-medium opacity-0 group-hover/item:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* AI Dialog */}
      <AIDialog open={aiOpen} onClose={() => setAiOpen(false)} boardId={currentBoardId} boardName={boardName} els={els} onAIAction={handleAIAction} />

      {/* Floating AI Button */}
      {!aiOpen && (
        <div className="absolute bottom-6 right-6 z-50 pointer-events-auto">
          <button
            onClick={() => setAiOpen(true)}
            title="Open AI Assistant"
            className="relative flex items-center justify-center bg-white border border-gray-200 text-gray-800 shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden gap-2.5 px-5 h-14 rounded-full"
          >
            <Sparkles size={20} className="text-[#7B61FF] shrink-0" />
            <span className="font-semibold text-[15px] whitespace-nowrap">
              How can I help you?
            </span>
          </button>
        </div>
      )}


      {/* Space hint */}
      {spaceHeld && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-xs text-gray-500 px-3 py-1.5 rounded-full shadow-md border border-gray-100 pointer-events-none">
          Hold Space to pan
        </div>
      )}

      {/* Tool hint */}
      {!spaceHeld && tool !== "select" && tool !== "hand" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#3742FA] text-white text-xs px-3 py-1.5 rounded-full shadow-md pointer-events-none font-medium">
          {tool === "sticky" ? "Click to place sticky note" :
            tool === "text" ? "Click to place text" :
              tool === "shape" ? "Click to place shape" :
                tool === "arrow" ? "Drag to connect elements" :
                  tool === "pen" ? "Draw freely" :
                    tool === "comment" ? "Click anywhere to place a comment" : ""}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          id={contextMenu.id}
          selIds={selIds}
          els={els}
          clipboardRef={clipboardRef}
          setEls={setEls}
          setSelIds={setSelIds}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
