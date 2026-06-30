import { apiClient } from "../http";

export type ChatResponse = {
  answer: string;
  sources: string[];
  extractedFields: Record<string, any>;
};

export const chatService = {
  ask(question: string) {
    return apiClient.post<ChatResponse>("/chat", { question }).then((response) => response.data);
  },
};
