import type { El } from "../types";

export interface ChatRequest {
  message: string;
  session_id: string;
  context: {
    board_id?: string;
    board_name?: string;
    nodes: El[];
  };
}

const API_URL = import.meta.env.VITE_API_URL || "";

export const chatService = {
  async askStream(
    message: string,
    sessionId: string,
    boardContext: { boardId?: string; boardName?: string; nodes: El[] },
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: any) => void
  ) {
    try {
      const payload: ChatRequest = {
        message,
        session_id: sessionId,
        context: boardContext,
      };

      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        throw new Error("Streaming not supported by response");
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          onDone();
          break;
        }
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          onChunk(chunkStr);
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      onError(err);
    }
  },
  async askDocumentStream(
    message: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: any) => void
  ) {
    try {
      const response = await fetch(`${API_URL}/board/search-document-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: message, document_mode: true }),
      });
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("Streaming not supported");
      while (true) {
        const { value, done } = await reader.read();
        if (done) { onDone(); break; }
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          onChunk(chunkStr);
        }
      }
    } catch (err) {
      onError(err);
    }
  },

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("skip_ocr", "false");
    formData.append("skip_summary", "false");
    const response = await fetch(`${API_URL}/board/upload-file`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error(`Upload error: ${response.statusText}`);
    const data = await response.json();
    return data.task_id;
  },

  async checkFileStatus(taskId: string): Promise<any> {
    const response = await fetch(`${API_URL}/board/status/${taskId}`);
    if (!response.ok) throw new Error(`Status error: ${response.statusText}`);
    return response.json();
  },

  async generateFlowchart(prompt: string): Promise<string> {
    const response = await fetch(`${API_URL}/generate-flowchart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error(`Flowchart error: ${response.statusText}`);
    const data = await response.json();
    return data.mermaid;
  },

  async generateGraph(prompt: string, boardId?: string): Promise<any> {
    const response = await fetch(`${API_URL}/generate-graph`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, board_id: boardId }),
    });
    if (!response.ok) throw new Error(`Graph error: ${response.statusText}`);
    return response.json();
  }
};
