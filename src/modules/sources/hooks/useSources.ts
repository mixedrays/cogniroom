import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Source, SourceScope } from "@/modules/core";
import {
  deleteSource,
  fetchSources,
  uploadSources,
} from "../lib/sourcesApi";

function sourcesKey(scope: SourceScope) {
  return ["sources", scope.courseId ?? null, scope.lessonId ?? null] as const;
}

interface UseSourcesOptions {
  scope: SourceScope;
  enabled?: boolean;
}

/**
 * Scoped list of attached sources for a course/lesson plus upload/delete
 * mutations. Backed by `/api/sources`.
 */
export function useSources({ scope, enabled = true }: UseSourcesOptions) {
  const queryClient = useQueryClient();
  const key = sourcesKey(scope);

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchSources(scope),
    enabled,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: key });
  }, [queryClient, key]);

  const upload = useMutation({
    mutationFn: (files: File[]) => uploadSources(files, scope),
    onSuccess: (created) => {
      invalidate();
      const failed = created.filter((s) => s.status === "error");
      for (const s of failed) {
        toast.error(`Couldn't process "${s.label}"`, { description: s.error });
      }
    },
    onError: (e) =>
      toast.error("Upload failed", {
        description: e instanceof Error ? e.message : String(e),
      }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSource(id, scope),
    onSuccess: invalidate,
  });

  return {
    sources: (query.data ?? []) as Source[],
    isLoading: query.isLoading,
    upload,
    remove,
    isUploading: upload.isPending,
  };
}
