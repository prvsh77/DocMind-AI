import { apiClient } from "../http";

export const analyticsService = {
  getOverview() {
    return apiClient.get("/documents/stats").then((response) => response.data);
  },
};
