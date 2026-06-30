import { apiClient } from "../http";

export const settingsService = {
  getSettings() {
    return apiClient.get("/settings").then((response) => response.data);
  },

  updateSettings(payload: unknown) {
    return apiClient.patch("/settings", payload).then((response) => response.data);
  },
};
