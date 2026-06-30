import { useMutation, useQuery } from "@tanstack/react-query";
import { authService } from "../services";
import type { LoginRequest, RegisterRequest } from "../types";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export const useCurrentUserQuery = (enabled: boolean) =>
  useQuery({
    queryKey: authKeys.me,
    queryFn: authService.me,
    enabled,
  });

export const useLoginMutation = () =>
  useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
  });

export const useRegisterMutation = () =>
  useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
  });

export const useLogoutMutation = () =>
  useMutation({
    mutationFn: authService.logout,
  });
