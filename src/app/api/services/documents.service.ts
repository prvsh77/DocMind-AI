import { apiClient } from "../http";
import type { DocumentSummary, PaginatedResponse } from "../types";

export type DocumentQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  type?: string;
};

export const documentsService = {
  list(params?: DocumentQuery) {
    return apiClient
      .get<PaginatedResponse<DocumentSummary>>("/documents", { params })
      .then((response) => response.data);
  },

  getById(id: string) {
    return apiClient.get(`/documents/${id}`).then((response) => response.data);
  },

  upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient
      .post("/documents", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((response) => response.data);
  },

  delete(id: string) {
    return apiClient.delete(`/documents/${id}`).then((response) => response.data);
  },

  process(id: string) {
    return apiClient.post<{ status: string; type: string; ocr_length: number }>(`/documents/${id}/process`).then((response) => response.data);
  },

  getOcr(id: string) {
    return apiClient.get<{ ocr_text: string }>(`/documents/${id}/ocr`).then((response) => response.data);
  },

  getStats() {
    return apiClient.get<any>("/documents/stats").then((response) => response.data);
  },
};
