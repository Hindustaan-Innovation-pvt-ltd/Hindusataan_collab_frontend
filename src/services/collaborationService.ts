import { fetchWithAuth } from './api';
import type { Collaborator, Invite } from '../types';

export const collaborationService = {
  async inviteCollaborator(board_id: string, invitee_email: string, role: string): Promise<Invite> {
    const res = await fetchWithAuth('/api/collaboration/invite', {
      method: 'POST',
      body: JSON.stringify({ board_id, invitee_email, role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || 'Failed to send invite');
    return data.data; // Assuming success_response format
  },

  async getPendingInvites(): Promise<Invite[]> {
    const res = await fetchWithAuth('/api/collaboration/invites/pending');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || 'Failed to fetch pending invites');
    return data.data.invites;
  },

  async getBoardRole(board_id: string): Promise<string> {
    const res = await fetchWithAuth(`/api/collaboration/board/${board_id}/role`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || 'Failed to get board role');
    return data.data.role;
  },

  async acceptInvite(invite_id: string): Promise<Collaborator> {
    const res = await fetchWithAuth(`/api/collaboration/invite/${invite_id}/accept`, {
      method: 'POST',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || 'Failed to accept invite');
    return data.data;
  },

  async rejectInvite(invite_id: string): Promise<void> {
    const res = await fetchWithAuth(`/api/collaboration/invite/${invite_id}/reject`, {
      method: 'POST',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'Failed to reject invite');
    }
  },

  async getCollaborators(board_id: string): Promise<Collaborator[]> {
    const res = await fetchWithAuth(`/api/collaboration/board/${board_id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || 'Failed to get collaborators');
    return data.data.collaborators;
  },

  async updateRole(board_id: string, target_user_id: string, role: string): Promise<void> {
    const res = await fetchWithAuth(`/api/collaboration/board/${board_id}/user/${target_user_id}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'Failed to update role');
    }
  },

  async removeCollaborator(board_id: string, target_user_id: string): Promise<void> {
    const res = await fetchWithAuth(`/api/collaboration/board/${board_id}/user/${target_user_id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'Failed to remove collaborator');
    }
  }
};
