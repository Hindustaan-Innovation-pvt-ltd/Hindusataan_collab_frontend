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
  },
};
