import { El, Cam } from "../types";

export interface WebSocketMessage {
  type: string;
  board_id?: string;
  user_id?: string;
  payload?: any;
  els?: El[];
  cam?: Cam;
  [key: string]: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private boardId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number | null = null;
  private isIntentionalDisconnect: boolean = false;
  private messageQueue: WebSocketMessage[] = [];
  private userInfo: any = {};

  // Handlers for consumer to listen to
  public onMessageCallback: ((msg: WebSocketMessage) => void) | null = null;
  public onOpenCallback: (() => void) | null = null;
  public onCloseCallback: (() => void) | null = null;

  private getWSUrl(boardId: string): string {
    const token = localStorage.getItem("HIXCanvas_token") || localStorage.getItem("token");
    const apiHost = import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL).host
      : (import.meta.env.DEV ? "127.0.0.1:8000" : window.location.host);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let wsUrl = `${protocol}//${apiHost}/ws/board/${boardId}`;

    if (token) {
      wsUrl += `?token=${encodeURIComponent(token)}`;
    }

    console.log({ boardId, tokenExists: !!token, wsUrl });
    return wsUrl;
  }

  public connect(boardId: string, userInfo: any = {}) {
    if (this.ws && this.boardId === boardId) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        if (!this.isIntentionalDisconnect) {
          return;
        }
      }
    }

    this.boardId = boardId;
    this.userInfo = userInfo;
    this.isIntentionalDisconnect = false;

    const oldWs = this.ws;
    this.ws = null;

    const url = this.getWSUrl(boardId);
    console.log("Connecting to WebSocket...");

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log(`WebSocket connected for board ${boardId}`);
        this.reconnectAttempts = 0;

        // Safely close the old socket
        if (oldWs) {
          if (oldWs.readyState === WebSocket.OPEN) {
            try { oldWs.send(JSON.stringify({ type: "leave", payload: { message: "User left the room." } })); } catch (e) { }
            oldWs.close(1000, "User switched boards");
          } else if (oldWs.readyState === WebSocket.CONNECTING) {
            oldWs.onopen = () => oldWs.close(1000, "User switched boards");
          } else {
            oldWs.close();
          }
        }

        // Notify the server we joined
        this.send("join", {
          message: "User connected to the room.",
          ...this.userInfo
        });

        // Flush queued messages
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          if (msg && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
          }
        }

        if (this.onOpenCallback) this.onOpenCallback();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          if (this.onMessageCallback) {
            this.onMessageCallback(data);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket disconnected");
        this.ws = null;

        if (this.onCloseCallback) this.onCloseCallback();

        // 1008 is Policy Violation (usually auth failure). Don't retry.
        if (event.code === 1008) {
          console.error("WebSocket closed due to policy violation (auth failure).");
          return;
        }

        if (!this.isIntentionalDisconnect) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

    } catch (err) {
      console.error("Failed to initialize WebSocket:", err);
    }
  }

  public disconnect() {
    this.isIntentionalDisconnect = true;
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      if (this.ws.readyState === WebSocket.CONNECTING) {
        const socketToClose = this.ws;
        socketToClose.onopen = () => socketToClose.close(1000, "User left the board");
      } else if (this.ws.readyState === WebSocket.OPEN) {
        this.send("leave", { message: "User left the room." });
        this.ws.close(1000, "User left the board");
      } else {
        this.ws.close();
      }
      this.ws = null;
    }
    this.boardId = null;
  }

  public send(type: string, payload: any = {}) {
    if (this.isIntentionalDisconnect) return;

    const message: WebSocketMessage = {
      type,
      board_id: this.boardId || undefined,
      payload
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    if (!this.boardId) return;

    this.reconnectAttempts++;
    const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`Reconnecting in ${timeout}ms... (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = window.setTimeout(() => {
      if (this.boardId) {
        this.connect(this.boardId, this.userInfo);
      }
    }, timeout);
  }
}

// Export as a singleton
export const websocketService = new WebSocketService();
