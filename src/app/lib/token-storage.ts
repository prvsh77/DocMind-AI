export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
};

const TOKEN_KEY = "docmind.auth.tokens";
const REMEMBER_KEY = "docmind.auth.remember";

let memoryTokens: AuthTokens | null = null;

const getStore = () => {
  const remember = window.localStorage.getItem(REMEMBER_KEY) === "true";
  return remember ? window.localStorage : window.sessionStorage;
};

const readStoredTokens = (): AuthTokens | null => {
  const raw = window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthTokens;
    return parsed.accessToken ? parsed : null;
  } catch {
    return null;
  }
};

export const tokenStorage = {
  getTokens() {
    if (memoryTokens) return memoryTokens;
    if (typeof window === "undefined") return null;
    memoryTokens = readStoredTokens();
    return memoryTokens;
  },

  setTokens(tokens: AuthTokens, remember = false) {
    memoryTokens = tokens;
    window.localStorage.setItem(REMEMBER_KEY, String(remember));
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    getStore().setItem(TOKEN_KEY, JSON.stringify(tokens));
  },

  shouldRemember() {
    return window.localStorage.getItem(REMEMBER_KEY) === "true";
  },

  clear() {
    memoryTokens = null;
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REMEMBER_KEY);
  },

  getAccessToken() {
    return this.getTokens()?.accessToken ?? null;
  },

  getRefreshToken() {
    return this.getTokens()?.refreshToken ?? null;
  },
};
