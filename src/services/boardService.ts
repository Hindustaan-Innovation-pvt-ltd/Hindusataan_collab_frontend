<<<<<<< HEAD
import api from "./api";
import { Board, El, Cam } from "../types";

// Helper to map backend's split board_data to frontend's flat els array
const parseBackendContentToEls = (boardData: any): El[] => {
  if (!boardData) return [];
  
  // If the data was already saved in the new format by backend default schema
  const nodes: El[] = boardData.nodes || [];
  const edges: El[] = boardData.edges || [];
  const stickyNotes: El[] = boardData.stickyNotes || [];
  const drawings: El[] = boardData.drawings || [];
  const images: El[] = boardData.images || [];
  
  // Combine all categories into one flat array
  let els = [...nodes, ...edges, ...stickyNotes, ...drawings, ...images];
  
  // If the backend had older data saved straight as `els` in board_data, use that as a fallback
  if (els.length === 0 && boardData.els && boardData.els.length > 0) {
    els = boardData.els;
  }
  
  return els;
};

// Helper to map frontend's flat els array to backend's split schema
const parseElsToBackendContent = (els: El[], cam: Cam) => {
  const content = {
    nodes: [] as El[],
    edges: [] as El[],
    stickyNotes: [] as El[],
    drawings: [] as El[],
    images: [] as El[],
    cam,
  };

  for (const el of els) {
    if (el.type === "sticky") {
      content.stickyNotes.push(el);
    } else if (el.type === "connection" || el.type === "free_arrow") {
      content.edges.push(el);
    } else if (el.type === "path") {
      content.drawings.push(el);
    } else if ((el as any).type === "image") {
      content.images.push(el);
    } else {
      // shape, text, table, icon, graph all map to nodes
      content.nodes.push(el);
    }
  }

  return content;
};

export const boardService = {
  getBoards: async (): Promise<Board[]> => {
    const response = await api.get("/boards/");
    return response.data.map((b: any) => ({
      id: b.id || b._id,
      name: b.title,
      els: parseBackendContentToEls(b.board_data),
      cam: b.board_data?.cam || { x: window.innerWidth / 2, y: window.innerHeight / 2, z: 1 },
      updatedAt: b.updated_at ? new Date(b.updated_at).getTime() : Date.now(),
      bg: "white", // default background
    }));
  },

  getBoard: async (id: string): Promise<Board> => {
    const response = await api.get(`/boards/${id}`);
    const b = response.data;
    return {
      id: b._id || b.id,
      name: b.title,
      els: parseBackendContentToEls(b.board_data),
      cam: b.board_data?.cam || { x: window.innerWidth / 2, y: window.innerHeight / 2, z: 1 },
      updatedAt: b.updated_at ? new Date(b.updated_at).getTime() : Date.now(),
      bg: "white",
    };
  },

  getBoardContent: async (id: string): Promise<{ els: El[], cam: Cam }> => {
    const response = await api.get(`/boards/${id}/content`);
    return {
      els: parseBackendContentToEls(response.data),
      cam: response.data.cam || { x: window.innerWidth / 2, y: window.innerHeight / 2, z: 1 }
    };
  },

  createBoard: async (title: string, description: string = ""): Promise<string> => {
    const response = await api.post("/boards/", { title, description });
    return response.data.board_id;
  },

  updateBoard: async (id: string, title: string): Promise<void> => {
    await api.put(`/boards/${id}`, { title });
  },

  deleteBoard: async (id: string): Promise<void> => {
    await api.delete(`/boards/${id}`);
  },

  saveBoardContent: async (id: string, els: El[], cam: Cam): Promise<void> => {
    const content = parseElsToBackendContent(els, cam);
    await api.put(`/boards/${id}/content`, content);
  },

  inviteCollaborator: async (boardId: string, email: string, role: string = "viewer"): Promise<any> => {
    // Calling the specific backend endpoint provided by the user
    const response = await api.post("/api/collaboration/invite", {
      board_id: boardId,
      invitee_email: email,
      role: role
    });
    return response.data;
  },

  getCollaborators: async (boardId: string): Promise<any[]> => {
    const response = await api.get(`/api/collaboration/board/${boardId}`);
    return response.data?.data?.collaborators || [];
  },

  updateRole: async (boardId: string, userId: string, role: string): Promise<void> => {
    await api.put(`/api/collaboration/board/${boardId}/user/${userId}`, { role });
  },

  removeCollaborator: async (boardId: string, userId: string): Promise<void> => {
    await api.delete(`/api/collaboration/board/${boardId}/user/${userId}`);
=======
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
>>>>>>> 187ff32f7bef9e8221cf03e2b678fa2c31513bb4
  }
};
