import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import App from '../app/App';
import { boardService } from '../services/boardService';
import { collaborationService } from '../services/collaborationService';
import { websocketService } from '../services/websocketService';
import type { El, Cam } from '../types';
import { toast } from 'sonner';

export default function BoardPage() {
  const { board_id } = useParams<{ board_id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boardData, setBoardData] = useState<any>(null);
  const [role, setRole] = useState<"owner" | "editor" | "viewer">("owner");
  
  // Ref for debouncing save operations
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!board_id) {
      navigate('/');
      return;
    }

    const fetchBoard = async () => {
      try {
        setLoading(true);
        const [data, userRole] = await Promise.all([
          boardService.getBoard(board_id),
          collaborationService.getBoardRole(board_id).catch(() => "viewer" as const)
        ]);

        let finalRole = userRole;
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (data.owner_id === payload.sub) {
              finalRole = "owner";
            }
          }
        } catch (e) {}

        setBoardData(data);
        setRole(finalRole as any);
      } catch (err) {
        console.error('Failed to load board', err);
        setError('Board not found or you do not have permission to access it.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [board_id, navigate]);

  // Handle WebSocket connection lifecycle
  useEffect(() => {
    if (!board_id || loading || error) return;
    
    // Connect to WebSocket when board is loaded successfully
    let name = "Guest";
    try {
      const s = localStorage.getItem("figjam_session");
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && parsed.name) name = parsed.name;
      }
    } catch (e) {}
    
    const colors = ["#F24E1E", "#1ABCFE", "#0ACF83", "#FF7262", "#A259FF"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const session_id = Math.random().toString(36).substring(2, 9);

    websocketService.connect(board_id, { name, color, user_id: session_id });

    return () => {
      // Disconnect when component unmounts
      websocketService.disconnect();
    };
  }, [board_id, loading, error]);

  const lastSavedDataRef = useRef<string>("");

  const handleSave = useCallback((name: string, els: El[], cam: Cam) => {
    if (!board_id) return;
    
    const currentData = JSON.stringify({ name, els, cam });
    if (lastSavedDataRef.current === currentData) return; // Deduplicate

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save for 2 seconds
    saveTimeoutRef.current = window.setTimeout(async () => {
      let attempts = 0;
      const maxAttempts = 3;
      
      const attemptSave = async () => {
        try {
          await boardService.updateBoard(board_id, name);
          await boardService.saveBoardContent(board_id, {
            nodes: els,
            edges: [],
            stickyNotes: [],
            drawings: [],
            images: [],
            cam: cam,
          });
          lastSavedDataRef.current = currentData;
        } catch (err) {
          console.error('Auto-save failed', err);
          attempts++;
          if (attempts < maxAttempts) {
            toast.error(`Save failed. Retrying... (${attempts}/${maxAttempts})`);
            setTimeout(attemptSave, 2000 * Math.pow(2, attempts)); // Exponential backoff
          } else {
            toast.error('Failed to save board after multiple attempts. Please check your connection.');
          }
        }
      };
      
      attemptSave();
    }, 2000);
  }, [board_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Map the backend boardData back to frontend props
  // Backend returns: id, name, owner_id, created_at, updated_at, content (dict)
  const initialEls = boardData?.content?.nodes || [];
  const rawCam = boardData?.content?.cam;
  const initialCam = {
    x: rawCam?.x ?? window.innerWidth / 2,
    y: rawCam?.y ?? window.innerHeight / 2,
    z: rawCam?.z ?? rawCam?.zoom ?? 1
  };
  const initialName = boardData?.name || 'Untitled Board';

  return (
    <App 
      initialBoardId={board_id} 
      initialName={initialName} 
      initialEls={initialEls} 
      initialCam={initialCam} 
      onSave={handleSave} 
      role={role}
    />
  );
}
