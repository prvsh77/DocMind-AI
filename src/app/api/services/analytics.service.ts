import { apiClient } from "../http";

export const analyticsService = {
  getOverview() {
    return apiClient.get("/analytics/overview").then((response) => response.data);
  },
};
