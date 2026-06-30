import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsService, type DocumentQuery } from "../services";

export const documentKeys = {
  all: ["documents"] as const,
  list: (query?: DocumentQuery) => ["documents", "list", query] as const,
  detail: (id: string) => ["documents", "detail", id] as const,
  ocr: (id: string) => ["documents", "ocr", id] as const,
};

export const useDocumentsQuery = (query?: DocumentQuery) =>
  useQuery({
    queryKey: documentKeys.list(query),
    queryFn: () => documentsService.list(query),
  });

export const useDocumentQuery = (id: string) =>
  useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsService.getById(id),
    enabled: Boolean(id),
  });

export const useUploadDocumentMutation = () =>
  useMutation({
    mutationFn: (file: File) => documentsService.upload(file),
  });

export const useDeleteDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};

export const useProcessDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsService.process(id),
    onSuccess: (_, id) => {
      // Invalidate both lists and details for this document
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.ocr(id) });
    },
  });
};

export const useDocumentOcrQuery = (id: string) =>
  useQuery({
    queryKey: documentKeys.ocr(id),
    queryFn: () => documentsService.getOcr(id),
    enabled: Boolean(id),
  });

export const useDocumentStatsQuery = () =>
  useQuery({
    queryKey: ["documents", "stats"],
    queryFn: () => documentsService.getStats(),
  });
