import { fetchWithAuth } from './api';

export interface LiveChatMessage {
  message_id?: string;
  board_id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: string;
}

export const liveChatService = {
  async getChatHistory(boardId: string): Promise<LiveChatMessage[]> {
    const res = await fetchWithAuth(`/api/collaboration/board/${boardId}/chat`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || 'Failed to fetch chat history');
    return data.data?.messages || [];
  }
};
