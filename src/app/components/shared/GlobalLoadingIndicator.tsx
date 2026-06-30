import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { loadingStore } from "../../lib/loading-store";

export function GlobalLoadingIndicator() {
  const apiRequests = useSyncExternalStore(loadingStore.subscribe, loadingStore.getSnapshot, loadingStore.getSnapshot);
  const queries = useIsFetching();
  const mutations = useIsMutating();
  const isLoading = apiRequests + queries + mutations > 0;

  if (!isLoading) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] h-1 bg-green-100" role="status" aria-label="Loading">
      <div className="h-full w-1/3 animate-pulse bg-green-600" />
    </div>
  );
}
