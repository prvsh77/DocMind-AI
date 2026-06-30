import { useQuery } from "@tanstack/react-query";
import { searchService } from "../services";

export const useDocumentSearchQuery = (query: string, enabled = Boolean(query.trim())) =>
  useQuery({
    queryKey: ["search", query],
    queryFn: () => searchService.searchDocuments(query),
    enabled,
  });
