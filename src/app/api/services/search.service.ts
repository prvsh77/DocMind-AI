import { apiClient } from "../http";

export const searchService = {
  searchDocuments(query: string) {
    return apiClient.get("/search", { params: { q: query } }).then((response) => response.data);
  },
};
