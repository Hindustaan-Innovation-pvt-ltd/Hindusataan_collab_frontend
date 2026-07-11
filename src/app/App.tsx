import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Sparkles, X, MessageSquare } from "lucide-react";
import { useParams, useNavigate } from "react-router";
import IconNode from "../components/IconNode";
// import { toPng } from "html-to-image";

import type { Tool, ShapeKind, Pt, ShapeEl, PenType, PenThickness, PathEl, ConnectionEl, FreeArrowEl, El, Cam, Peer, Comment, StickyEl, GraphEl, TableEl, Board } from "../types";
import { STICKY_COLORS, SHAPE_COLORS, PEN_COLORS, INIT_ELS } from "../constants";
import { uid, worldPt, pathD, getElementBox, getBoundaryPt } from "../utils";

import StickyNote from "../components/StickyNote";
import TextNode from "../components/TextNode";
import ShapeNode from "../components/ShapeNode";
import TableNode from "../components/TableNode";
import GraphNode from "../components/GraphNode";
import DeviceFrameNode from "../components/DeviceFrameNode";
import AIDialog from "../components/AIDialog";
import Toolbar from "../components/Toolbar";
import { boardService } from "../services/boardService";
import { websocketService } from '../services/websocketService';
import { collaborationService } from "../services/collaborationService";
import { parseMermaidToElements } from "../utils/mermaidParser";
import TopBar from "../components/TopBar";
import ContextMenu from "../components/ContextMenu";
import { BoardChat } from "../components/BoardChat";
import type { LiveChatMessage } from "../services/liveChatService";

import { useBoardSync } from "../hooks/useBoardSync";
import { useLiveCollaboration } from "../hooks/useLiveCollaboration";
import { useToast } from "../hooks/useToast";

// ── App ───────────────────────────────────────────────────────────────────────

const getSessionUser = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "Guest";
    const s = localStorage.getItem("HIXCanvas_session");
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed && parsed.name) return parsed.name;
    }
  } catch (e) { }
  return "Guest";
};

export default function App() {
  const [mySessionId] = useState(() => uid());
  const [myColor] = useState(() => SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)]);
  const { boardId: urlBoardId } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool>("select");

  const { toast, showToast } = useToast();

  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommentWindowOpen, setIsCommentWindowOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [activePlacement, setActivePlacement] = useState<{ x: number, y: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [els, setEls] = useState<El[]>(INIT_ELS);
  const [currentBoardId, setCurrentBoardId] = useState<string>(urlBoardId || "");
  const [boardName, setBoardName] = useState("Untitled Board");
  const [boardBg, setBoardBg] = useState<"white" | "black" | "green">("white");
  const [selIds, setSelIds] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  // Live Chat State
  const [liveChatMessages, setLiveChatMessages] = useState<any[]>([]);
  const [liveChatTypingUsers, setLiveChatTypingUsers] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const [cam, setCam] = useState<Cam>({ x: 0, y: 0, z: 1 });
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0]);
  const [shapeColor, setShapeColor] = useState(SHAPE_COLORS[0]);
  const [shapeKind, setShapeKind] = useState<ShapeKind>("rect");
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [penType, setPenType] = useState<PenType>("pen");
  const [penThickness, setPenThickness] = useState<PenThickness>(3);
  const [textFontSize, setTextFontSize] = useState<number>(20);
  const [textFontFamily, setTextFontFamily] = useState<string>("sans-serif");
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const [livePts, setLivePts] = useState<Pt[]>([]);
  const [liveArrow, setLiveArrow] = useState<{ start: Pt, end: Pt } | null>(null);
  const [marquee, setMarquee] = useState<{ start: Pt, end: Pt } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);

  useEffect(() => {
    const int = setInterval(() => {
      const now = Date.now();
      setPeers(prev => prev.filter(p => p.lastUpdate && (now - p.lastUpdate < 10000)));
    }, 5000);
    return () => clearInterval(int);
  }, []);

  const [userRole, setUserRole] = useState<"owner" | "editor" | "viewer">("viewer");

  useEffect(() => {
    if (currentBoardId) {
      collaborationService.getBoardRole(currentBoardId)
        .then((role) => {
          if (role === "owner" || role === "editor" || role === "viewer") {
            setUserRole(role);
          }
        })
        .catch((e) => console.error("Failed to get board role", e));
    }
  }, [currentBoardId]);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string | null } | null>(null);

  const [history, setHistory] = useState<El[][]>([INIT_ELS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoRef = useRef(false);

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

  // Refs for tracking current state during events without causing re-renders
  const camRef = useRef(cam);
  const elsRef = useRef(els);
  const editIdRef = useRef(editId);
  const selIdsRef = useRef(selIds);
  const stickyColorRef = useRef(stickyColor);
  const shapeColorRef = useRef(shapeColor);
  const shapeKindRef = useRef(shapeKind);
  const penColorRef = useRef(penColor);
  const toolRef = useRef(tool);
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

  const textFontSizeRef = useRef(textFontSize);
  const textFontFamilyRef = useRef(textFontFamily);
  useEffect(() => {
    textFontSizeRef.current = textFontSize;
    textFontFamilyRef.current = textFontFamily;
  }, [textFontSize, textFontFamily]);

  // Sync selected text node font properties back to toolbar state
  useEffect(() => {
    if (selIds.length === 1) {
      const selectedEl = els.find(e => e.id === selIds[0]);
      if (selectedEl && selectedEl.type === "text") {
        setTextFontSize(selectedEl.fontSize || 20);
        setTextFontFamily(selectedEl.fontFamily || "sans-serif");
      }
    }
  }, [selIds, els]);

  const handleTextFontSizeChange = (size: number) => {
    setTextFontSize(size);
    if (selIdsRef.current.length > 0) {
      setEls(p => p.map(el => {
        if (selIdsRef.current.includes(el.id) && el.type === "text") {
          return { ...el, fontSize: size };
        }
        return el;
      }));
    }
  };

  const handleTextFontFamilyChange = (family: string) => {
    setTextFontFamily(family);
    if (selIdsRef.current.length > 0) {
      setEls(p => p.map(el => {
        if (selIdsRef.current.includes(el.id) && el.type === "text") {
          return { ...el, fontFamily: family };
        }
        return el;
      }));
    }
  };

  const handlePenTypeChange = (type: PenType) => {
    setPenType(type);
    if (type === "pen") setPenThickness(3);
    else if (type === "marker") setPenThickness(10);
    else if (type === "highlighter") setPenThickness(24);
  };

  const isEditingOrSelectedText = useMemo(() => {
    if (tool === "text") return true;
    if (selIds.length > 0) {
      return els.some(el => selIds.includes(el.id) && el.type === "text");
    }
    return false;
  }, [tool, selIds, els]);
  // Interaction state refs
  const panRef = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null);
  const dragRef = useRef<{ startW: Pt; originalEls: El[] } | null>(null);
  const hasDraggedRef = useRef(false);
  const clickEditRef = useRef<string | null>(null);
  const drawRef = useRef<Pt[]>([]);
  const arrowRef = useRef<{ id: string; start: Pt } | null>(null);
  const marqueeStartRef = useRef<Pt | null>(null);
  const loadingBoardIdRef = useRef<string | null>(null);

  const isRemoteUpdateRef = useRef(false);

  // Sync Board State
  const { boards, setBoards, isLoading, saveState } = useBoardSync({
    currentBoardId, setCurrentBoardId, boardName, setBoardName, boardBg, setBoardBg,
    els, setEls, cam, setCam, INIT_ELS, showToast, isRemoteUpdateRef, websocketService,
    urlBoardId, navigate
  });

  // Live Collaboration
  const { broadcastPresence, setBroadcastEditId } = useLiveCollaboration({
    currentBoardId, mySessionId, myColor, selIdsRef
  });

  // Keep broadcast edit state in sync
  useEffect(() => {
    setBroadcastEditId(editId);
  }, [editId, setBroadcastEditId]);

  // Handle incoming websocket updates
  useEffect(() => {
    websocketService.onMessageCallback = (msg) => {
      if (msg.type === "board_update" && msg.payload) {
        isRemoteUpdateRef.current = true;
        if (msg.payload.els) setEls(msg.payload.els);
        if (msg.payload.cam) setCam(msg.payload.cam);
      } else if (msg.type === "cursor_update" && msg.payload) {
        setPeers(prev => {
          const idx = prev.findIndex(p => p.id === msg.payload.user_id);
          const now = Date.now();
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              tx: msg.payload.x,
              ty: msg.payload.y,
              lastUpdate: now,
              selIds: msg.payload.selIds || [],
              isTyping: msg.payload.isTyping,
              editingId: msg.payload.editingId
            };
            return next;
          }
          return [...prev, {
            id: msg.payload.user_id,
            name: msg.payload.name || "Collaborator",
            color: msg.payload.color || "#1ABCFE",
            x: msg.payload.x,
            y: msg.payload.y,
            tx: msg.payload.x,
            ty: msg.payload.y,
            lastUpdate: now,
            selIds: msg.payload.selIds || [],
            isTyping: msg.payload.isTyping,
            editingId: msg.payload.editingId
          }];
        });
      } else if (msg.type === "chat_history") {
        setLiveChatMessages(msg.payload);
      } else if (msg.type === "presence") {
        setOnlineUsers(msg.online_users || []);
      } else if (msg.type === "chat_message") {
        setLiveChatMessages(prev => {
          if (msg.payload.message_id) {
            const existsIdx = prev.findIndex(m => m.message_id === msg.payload.message_id);
            if (existsIdx !== -1) {
              const next = [...prev];
              next[existsIdx] = msg.payload;
              return next;
            }
          }
          return [...prev, msg.payload];
        });
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
    if (!currentBoardId) return;

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      websocketService.send("board_update", { els, cam });
    }, 100);

    return () => clearTimeout(timeout);
  }, [els, cam, currentBoardId]);

  // Load comments
  useEffect(() => {
    const saved = localStorage.getItem("HIXCanvas-comments");
    if (saved) {
      try {
        setComments(JSON.parse(saved));
      } catch (e) { }
    }
  }, []);

  // Save comments
  useEffect(() => {
    localStorage.setItem("HIXCanvas-comments", JSON.stringify(comments));
  }, [comments]);

  // Cursor Interpolation Loop
  useEffect(() => {
    let animationFrameId: number;
    const loop = () => {
      setPeers(prev => {
        let changed = false;
        const next = prev.map(p => {
          const tx = p.tx ?? p.x;
          const ty = p.ty ?? p.y;
          const dx = tx - p.x;
          const dy = ty - p.y;
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

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        if (selIdsRef.current.length > 0) {
          const newEls = elsRef.current.filter(ex => selIdsRef.current.includes(ex.id)).map(el => {
            const newEl = { ...el, id: uid() };
            if ('x' in newEl) newEl.x += 20;
            if ('y' in newEl) newEl.y += 20;
            return newEl;
          });
          setEls(p => [...p, ...newEls]);
          setSelIds(newEls.map(e => e.id));
        }
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        setSelIds(elsRef.current.map(el => el.id));
        e.preventDefault();
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
  }, [doZoom, isLoading]);

  // ── Pointer events ────────────────────────────────────────────────────────
  const getRect = () => wrapRef.current!.getBoundingClientRect();

  // Broadcast when starting/stopping editing
  useEffect(() => {
    const t = setTimeout(() => {
      broadcastPresence(0, 0, true);
    }, 0);
    return () => clearTimeout(t);
  }, [editId, broadcastPresence]);

  const onPtrDown = useCallback((e: React.PointerEvent) => {
    setToolMenuOpen(false);
    setAiOpen(false);
    setContextMenu(null);
    if (e.button === 2) return; // Right click

    if (editIdRef.current) return;

    const isPan = toolRef.current === "hand" || spaceRef.current;

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
            setEls(p => [...p, { id: uid(), type: "connection", from: id, to: toId, color: "var(--color-foreground)", x: 0, y: 0 }]);
          }
        } else {
          const newId = uid();
          const pt = worldPt(ue.clientX, ue.clientY, getRect(), camRef.current);
          setEls(p => [...p, {
            id: newId, type: "free_arrow",
            x: startPt.x, y: startPt.y,
            dx: pt.x - startPt.x, dy: pt.y - startPt.y,
            color: "var(--color-foreground)"
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

        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          if (newSel.includes(id)) newSel = newSel.filter(x => x !== id);
          else newSel = [...newSel, id];
        } else {
          if (!newSel.includes(id)) newSel = [id];
        }
        setSelIds(newSel);
        selIdsRef.current = newSel;
        broadcastPresence(w.x, w.y, true);

        dragRef.current = {
          startW: w,
          originalEls: newSel.map(sid => elsRef.current.find(x => x.id === sid)).filter(Boolean) as El[]
        };

        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
      return;
    }

    // Clicked empty canvas
    if (toolRef.current === "select") {
      const rect = getRect();
      const startW = worldPt(e.clientX, e.clientY, rect, camRef.current);
      
      let clickedInsideGroup = false;
      if (selIdsRef.current.length > 1 && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selIdsRef.current.forEach(id => {
          const el = elsRef.current.find(x => x.id === id);
          if (!el) return;
          const box = getElementBox(el);
          if (box) {
            minX = Math.min(minX, box.cx - box.w / 2);
            minY = Math.min(minY, box.cy - box.h / 2);
            maxX = Math.max(maxX, box.cx + box.w / 2);
            maxY = Math.max(maxY, box.cy + box.h / 2);
          }
        });
        if (minX !== Infinity) {
          if (startW.x >= minX && startW.x <= maxX && startW.y >= minY && startW.y <= maxY) {
            clickedInsideGroup = true;
          }
        }
      }

      if (clickedInsideGroup) {
        dragRef.current = {
          startW,
          originalEls: selIdsRef.current.map(sid => elsRef.current.find(x => x.id === sid)).filter(Boolean) as El[]
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
      
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        setSelIds([]);
        selIdsRef.current = [];
        broadcastPresence(startW.x, startW.y, true);
      }
      
      marqueeStartRef.current = startW;
      setMarquee({ start: startW, end: startW });
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
      setEls(p => [...p, { id, type: "text", x: w.x, y: w.y, text: "Text", fontSize: textFontSizeRef.current, color: textColor, fontFamily: textFontFamilyRef.current }]);
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
          const sw = penThicknessRef.current;
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
              color: "var(--color-foreground)"
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
    const rect = getRect();
    const w = worldPt(e.clientX, e.clientY, rect, camRef.current);

    // Broadcast presence coordinates
    broadcastPresence(w.x, w.y);

    if (panRef.current) {
      const { px, py, cx, cy } = panRef.current;
      setCam(p => ({ ...p, x: cx + (e.clientX - px), y: cy + (e.clientY - py) }));
      return;
    }

    if (marqueeStartRef.current) {
      const start = marqueeStartRef.current;
      setMarquee({ start, end: w });
      
      const mx = Math.min(start.x, w.x);
      const my = Math.min(start.y, w.y);
      const mw = Math.abs(start.x - w.x);
      const mh = Math.abs(start.y - w.y);

      const newSelIds: string[] = [];
      elsRef.current.forEach((el) => {
        if (el.locked) return;
        const box = getElementBox(el);
        if (box) {
          const bx = box.cx - box.w / 2;
          const by = box.cy - box.h / 2;
          if (bx < mx + mw && bx + box.w > mx && by < my + mh && by + box.h > my) {
            newSelIds.push(el.id);
          }
        }
      });
      setSelIds(newSelIds);
      selIdsRef.current = newSelIds;
      return;
    }

    if (dragRef.current) {
      hasDraggedRef.current = true;
      const { startW, originalEls } = dragRef.current;
      const dx = w.x - startW.x;
      const dy = w.y - startW.y;

      setEls(p => p.map(el => {
        const orig = originalEls.find(x => x.id === el.id);
        if (!orig) return el;
        
        if (orig.type === "path") {
           return { ...orig, pts: orig.pts.map(pt => ({ x: pt.x + dx, y: pt.y + dy })) };
        }
        return { ...orig, x: (orig as any).x + dx, y: (orig as any).y + dy };
      }));
      return;
    }

    if (drawRef.current.length > 0) {
      drawRef.current = [...drawRef.current, w];
      setLivePts([...drawRef.current]);
    }
  }, [broadcastPresence]);

  const onPtrUp = useCallback((_e: React.PointerEvent) => {
    panRef.current = null;

    if (marqueeStartRef.current) {
      marqueeStartRef.current = null;
      setMarquee(null);
    }

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
    console.log("handleAIAction called with action:", action, "data:", data);
    const cx = (window.innerWidth / 2 - camRef.current.x) / camRef.current.z;
    const cy = (window.innerHeight / 2 - camRef.current.y) / camRef.current.z;

    const startX = cx;
    const startY = cy;

    let newEls: El[] = [];

    if (action === "create_flowchart" || action === "flowchart") {
      if (data && data.nodes && Array.isArray(data.nodes)) {
        console.log("Handling create_flowchart with JSON nodes data");
        const NODE_W = 160;
        const NODE_H = 80;
        const GAP_Y = 100;

        // simple grid layout
        let currY = startY;
        const nodeEls: any[] = [];
        const edgesEls: any[] = [];

        const nodeIds = data.nodes.map(() => uid());

        data.nodes.forEach((n: any, i: number) => {
          nodeEls.push({
            id: nodeIds[i],
            type: "shape",
            kind: "rect",
            w: NODE_W,
            h: NODE_H,
            color: "#3742FA",
            x: startX - (NODE_W / 2),
            y: currY + i * (NODE_H + GAP_Y),
            text: n.text || `Node ${i + 1}`
          });
        });

        if (data.edges && Array.isArray(data.edges)) {
          data.edges.forEach((e: any) => {
            const sourceId = typeof e.source === 'number' ? nodeIds[e.source] : nodeIds.find((_: string, i: number) => data.nodes[i].id === e.source || data.nodes[i].text === e.source);
            const targetId = typeof e.target === 'number' ? nodeIds[e.target] : nodeIds.find((_: string, i: number) => data.nodes[i].id === e.target || data.nodes[i].text === e.target);
            if (sourceId && targetId) {
              edgesEls.push({
                id: uid(),
                type: "connection",
                from: sourceId,
                to: targetId,
                color: "var(--color-foreground)",
                x: 0, y: 0
              });
            }
          });
        }

        newEls = [...nodeEls, ...edgesEls];
        setEls(p => [...p, ...newEls]);
        return;
      }

      // Small models often hallucinate the JSON structure, so we look for the mermaid string wherever it is
      let mermaidStr = (data && data.mermaid) ? data.mermaid : (typeof data === "string" ? data : null);
      if (typeof mermaidStr !== "string") {
        mermaidStr = typeof data === "object" ? JSON.stringify(data) : null;
      }

      if (mermaidStr) {
        console.log("Handling create_flowchart with mermaid data");
        try {
          newEls = parseMermaidToElements(mermaidStr, startX, startY);
        } catch (err) {
          console.error("Failed to parse mermaid:", err);
          newEls = [];
        }

        if (newEls.length === 0) {
          // Failsafe: if the parser fails to extract any nodes, drop the raw code in a sticky note
          newEls = [{
            id: uid(), type: "sticky", w: 300, h: 300, x: startX - 150, y: startY - 150,
            color: "#FFEB3B", text: "Could not render flowchart. Raw code:\n\n" + mermaidStr
          } as StickyEl];
        }

        console.log("Created mermaid nodes:", newEls);
        setEls(p => [...p, ...newEls]);
      } else {
        // AI didn't provide any data string
        const fallbackNote: StickyEl = {
          id: uid(), type: "sticky", w: 300, h: 300, x: startX - 150, y: startY - 150,
          color: "#FFEB3B", text: "AI didn't provide valid flowchart data.\nReceived: " + JSON.stringify(data)
        };
        setEls(p => [...p, fallbackNote]);
      }
    }
    else if (action === "create_graph" || action === "graph") {
      if (data && data.chartType) {
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
            w: 240, h: 100, color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
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
            color: "var(--color-foreground)", x: 0, y: 0
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
          setEls(p => [...p, { id: uid(), type: "connection", from: id, to: toId, color: "var(--color-foreground)", x: 0, y: 0 }]);
        }
      } else {
        const newId = uid();
        const pt = worldPt(ue.clientX, ue.clientY, getRect(), camRef.current);
        const newShape: ShapeEl = {
          id: newId, type: "shape", kind: shapeKindRef.current || "rect",
          x: pt.x - 80, y: pt.y - 60, w: 160, h: 120,
          color: shapeColorRef.current || "#FF6B6B"
        };
        setEls(p => [...p, newShape, { id: uid(), type: "connection", from: id, to: newId, color: "var(--color-foreground)", x: 0, y: 0 }]);
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
    // Place the new item at the current center of the visible canvas
    const centerScreen = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const centerWorld = worldPt(centerScreen.x, centerScreen.y, getRect(), camRef.current);

    const id = uid();

    if (iconName.startsWith("device-frame:")) {
      const kind = iconName.replace("device-frame:", "") as "browser" | "phone";
      setEls(p => [...p, {
        id, type: "device_frame",
        kind,
        x: centerWorld.x - (kind === "browser" ? 400 : 150),
        y: centerWorld.y - (kind === "browser" ? 300 : 300),
        w: kind === "browser" ? 800 : 300,
        h: kind === "browser" ? 600 : 600,
        color: "#1C1B1F",
      }]);
      return;
    }

    const size = 48;
    setEls(p => [...p, {
      id, type: "icon",
      iconName,
      x: centerWorld.x - size / 2,
      y: centerWorld.y - size / 2,
      size,
      color: "var(--color-foreground)",
    }]);
    setSelIds([id]);
  }, []);

  const handleRenameBoard = useCallback(async (id: string, name: string) => {
    if (id === currentBoardId) {
      setBoardName(name);
    }

    // Optimistically update the boards list
    setBoards(prev => prev.map(b => b.id === id ? { ...b, name } : b));

    try {
      await boardService.updateBoard(id, name);
    } catch (e: any) {
      console.error("Failed to rename board", e);
      showToast(e.response?.data?.message || "Failed to rename board", "error");

      // Revert optimism by refetching boards
      boardService.getBoards().then(setBoards).catch(() => { });
    }
  }, [currentBoardId, setBoardName, showToast, setBoards]);

  const handleDeleteBoard = useCallback(async (id: string) => {
    if (id) {
      try {
        await boardService.deleteBoard(id);
        const remaining = boards.filter(b => b.id !== id);
        setBoards(remaining);

        // Only redirect or recreate if we deleted the currently active board
        if (id === currentBoardId) {
          if (remaining.length > 0) {
            const next = remaining[0];
            setCurrentBoardId(next.id);
            setBoardName(next.name);
            try {
              const content = await boardService.getBoardContent(next.id);
              setEls(content.els && content.els.length > 0 ? content.els : INIT_ELS);
              setCam(content.cam || { x: window.innerWidth / 2, y: window.innerHeight / 2, z: 1 });
            } catch (e) {
              console.error("Failed to fetch board content", e);
              setEls(INIT_ELS);
              setCam({ x: window.innerWidth / 2, y: window.innerHeight / 2, z: 1 });
            }
          } else {
            const newName = "Untitled Board";
            const newId = await boardService.createBoard(newName);
            setCurrentBoardId(newId);
            setBoardName(newName);
            setEls(INIT_ELS);
            setCam({ x: window.innerWidth / 2, y: window.innerHeight / 2, z: 1 });
            setBoards([{ id: newId, name: newName, els: INIT_ELS, cam: { x: window.innerWidth / 2, y: window.innerHeight / 2, z: 1 }, updatedAt: Date.now(), bg: "white" }]);
          }
        }
      } catch (e: any) {
        console.error("Failed to delete board", e);
        showToast(e.response?.data?.message || "Failed to delete board", "error");
        throw e;
      }
    }
  }, [currentBoardId, boards, setBoards, setCurrentBoardId, setBoardName, setEls, setCam, showToast, INIT_ELS]);

  const handleCreateBoard = useCallback(async () => {
    try {
      const newName = "Untitled Board";
      const newId = await boardService.createBoard(newName);
      const newBoard: Board = { id: newId, name: newName, bg: "white", els: INIT_ELS, cam: { x: window.innerWidth / 2, y: window.innerHeight / 2, z: 1 }, updatedAt: Date.now() };
      setBoards(prev => [...prev, newBoard]);
      setCurrentBoardId(newId);
      setBoardName(newName);
      setEls(INIT_ELS);
      setCam({ x: window.innerWidth / 2, y: window.innerHeight / 2, z: 1 });
      setHistory([INIT_ELS]);
      setHistoryIndex(0);
    } catch (e: any) {
      console.error("Failed to create board", e);
      showToast(e.response?.data?.message || "Failed to create board", "error");
    }
  }, [setBoards, setCurrentBoardId, setBoardName, setEls, setCam, INIT_ELS, showToast]);

  const handleChangeBoard = useCallback(async (id: string) => {
    loadingBoardIdRef.current = id;
    try {
      const board = await boardService.getBoard(id);
      if (loadingBoardIdRef.current !== id) return;

      if (board) {
        setCurrentBoardId(board.id);
        setBoardName(board.name);
        setBoardBg(board.bg || "white");
        isUndoRedoRef.current = true;
        try {
          const content = await boardService.getBoardContent(board.id);
          if (loadingBoardIdRef.current !== id) return;

          const newEls = content.els && content.els.length > 0 ? content.els : INIT_ELS;
          setEls(newEls);
          setHistory([newEls]);
          setHistoryIndex(0);
          setCam(content.cam || { x: window.innerWidth / 2, y: window.innerHeight / 2, z: 1 });
        } catch (e) {
          console.error("Failed to fetch board content", e);
          setEls(INIT_ELS);
          setHistory([INIT_ELS]);
          setHistoryIndex(0);
          setCam({ x: window.innerWidth / 2, y: window.innerHeight / 2, z: 1 });
        }
        setSelIds([]);
        setEditId(null);
      }
    } catch (e) {
      console.error("Failed to load board details", e);
      const board = boards.find(b => b.id === id);
      if (board) {
        setCurrentBoardId(board.id);
        setBoardName(board.name);
        setBoardBg(board.bg || "white");
        isUndoRedoRef.current = true;
        setEls(board.els);
        setHistory([board.els]);
        setHistoryIndex(0);
        setCam(board.cam);
        setSelIds([]);
        setEditId(null);
      }
    }
  }, [boards, setCurrentBoardId, setBoardName, setBoardBg, setEls, setCam, setSelIds, setEditId, INIT_ELS]);

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-card flex items-center justify-center flex-col gap-4">
        <div className="w-8 h-8 border-4 border-border border-t-[#3742FA] rounded-full animate-spin"></div>
        <div className="text-muted-foreground font-medium text-sm animate-pulse">Loading Boards...</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden w-full h-full"
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
        id="HIXCanvas-board-capture"
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
            const selected = selIds.includes(el.id);
            const editing = editId === el.id;

            const onResizeShape = (id: string, partial: any) => {
              setEls(p => p.map(e => e.id === id ? Object.assign({}, e, partial) as any : e));
            };

            switch (el.type) {
              case "sticky":
                return (
                  <StickyNote
                    key={el.id} el={el}
                    selected={selected} editing={editing}
                    zoom={cam.z}
                    onBlur={onBlur} onDblClick={onElDblClick}
                    onStartConnect={onStartConnect}
                    onUpdate={onUpdateEl}
                  />
                );
              case "text":
                return (
                  <TextNode
                    key={el.id} el={el}
                    selected={selected} editing={editing}
                    onBlur={onBlur} onDblClick={onElDblClick}
                  />
                );
              case "shape":
                return (
                  <ShapeNode
                    key={el.id} el={el as ShapeEl}
                    selected={selected}
                    onStartConnect={onStartConnect}
                    editing={editing}
                    onResize={onResizeShape}
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
              case "device_frame":
                return (
                  <DeviceFrameNode
                    key={el.id} el={el as any} selected={selected}
                    onResize={onResizeShape}
                  />
                );
              case "table":
                return (
                  <TableNode
                    key={el.id} el={el as any}
                    selected={selected}
                    editingId={editId}
                    zoom={cam.z}
                    onBlur={onBlur}
                    onDblClick={onElDblClick}
                    onUpdate={onUpdateEl}
                  />
                );
              case "icon":
                return (
                  <IconNode
                    key={el.id} el={el as any}
                    selected={selected}
                    onResize={(id, size) => onUpdateEl(id, { size })}
                  />
                );
              case "connection":
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
                        <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
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
                        style={{ pointerEvents: "none", filter: selected ? "drop-shadow(0 0 4px #3742FA)" : undefined }}
                      />
                    </g>
                  </svg>
                );
              case "free_arrow":
                const fa = el as FreeArrowEl;
                const fpt1 = { x: fa.x, y: fa.y };
                const fpt2 = { x: fa.x + fa.dx, y: fa.y + fa.dy };
                return (
                  <svg key={fa.id} className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: "none" }}>
                    <defs>
                      <marker id={`arrowhead-${fa.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill={fa.color} />
                      </marker>
                    </defs>
                    <g data-el-id={fa.id}>
                      <line
                        x1={fpt1.x} y1={fpt1.y} x2={fpt2.x} y2={fpt2.y}
                        stroke="transparent" strokeWidth="20"
                        style={{ pointerEvents: "stroke", cursor: tool === "select" ? "pointer" : undefined }}
                      />
                      <line
                        x1={fpt1.x} y1={fpt1.y} x2={fpt2.x} y2={fpt2.y}
                        stroke={fa.color} strokeWidth="3" markerEnd={`url(#arrowhead-${fa.id})`}
                        style={{ pointerEvents: "none", filter: selected ? "drop-shadow(0 0 4px #3742FA)" : undefined }}
                      />
                    </g>
                  </svg>
                );
              case "path":
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
                        style={{ pointerEvents: "none", opacity: isHighlighter ? 0.3 : 1, mixBlendMode: isHighlighter ? "multiply" : undefined, filter: selected ? "drop-shadow(0 0 4px #3742FA)" : undefined }}
                      />
                    </g>
                  </svg>
                );
              case "graph":
                return (
                  <GraphNode
                    key={el.id} el={el as any}
                    selected={selected}
                  />
                );
              default:
                return null;
            }
          })}

          {/* Group Bounding Box Overlay */}
          {selIds.length > 1 && (() => {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            selIds.forEach(id => {
              const el = els.find(x => x.id === id);
              if (!el) return;
              const box = getElementBox(el);
              if (box) {
                minX = Math.min(minX, box.cx - box.w / 2);
                minY = Math.min(minY, box.cy - box.h / 2);
                maxX = Math.max(maxX, box.cx + box.w / 2);
                maxY = Math.max(maxY, box.cy + box.h / 2);
              }
            });
            if (minX === Infinity) return null;
            return (
              <div
                className="absolute border-2 border-[#3742FA] pointer-events-none rounded-sm"
                style={{
                  left: minX - 8,
                  top: minY - 8,
                  width: (maxX - minX) + 16,
                  height: (maxY - minY) + 16,
                  zIndex: 40
                }}
              >
                <div className="absolute -top-7 left-0 bg-[#3742FA] text-white text-[11px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap">
                  {selIds.length} items selected
                </div>
              </div>
            );
          })()}

          {/* Marquee Selection Box */}
          {marquee && (
            <div
              className="absolute bg-[#3742FA]/10 border border-[#3742FA] pointer-events-none z-50"
              style={{
                left: Math.min(marquee.start.x, marquee.end.x),
                top: Math.min(marquee.start.y, marquee.end.y),
                width: Math.abs(marquee.start.x - marquee.end.x),
                height: Math.abs(marquee.start.y - marquee.end.y),
              }}
            />
          )}

          {/* Live drawing preview */}
          {(livePts.length > 1 || liveArrow) && (
            <svg className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1, pointerEvents: "none", zIndex: 9999 }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                </marker>
              </defs>
              {livePts.length > 1 && (() => {
                const isHighlighter = penType === "highlighter";
                const liveSw = penThickness;
                return (
                  <path d={pathD(livePts)} stroke={penColor} strokeWidth={liveSw} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: isHighlighter ? 0.3 : 1, mixBlendMode: isHighlighter ? "multiply" : undefined }} />
                );
              })()}
              {liveArrow && (
                <line x1={liveArrow.start.x} y1={liveArrow.start.y} x2={liveArrow.end.x} y2={liveArrow.end.y} stroke="currentColor" strokeWidth="3" markerEnd="url(#arrowhead)" opacity={0.5} />
              )}
            </svg>
          )}

          {/* Peer Selections */}
          {peers.map(p => {
            if (!p.selIds || p.selIds.length === 0) return null;
            return p.selIds.map(sid => {
              const el = els.find(e => e.id === sid);
              if (!el) return null;

              const box = getElementBox(el);
              if (!box) return null;

              return (
                <div
                  key={`sel-${p.id}-${sid}`}
                  className="absolute pointer-events-none transition-all duration-[50ms]"
                  style={{
                    left: box.cx - box.w / 2 - 4,
                    top: box.cy - box.h / 2 - 4,
                    width: box.w + 8,
                    height: box.h + 8,
                    border: `2px solid ${p.color}`,
                    zIndex: 50
                  }}
                >
                  <div
                    className="absolute -top-5 left-[-2px] px-1.5 py-0.5 text-[10px] text-white font-bold whitespace-nowrap shadow-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name}
                  </div>
                </div>
              );
            });
          })}

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
                    className="absolute top-10 left-1/2 -translate-x-1/2 bg-card rounded-xl shadow-xl border border-border p-3 min-w-[200px] z-50"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-border pb-1.5 mb-1.5">
                      <span className="font-semibold text-xs text-foreground">{c.author}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground whitespace-pre-wrap select-text">{c.text}</p>
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
              className="absolute bg-card rounded-xl shadow-xl border border-border p-3 w-64 z-50 pointer-events-auto"
              style={{
                left: activePlacement.x,
                top: activePlacement.y,
              }}
            >
              <div className="text-xs font-semibold text-muted-foreground mb-1">New comment by {getSessionUser()}</div>
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
                className="w-full border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#3742FA]/20 focus:border-[#3742FA] outline-none resize-none h-16 text-foreground"
              />
              <div className="flex justify-end gap-1.5 mt-2">
                <button
                  onClick={() => {
                    setActivePlacement(null);
                    setTool("select");
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-background rounded-lg transition-colors"
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
        setPenType={handlePenTypeChange}
        penThickness={penThickness}
        setPenThickness={setPenThickness}
        toolMenuOpen={toolMenuOpen}
        setToolMenuOpen={setToolMenuOpen}
        onDelete={onDelete}
        hasSelection={selIds.length > 0}
        onInsertIcon={onInsertIcon}
        isEditingOrSelectedText={isEditingOrSelectedText}
        textFontSize={textFontSize}
        setTextFontSize={handleTextFontSizeChange}
        textFontFamily={textFontFamily}
        setTextFontFamily={handleTextFontFamilyChange}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-in fade-in slide-in-from-top-2 z-[9999] pointer-events-none ${toast.type === 'success' ? 'bg-green-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
          {toast.text}
        </div>
      )}

      {/* Top bar */}
      <TopBar
        currentBoardId={currentBoardId}
        boardName={boardName}
        boardBg={boardBg}
        saveState={saveState}
        onChangeBg={setBoardBg}
        onChangeBoard={handleChangeBoard}
        onRenameBoard={handleRenameBoard}
        onDeleteBoard={handleDeleteBoard}
        onCreateBoard={handleCreateBoard}
        boards={boards}
        showToast={showToast}
        role={userRole}
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
        return (
          <div
            key={p.id}
            className="absolute top-0 left-0 pointer-events-none z-40 transition-transform duration-[50ms] ease-linear"
            style={{ transform: `translate(${screenX}px, ${screenY}px)` }}
          >
            <svg width="20" height="26" viewBox="0 0 16 23" fill={p.color} stroke="white" strokeWidth="2" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>
              <path d="M1.3853 0.385299C0.840742 -0.159258 0 0.226343 0 0.996155V21.1398C0 21.9405 0.992646 22.3168 1.52355 21.7145L5.78762 16.8797L9.58801 22.6517C9.91428 23.1472 10.5843 23.2882 11.0853 22.9666L13.1118 21.6659C13.6128 21.3444 13.7538 20.6811 13.4276 20.1856L9.62719 14.4136H15.0038C15.7737 14.4136 16.1593 13.4834 15.6147 12.9388L1.3853 0.385299Z" />
            </svg>
            <div className="absolute top-5 left-4 flex flex-col gap-1 pointer-events-none">
              <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-md" style={{ backgroundColor: p.color }}>
                <span>{p.name}</span>
                {p.editingId && <span className="opacity-80 font-medium">(Editing)</span>}
              </div>
              {p.isTyping && (
                <div className="bg-card px-2 py-1.5 rounded-full shadow-md flex items-center justify-center gap-1 max-w-max border border-border">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
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
            const msgId = uid();
            const optimisticMsg: LiveChatMessage = {
              message_id: msgId,
              board_id: currentBoardId,
              user_id: currentUserId,
              username: getSessionUser(),
              message,
              timestamp: new Date().toISOString()
            };
            setLiveChatMessages(prev => {
              if (prev.some(m => m.message_id === msgId)) return prev;
              return [...prev, optimisticMsg];
            });
            websocketService.send("chat_message", { message_id: msgId, message });
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
        <div className="absolute top-24 right-6 w-80 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border flex flex-col z-50 pointer-events-auto overflow-hidden max-h-[500px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border">
            <div className="flex items-center gap-2 text-foreground">
              <MessageSquare size={16} className="text-[#3742FA]" />
              <span className="font-bold text-sm">Comments</span>
            </div>
            <button
              onClick={() => {
                setIsCommentWindowOpen(false);
                if (tool === "comment") setTool("select");
              }}
              className="text-gray-400 hover:text-muted-foreground rounded-lg p-1 hover:bg-muted transition-colors"
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
                  <div key={c.id} className="p-2.5 bg-background/70 hover:bg-background rounded-xl border border-border/80 transition-all flex flex-col gap-1 relative group/item">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: c.color || "#3742FA" }}
                        >
                          {c.author ? c.author.slice(0, 2).toUpperCase() : "C"}
                        </div>
                        <span className="font-semibold text-xs text-foreground">{c.author}</span>
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
            className="relative flex items-center justify-center bg-card border border-border text-foreground shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden gap-2.5 px-5 h-14 rounded-full"
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm text-xs text-muted-foreground px-3 py-1.5 rounded-full shadow-md border border-border pointer-events-none">
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
