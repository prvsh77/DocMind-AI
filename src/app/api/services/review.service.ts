import { apiClient } from "../http";

export const reviewService = {
  approveDocument(documentId: string) {
    return apiClient.post(`/review/${documentId}/approve`).then((response) => response.data);
  },

  rejectDocument(documentId: string, reason?: string) {
    return apiClient.post(`/review/${documentId}/reject`, { reason }).then((response) => response.data);
  },
};
