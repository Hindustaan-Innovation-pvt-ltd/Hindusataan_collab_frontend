import api from "./api";

export const uploadService = {
  async uploadImage(file: File): Promise<{ url: string; public_id: string }> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/api/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Upload error:", error);
      throw new Error(error.response?.data?.detail || "Failed to upload image");
    }
  },
};
