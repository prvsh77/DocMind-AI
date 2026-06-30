type AppEnv = {
  apiBaseUrl: string;
  apiTimeoutMs: number;
  appName: string;
};

const readNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const env: AppEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api",
  apiTimeoutMs: readNumber(import.meta.env.VITE_API_TIMEOUT_MS, 30000),
  appName: import.meta.env.VITE_APP_NAME ?? "DocMind AI",
};
