import { useState, useEffect, useRef, useCallback } from 'react';
import { websocketService } from '../services/websocketService';
import { Peer, El, Cam } from '../types';

interface UseLiveCollaborationProps {
  currentBoardId: string;
  mySessionId: string;
  myColor: string;
  setEls: React.Dispatch<React.SetStateAction<El[]>>;
  setCam: React.Dispatch<React.SetStateAction<Cam>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  selIdsRef: React.MutableRefObject<string[]>;
  isRemoteUpdateRef: React.MutableRefObject<boolean>;
}

export function useLiveCollaboration({
  currentBoardId,
  mySessionId,
  myColor,
  setEls,
  setCam,
  showToast,
  selIdsRef,
  isRemoteUpdateRef
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

    websocketService.send({
      type: "presence",
      id: mySessionId,
      name: "You", // fallback
      color: myColor,
      x, y,
      selIds: selIdsRef.current,
      isTyping: !!editIdRef.current,
      editingId: editIdRef.current
    });
  }, [currentBoardId, mySessionId, myColor, selIdsRef]);

  // Connect to WebSocket on board change
  useEffect(() => {
    if (!currentBoardId) return;

    websocketService.connect(currentBoardId);

    const unsubscribe = websocketService.onMessage((msg) => {
      if (msg.type === "update") {
        isRemoteUpdateRef.current = true;
        if (msg.els) setEls(msg.els);
        if (msg.cam) setCam(msg.cam);
        
        // Defer resetting the flag so the sync useEffect doesn't treat this as local
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 50);
      } else if (msg.type === "presence" && msg.id !== mySessionId) {
        setPeers(prev => {
          const idx = prev.findIndex(p => p.id === msg.id);
          const updatedPeer = {
            id: msg.id,
            name: msg.name || "Guest",
            color: msg.color || "#1ABCFE",
            x: msg.x ?? 0,
            y: msg.y ?? 0,
            selIds: msg.selIds,
            isTyping: msg.isTyping,
            editingId: msg.editingId,
            lastUpdate: Date.now()
          };
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...updatedPeer };
            return next;
          }
          showToast(`Collaborator joined: ${updatedPeer.name}`, "info");
          return [...prev, updatedPeer as Peer];
        });
      } else if (msg.type === "invitation_received") {
        showToast("Invitation received", "info");
      } else if (msg.type === "invitation_accepted") {
        showToast("Invitation accepted", "success");
      }
    });

    return () => {
      unsubscribe();
      websocketService.disconnect();
    };
  }, [currentBoardId, mySessionId, setCam, setEls, showToast, isRemoteUpdateRef]);

  // Cleanup inactive peers
  useEffect(() => {
    const int = setInterval(() => {
      const now = Date.now();
      setPeers(prev => {
        const active = prev.filter(p => p.lastUpdate && (now - p.lastUpdate < 10000));
        const removed = prev.filter(p => !p.lastUpdate || (now - p.lastUpdate >= 10000));
        removed.forEach(r => showToast(`Collaborator left: ${r.name}`, "info"));
        return active;
      });
    }, 5000);
    return () => clearInterval(int);
  }, [showToast]);

  return { peers, setPeers, broadcastPresence, setBroadcastEditId };
}
