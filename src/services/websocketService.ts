type WebSocketMessage = {
  type: string;
  board_id?: string;
  user_id?: string;
  payload?: any;
  [key: string]: any;
};

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
    const token = localStorage.getItem("token");
    const apiHost = import.meta.env.VITE_API_URL 
      ? new URL(import.meta.env.VITE_API_URL).host
      : window.location.host;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let wsUrl = `${protocol}//${apiHost}/ws/board/${boardId}`;
    
    if (token) {
      wsUrl += `?token=${encodeURIComponent(token)}`;
    }
    return wsUrl;
  }

  public connect(boardId: string, userInfo: any = {}) {
    if (this.ws && this.boardId === boardId) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        if (!this.isIntentionalDisconnect) {
          return; // prevent duplicate connect calls or reconnect loops
        }
      }
    }

    this.boardId = boardId;
    this.userInfo = userInfo;
    this.isIntentionalDisconnect = false;
    
    // Do not close the old socket immediately to allow seamless transition
    // We will close it once the new socket is completely OPEN
    const oldWs = this.ws;
    this.ws = null;

    const url = this.getWSUrl(boardId);
    console.log("Connecting...");
    
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("Connected");
        console.log("Joined Room");
        this.reconnectAttempts = 0; // Reset attempts on successful connection

        // Safely close the old socket now that the new one is successfully OPEN
        if (oldWs) {
          if (oldWs.readyState === WebSocket.OPEN) {
            try { oldWs.send(JSON.stringify({ type: "leave", payload: { message: "User left the room." } })); } catch (e) {}
            oldWs.close(1000, "User switched boards");
          } else if (oldWs.readyState === WebSocket.CONNECTING) {
            // Prevent the "WebSocket is closed before the connection is established" warning
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
        
        // Flush queue
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          if (msg && this.ws?.readyState === WebSocket.OPEN) {
            console.log("Sending Message", msg);
            this.ws.send(JSON.stringify(msg));
          }
        }
        
        if (this.onOpenCallback) this.onOpenCallback();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log("Received Message", data);
          
          if (this.onMessageCallback) {
            this.onMessageCallback(data);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log("Disconnected");
        this.ws = null;
        
        if (this.onCloseCallback) this.onCloseCallback();

        // 1008 is Policy Violation (usually auth failure). Don't retry.
        if (event.code === 1008) {
          return;
        }

        if (!this.isIntentionalDisconnect) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
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
        // Redefine onopen to close it, preventing the browser warning!
        const socketToClose = this.ws;
        socketToClose.onopen = () => socketToClose.close(1000, "User left the board");
      } else if (this.ws.readyState === WebSocket.OPEN) {
        // Send a leave message before closing
        this.send("leave", { message: "User left the room." });
        this.ws.close(1000, "User left the board");
      } else {
        this.ws.close();
      }
      this.ws = null;
    }
    this.boardId = null;
    // Intentionally preserving messageQueue so events aren't lost during fast React unmount/remounts
  }

  public send(type: string, payload: any = {}) {
    if (this.isIntentionalDisconnect) return;

    const message: WebSocketMessage = {
      type,
      board_id: this.boardId || undefined,
      payload
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("Sending Message", message);
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
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s...
    const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log("Reconnecting...");
    
    this.reconnectTimeout = window.setTimeout(() => {
      if (this.boardId) {
        this.connect(this.boardId, this.userInfo);
      }
    }, timeout);
  }
}

// Export as a singleton
export const websocketService = new WebSocketService();
