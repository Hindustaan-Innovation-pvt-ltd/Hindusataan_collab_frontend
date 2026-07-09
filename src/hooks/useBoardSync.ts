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
      if (fetchedBoards && fetchedBoards.length > 0) {
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
          setEls(content.els && content.els.length > 0 ? content.els : INIT_ELS);
          setCam(content.cam || { x: cx, y: cy, z: 1 });
        } catch (e) {
          console.error("Failed to fetch board content", e);
          setEls(INIT_ELS);
          setCam({ x: cx, y: cy, z: 1 });
        }
      }
    }).catch(e => {
      console.error("Failed to fetch boards", e);
    }).finally(() => {
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync board state updates to local state and backend
  useEffect(() => {
    if (!currentBoardId) return;
    
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
            showToast("Autosave failed", "error");
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
