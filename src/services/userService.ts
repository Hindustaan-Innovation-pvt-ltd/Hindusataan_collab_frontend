import api from './api';

export interface NotificationPreferences {
  emailInvites: boolean;
  boardUpdates: boolean;
  collaboration: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  theme: string;
  language: string;
  timezone: string;
  role: string;
  notifications: NotificationPreferences;
  created_at: string;
  updated_at: string;
  recent_boards: any[];
  total_boards: number;
}

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get("/api/user/profile");
    return response.data.data;
  },

  getSettings: async (): Promise<any> => {
    const response = await api.get("/api/user/settings");
    return response.data.data;
  },

  updateProfile: async (data: { name: string; bio?: string }): Promise<any> => {
    const response = await api.put("/api/user/profile", data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ message: string, avatar_url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/api/user/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return {
      message: response.data.message,
      avatar_url: response.data.data.avatar_url
    };
  },

  changePassword: async (data: any): Promise<any> => {
    const response = await api.put("/api/user/change-password", data);
    return response.data;
  },

  updateSettings: async (data: any): Promise<any> => {
    const response = await api.put("/api/user/settings", data);
    return response.data;
  },

  deleteAvatar: async (): Promise<any> => {
    const response = await api.delete("/api/user/avatar");
    return response.data;
  }
};
