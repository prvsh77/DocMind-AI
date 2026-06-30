import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Toaster } from "../components/ui/sonner";
import { GlobalLoadingIndicator } from "../components/shared/GlobalLoadingIndicator";
import { ErrorBoundary } from "../components/shared/ErrorBoundary";
import { queryClient } from "../api/query-client";
import { AuthProvider } from "../contexts/AuthContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <GlobalLoadingIndicator />
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}
