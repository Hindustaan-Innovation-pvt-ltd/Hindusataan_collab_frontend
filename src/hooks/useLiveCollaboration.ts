import { useState, useEffect, useRef, useCallback } from 'react';
import { websocketService } from '../services/websocketService';
import { Peer } from '../types';

interface UseLiveCollaborationProps {
  currentBoardId: string;
  mySessionId: string;
  myColor: string;
  selIdsRef: React.MutableRefObject<string[]>;
}

export function useLiveCollaboration({
  currentBoardId,
  mySessionId,
  myColor,
  selIdsRef
}: UseLiveCollaborationProps) {
  const [peers, setPeers] = useState<Peer[]>([]);
  const editIdRef = useRef<string | null>(null);
  const lastPresenceTime = useRef(0);
  
  // Track edit state purely for broadcasting
  const setBroadcastEditId = useCallback((id: string | null) => {
    editIdRef.current = id;
  }, []);

  const getSessionUser = useCallback(() => {
    try {
      const s = localStorage.getItem("HIXCanvas_session");
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && parsed.name) return parsed.name;
      }
    } catch (e) { }
    return "Collaborator";
  }, []);

  const broadcastPresence = useCallback((x: number, y: number, force: boolean = false) => {
    if (!currentBoardId) return;
    const now = Date.now();
    if (!force && now - lastPresenceTime.current < 50) return; // 50ms throttle
    lastPresenceTime.current = now;

    websocketService.send("cursor_update", {
      id: mySessionId,
      name: getSessionUser(),
      color: myColor,
      x, y,
      selIds: selIdsRef.current,
      isTyping: !!editIdRef.current,
      editingId: editIdRef.current
    });
  }, [currentBoardId, mySessionId, selIdsRef, myColor, getSessionUser]);

  // Connect to WebSocket on board change
  useEffect(() => {
    if (!currentBoardId) return;

    let userInfo: any = { name: getSessionUser(), color: myColor };
    try {
      const s = localStorage.getItem("HIXCanvas_session");
      if (s) {
        const parsed = JSON.parse(s);
        userInfo = {
          ...userInfo,
          name: parsed.name || userInfo.name,
          id: parsed.id || parsed.user_id || parsed.userId || "",
          avatar: parsed.avatar || ""
        };
      }
    } catch(e) {}

    websocketService.connect(currentBoardId, userInfo);

    return () => {
      websocketService.disconnect();
    };
  }, [currentBoardId, myColor, getSessionUser]);

  // Cleanup inactive peers
  useEffect(() => {
    const int = setInterval(() => {
      const now = Date.now();
      setPeers(prev => {
        const active = prev.filter(p => p.lastUpdate && (now - p.lastUpdate < 10000));
        return active;
      });
    }, 5000);
    return () => clearInterval(int);
  }, []);

  return { peers, setPeers, broadcastPresence, setBroadcastEditId };
}
