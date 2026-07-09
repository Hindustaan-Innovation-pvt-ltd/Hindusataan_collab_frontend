import type { El } from "../types";
import api from "./api";

export interface ChatRequest {
  message: string;
  session_id: string;
  context: {
    board_id?: string;
    board_name?: string;
    nodes: El[];
  };
}



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

      let lastIndex = 0;
      await api.post("/chat", payload, {
        responseType: "text",
        onDownloadProgress: (progressEvent: any) => {
          const xhr = progressEvent.event?.target;
          if (xhr && xhr.responseText) {
            const chunkStr = xhr.responseText.substring(lastIndex);
            lastIndex = xhr.responseText.length;
            onChunk(chunkStr);
          }
        },
      });
      onDone();
    } catch (err) {
      console.error("Chat error:", err);
      onError(err);
    }
  },
  async searchDocument(boardId: string, query: string): Promise<string> {
    const response = await api.post("/search", {
      board_id: boardId,
      query: query
    });
    return response.data.answer;
  },



  async uploadFile(file: File, onProgress?: (percent: number) => void): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("skip_ocr", "false");
    formData.append("skip_summary", "false");
    
    const response = await api.post("/board/upload-file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) {
            onProgress(percentCompleted);
          }
        }
      },
    });
    
    return response.data.task_id;
  },

  async checkFileStatus(taskId: string): Promise<any> {
    const response = await api.get(`/board/status/${taskId}`);
    return response.data;
  },

  async generateFlowchart(prompt: string): Promise<string> {
    const response = await api.post("/diagram/generate-flowchart", { prompt });
    return response.data.mermaid;
  },

  async generateGraph(prompt: string, boardId?: string): Promise<any> {
    const response = await api.post("/diagram/generate-graph", {
      prompt,
      board_id: boardId
    });
    return response.data;
  }
};
