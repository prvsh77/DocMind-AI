import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "../config/env";
import { loadingStore } from "../lib/loading-store";
import { tokenStorage, type AuthTokens } from "../lib/token-storage";

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
};

let refreshPromise: Promise<AuthTokens> | null = null;

export const publicClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const refreshTokens = async () => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token is available.");
  }

  if (!refreshPromise) {
    refreshPromise = publicClient
      .post<RefreshResponse>("/auth/refresh", { refreshToken })
      .then((response) => {
        const nextTokens: AuthTokens = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken ?? refreshToken,
          expiresAt: response.data.expiresAt,
        };
        tokenStorage.setTokens(nextTokens, tokenStorage.shouldRemember());
        return nextTokens;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

apiClient.interceptors.request.use((config) => {
  loadingStore.increment();
  const token = tokenStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    loadingStore.decrement();
    return response;
  },
  async (error: AxiosError) => {
    loadingStore.decrement();

    const originalRequest = error.config as RetryableRequest | undefined;
    const isUnauthorized = error.response?.status === 401;

    if (isUnauthorized && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = await refreshTokens();
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        tokenStorage.clear();
        window.dispatchEvent(new Event("docmind:auth-expired"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
