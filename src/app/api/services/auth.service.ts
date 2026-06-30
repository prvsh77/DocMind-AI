import { apiClient, publicClient } from "../http";
import type { AuthSession, LoginRequest, RegisterRequest, User } from "../types";

export const authService = {
  login(payload: LoginRequest) {
    return publicClient.post<AuthSession>("/auth/login", payload).then((response) => response.data);
  },

  register(payload: RegisterRequest) {
    return publicClient.post<AuthSession>("/auth/register", payload).then((response) => response.data);
  },

  me() {
    return apiClient.get<User>("/auth/me").then((response) => response.data);
  },

  logout() {
    return apiClient.post<void>("/auth/logout").then((response) => response.data);
  },
};
