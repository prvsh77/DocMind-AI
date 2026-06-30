import { QueryCache, QueryClient, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { toApiError } from "../lib/api-error";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
    mutations: {
      retry: 0,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(toApiError(error).message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(toApiError(error).message);
    },
  }),
});
