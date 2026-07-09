import api from "./api";

export const collaborationService = {
  inviteCollaborator: async (boardId: string, email: string, role: string = "viewer") => {
    const payload = {
      board_id: boardId,
      invitee_email: email,
      role: role,
    };
    console.log("Invite Payload:", payload);
    try {
      const response = await api.post("/api/collaboration/invite", payload);
      return response.data;
    } catch (error: any) {
      console.log(error.response?.data);
      throw error;
    }
  },

  acceptInvite: async (inviteId: string) => {
    const response = await api.post(`/api/collaboration/invite/${inviteId}/accept`, {});
    return response.data;
  },

  rejectInvite: async (inviteId: string) => {
    const response = await api.post(`/api/collaboration/invite/${inviteId}/reject`, {});
    return response.data;
  },

  getCollaborators: async (boardId: string) => {
    const response = await api.get(`/api/collaboration/board/${boardId}`);
    return response.data?.data?.collaborators || [];
  },

  updateCollaboratorRole: async (boardId: string, targetUserId: string, role: string) => {
    const response = await api.put(`/api/collaboration/board/${boardId}/user/${targetUserId}`, { role });
    return response.data;
  },

  removeCollaborator: async (boardId: string, targetUserId: string) => {
    const response = await api.delete(`/api/collaboration/board/${boardId}/user/${targetUserId}`);
    return response.data;
  },

  generateBoardShareLink: (boardId: string, boardName: string = ""): string => {
    const slugifiedBoardName = boardName
      ? boardName.replace(/[^a-zA-Z0-9 -]/g, '').trim().replace(/\s+/g, '-')
      : "board";
    return `${window.location.origin}/board/${boardId}/${slugifiedBoardName}`;
  }
};
