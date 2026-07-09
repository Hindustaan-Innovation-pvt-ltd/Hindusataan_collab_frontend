import { fetchWithAuth } from './api';
import type { BoardMeta } from '../types';

export const boardService = {
  async getBoards(): Promise<BoardMeta[]> {
    const res = await fetchWithAuth('/boards/');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || 'Failed to fetch boards');
    return data.map((b: any) => ({
      id: b._id,
      name: b.title || b.name,
      owner_id: b.owner_id,
      created_at: b.created_at,
      updated_at: b.updated_at,
    }));
  },

  async createBoard(name: string): Promise<string> {
    const res = await fetchWithAuth('/boards/', {
      method: 'POST',
      body: JSON.stringify({ title: name }), // Map name to title
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || 'Failed to create board');
    return data.board_id;
  },

  async getBoard(id: string): Promise<any> {
    const res = await fetchWithAuth(`/boards/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || 'Failed to fetch board');
    return {
      id: data._id,
      name: data.title || data.name,
      content: data.board_data || data.content,
      owner_id: data.owner_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  async updateBoard(id: string, name: string): Promise<void> {
    const res = await fetchWithAuth(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'Failed to update board');
    }
  },

  async deleteBoard(id: string): Promise<void> {
    const res = await fetchWithAuth(`/boards/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'Failed to delete board');
    }
  },

  async saveBoardContent(id: string, content: any): Promise<void> {
    const res = await fetchWithAuth(`/boards/${id}/content`, {
      method: 'PUT',
      body: JSON.stringify(content),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'Failed to save board content');
    }
  }
};
