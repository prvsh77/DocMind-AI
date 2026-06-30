import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { queryClient } from "../api/query-client";
import { authService } from "../api/services";
import type { AuthSession, LoginRequest, RegisterRequest, User } from "../api/types";
import { tokenStorage } from "../lib/token-storage";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginRequest, remember?: boolean) => Promise<void>;
  register: (payload: RegisterRequest, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const sessionToUser = (session: AuthSession) => session.user;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const establishSession = useCallback((session: AuthSession, remember = false) => {
    tokenStorage.setTokens(
      {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
      },
      remember,
    );
    setUser(sessionToUser(session));
    queryClient.setQueryData(["auth", "me"], session.user);
  }, []);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    queryClient.clear();
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (!tokenStorage.getAccessToken()) {
        setIsInitializing(false);
        return;
      }

      try {
        const currentUser = await authService.me();
        if (mounted) setUser(currentUser);
      } catch {
        if (mounted) clearSession();
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    bootstrap();

    const handleExpired = () => {
      clearSession();
    };

    window.addEventListener("docmind:auth-expired", handleExpired);
    return () => {
      mounted = false;
      window.removeEventListener("docmind:auth-expired", handleExpired);
    };
  }, [clearSession]);

  const login = useCallback(
    async (payload: LoginRequest, remember = false) => {
      const session = await authService.login(payload);
      establishSession(session, remember);
    },
    [establishSession],
  );

  const register = useCallback(
    async (payload: RegisterRequest, remember = false) => {
      const session = await authService.register(payload);
      establishSession(session, remember);
    },
    [establishSession],
  );

  const logout = useCallback(async () => {
    try {
      if (tokenStorage.getAccessToken()) {
        await authService.logout();
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && tokenStorage.getAccessToken()),
      isInitializing,
      login,
      register,
      logout,
    }),
    [isInitializing, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
};
