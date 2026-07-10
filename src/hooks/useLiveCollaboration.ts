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

  const broadcastPresence = useCallback((x: number, y: number, force: boolean = false) => {
    if (!currentBoardId) return;
    const now = Date.now();
    if (!force && now - lastPresenceTime.current < 50) return; // 50ms throttle
    lastPresenceTime.current = now;

    websocketService.send("cursor_update", {
      id: mySessionId,
      color: myColor,
      x, y,
      selIds: selIdsRef.current,
      isTyping: !!editIdRef.current,
      editingId: editIdRef.current
    });
  }, [currentBoardId, mySessionId, selIdsRef, myColor]);

  // Connect to WebSocket on board change
  useEffect(() => {
    if (!currentBoardId) return;

    websocketService.connect(currentBoardId);

    return () => {
      websocketService.disconnect();
    };
  }, [currentBoardId]);

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
