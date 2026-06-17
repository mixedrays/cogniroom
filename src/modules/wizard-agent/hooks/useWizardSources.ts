import { useCallback, useMemo, useState } from "react";
import type { SourceScope } from "@/modules/core";
import { useSources } from "@/modules/sources";
import type { PromptAttachmentOption } from "@/components/PromptTextarea";

interface UseWizardSourcesOptions {
  courseId?: string;
  lessonId?: string;
  enabled?: boolean;
}

/**
 * Shared file-attachment wiring for the wizard surfaces (Sheet/Inline/Dialog):
 * scoped source list, selection state, upload, and the chip/handler helpers a
 * `PromptTextarea` needs. Only ready sources are surfaced as `sourceIds` for the
 * agent. See .features/chat-attachments.md.
 */
export function useWizardSources({
  courseId,
  lessonId,
  enabled = true,
}: UseWizardSourcesOptions) {
  const scope = useMemo<SourceScope>(
    () => ({ courseId, lessonId }),
    [courseId, lessonId]
  );
  const { sources, upload, isUploading } = useSources({ scope, enabled });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const idSet = useMemo(() => new Set(sources.map((s) => s.id)), [sources]);

  const readySourceIds = useMemo(
    () =>
      selectedIds.filter(
        (id) => sources.find((s) => s.id === id)?.status === "ready"
      ),
    [selectedIds, sources]
  );

  const onFilesSelected = useCallback(
    (files: File[]) => {
      upload.mutate(files, {
        onSuccess: (created) => {
          const readyIds = created
            .filter((s) => s.status === "ready")
            .map((s) => s.id);
          setSelectedIds((prev) => [...new Set([...prev, ...readyIds])]);
        },
      });
    },
    [upload]
  );

  const isSource = useCallback((id: string) => idSet.has(id), [idSet]);

  const addSource = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeSource = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const selectedChips = useMemo<PromptAttachmentOption[]>(
    () =>
      sources
        .filter((s) => selectedIds.includes(s.id))
        .map((s) => ({ id: s.id, label: s.label, status: s.status })),
    [sources, selectedIds]
  );

  const availableChips = useMemo<PromptAttachmentOption[]>(
    () => sources.map((s) => ({ id: s.id, label: s.label, status: s.status })),
    [sources]
  );

  return {
    readySourceIds,
    onFilesSelected,
    isUploading,
    isSource,
    addSource,
    removeSource,
    selectedChips,
    availableChips,
  };
}
