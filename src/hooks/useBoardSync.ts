import { useState, useEffect, useRef } from 'react';
import { boardService } from '../services/boardService';
import { Board, El, Cam } from '../types';

interface UseBoardSyncProps {
  currentBoardId: string;
  setCurrentBoardId: (id: string) => void;
  boardName: string;
  setBoardName: (name: string) => void;
  boardBg: "white" | "black" | "green";
  setBoardBg: (bg: "white" | "black" | "green") => void;
  els: El[];
  setEls: (els: El[]) => void;
  cam: Cam;
  setCam: (cam: Cam) => void;
  INIT_ELS: El[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isRemoteUpdateRef: React.MutableRefObject<boolean>;
  websocketService: any;
  urlBoardId?: string;
  navigate?: any;
}

export function useBoardSync({
  currentBoardId, setCurrentBoardId, boardName, setBoardName, boardBg, setBoardBg,
  els, setEls, cam, setCam, INIT_ELS, showToast, isRemoteUpdateRef, websocketService,
  urlBoardId, navigate
}: UseBoardSyncProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const isSavingRef = useRef(false);
  const saveTimeoutRef = useRef<any>(null);

  // Initial load
  useEffect(() => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    setCam({ x: cx, y: cy, z: 1 });

    boardService.getBoards().then(async fetchedBoards => {
      console.log("Boards from backend:", fetchedBoards);
      if (!fetchedBoards || fetchedBoards.length === 0) {
        try {
          const newId = await boardService.createBoard("Untitled Board");
          const newBoard: Board = { id: newId, name: "Untitled Board", bg: "white", els: INIT_ELS, cam: { x: cx, y: cy, z: 1 }, updatedAt: Date.now() };
          setBoards([newBoard]);
          setCurrentBoardId(newId);
          setBoardName("Untitled Board");
          setBoardBg("white");
          setEls(INIT_ELS);
          setCam({ x: cx, y: cy, z: 1 });
        } catch (e) {
          console.error("Failed to create initial board", e);
          fallbackToLocal(cx, cy);
        }
      } else {
        setBoards(fetchedBoards);
        const selectedBoard = urlBoardId 
          ? fetchedBoards.find(b => b.id === urlBoardId) || fetchedBoards[0]
          : fetchedBoards[0];
        setCurrentBoardId(selectedBoard.id);
        setBoardName(selectedBoard.name);
        setBoardBg(selectedBoard.bg || "white");
        console.log("Selected board:", selectedBoard);
        try {
          const content = await boardService.getBoardContent(selectedBoard.id);
          console.log("Board content:", content);
          
          let loadedEls = content.els && content.els.length > 0 ? content.els : null;
          let loadedCam = content.cam;
          
          // Fallback to local storage if backend returned empty elements
          if (!loadedEls) {
            const localEls = localStorage.getItem(`board-${selectedBoard.id}-els`);
            if (localEls) {
              try { loadedEls = JSON.parse(localEls); } catch (err) {}
            }
          }
          if (!loadedCam) {
            const localCam = localStorage.getItem(`board-${selectedBoard.id}-cam`);
            if (localCam) {
              try { loadedCam = JSON.parse(localCam); } catch (err) {}
            }
          }
          
          setEls(loadedEls && loadedEls.length > 0 ? loadedEls : INIT_ELS);
          setCam(loadedCam || { x: cx, y: cy, z: 1 });
        } catch (e) {
          console.error("Failed to fetch board content", e);
          fallbackToLocalLoad(selectedBoard.id, cx, cy);
        }
      }
    }).catch(e => {
      console.error("Failed to fetch boards", e);
      fallbackToLocal(cx, cy);
    }).finally(() => {
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fallbackToLocal = (cx: number, cy: number) => {
    const fallbackId = urlBoardId || "local-board";
    setCurrentBoardId(fallbackId);
    
    const localName = localStorage.getItem(`board-${fallbackId}-name`) || "Untitled Board";
    setBoardName(localName);
    
    const localBg = localStorage.getItem(`board-${fallbackId}-bg`) as any || "white";
    setBoardBg(localBg);
    
    fallbackToLocalLoad(fallbackId, cx, cy);
  };

  const fallbackToLocalLoad = (id: string, cx: number, cy: number) => {
    const localEls = localStorage.getItem(`board-${id}-els`);
    const localCam = localStorage.getItem(`board-${id}-cam`);
    
    let parsedEls = INIT_ELS;
    let parsedCam = { x: cx, y: cy, z: 1 };
    
    try { if (localEls) parsedEls = JSON.parse(localEls); } catch(e) {}
    try { if (localCam) parsedCam = JSON.parse(localCam); } catch(e) {}
    
    setEls(parsedEls.length > 0 ? parsedEls : INIT_ELS);
    setCam(parsedCam);
  };

  // Sync board state updates to local state and backend
  useEffect(() => {
    if (!currentBoardId) return;
    
    // Save to LocalStorage immediately as a fallback!
    try {
      // Don't save empty board right away on load if we just initialized, but els will always have length unless cleared
      localStorage.setItem(`board-${currentBoardId}-els`, JSON.stringify(els));
      localStorage.setItem(`board-${currentBoardId}-cam`, JSON.stringify(cam));
      localStorage.setItem(`board-${currentBoardId}-name`, boardName);
      localStorage.setItem(`board-${currentBoardId}-bg`, boardBg);
    } catch (e) {
      console.error("Local storage save failed", e);
    }
    
    // Update local boards list
    setBoards(prev => {
      const updated = prev.map(b => b.id === currentBoardId ? { ...b, els, cam, name: boardName, bg: boardBg, updatedAt: Date.now() } : b);
      if (!updated.find(b => b.id === currentBoardId)) {
        updated.push({ id: currentBoardId, name: boardName, bg: boardBg, els, cam, updatedAt: Date.now() });
      }
      return updated;
    });

    // Broadcast local changes via WebSocket
    if (!isRemoteUpdateRef.current) {
      websocketService.send({ type: "update", els, cam });
    }

    // Sync URL
    if (navigate && currentBoardId) {
      const slug = boardName ? boardName.replace(/[^a-zA-Z0-9 -]/g, '').trim().replace(/\s+/g, '-') : "board";
      navigate(`/board/${currentBoardId}/${slug}`, { replace: true });
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Debounced API save
    saveTimeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return; // Avoid duplicate requests
      
      setSaveState("saving");
      isSavingRef.current = true;

      const performSave = async (retryCount = 0) => {
        try {
          await boardService.saveBoardContent(currentBoardId, els, cam);
          setSaveState("saved");
          showToast("Board saved");
          setTimeout(() => {
            setSaveState(prev => prev === "saved" ? "idle" : prev);
          }, 2000);
        } catch (err) {
          console.error("Save failed", err);
          if (retryCount < 3) {
            setTimeout(() => performSave(retryCount + 1), 2000);
          } else {
            setSaveState("error");
            showToast("Autosave failed (Saved locally)", "error");
          }
        } finally {
          if (retryCount === 0 || saveState === "error" || saveState === "saved") {
            isSavingRef.current = false;
          }
        }
      };

      performSave();
    }, 1500);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [els, cam, boardName, currentBoardId, boardBg, showToast, websocketService, isRemoteUpdateRef]);

  return { boards, setBoards, isLoading, saveState };
}
