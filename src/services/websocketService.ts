import { El, Cam } from "../types";

export interface WebSocketMessage {
  type: string;
  els?: El[];
  cam?: Cam;
  [key: string]: any;
}

type MessageCallback = (msg: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentBoardId: string | null = null;
  private messageListeners: Set<MessageCallback> = new Set();
  private isIntentionalClose = false;

  public connect(boardId: string) {
    if (this.ws) {
      this.disconnect();
    }

    this.currentBoardId = boardId;
    this.isIntentionalClose = false;
    this.reconnectAttempts = 0;
    this.initSocket();
  }

  private initSocket() {
    if (!this.currentBoardId || this.isIntentionalClose) return;

    // Use environment variable or fallback to current host with ws/wss protocol
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const wsUrl = API_URL.replace(/^http/, "ws") + `/ws/board/${this.currentBoardId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`WebSocket connected for board ${this.currentBoardId}`);
        this.reconnectAttempts = 0; // Reset on successful connect
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageListeners.forEach(listener => listener(data));
        } catch (e) {
          console.error("Failed to parse WebSocket message", e);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          const timeout = Math.pow(2, this.reconnectAttempts) * 1000;
          this.reconnectAttempts++;
          console.log(`Reconnecting in ${timeout}ms...`);
          setTimeout(() => this.initSocket(), timeout);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error", error);
      };
    } catch (e) {
      console.error("WebSocket connection failed", e);
    }
  }

  public disconnect() {
    this.isIntentionalClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public send(msg: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public onMessage(callback: MessageCallback) {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }
}

export const websocketService = new WebSocketService();
