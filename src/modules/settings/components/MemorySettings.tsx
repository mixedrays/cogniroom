import { useState, useEffect, useCallback } from "react";
import { TrashIcon, RotateCcwIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ErrorState } from "@/components/ErrorState";
import {
  getMemoryEntries,
  updateMemoryEntry,
  deleteMemoryEntry,
  clearAllMemory,
  type MemoryEntry,
} from "../lib/settings";

interface DraftEntry extends MemoryEntry {
  draft: string;
  saving?: boolean;
  error?: string;
}

export function MemorySettings() {
  const [entries, setEntries] = useState<DraftEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const result = await getMemoryEntries();
    if (result.success) {
      setEntries(result.entries.map((e) => ({ ...e, draft: e.content })));
    } else {
      setLoadError(result.error || "Failed to load memory");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleDraftChange = (key: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.key === key ? { ...e, draft: value, error: undefined } : e
      )
    );
  };

  const handleSave = async (key: string) => {
    const target = entries.find((e) => e.key === key);
    if (!target) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.key === key ? { ...e, saving: true, error: undefined } : e
      )
    );
    const result = await updateMemoryEntry(key, target.draft);
    setEntries((prev) =>
      prev.map((e) => {
        if (e.key !== key) return e;
        if (result.success) {
          return { ...e, content: target.draft, saving: false };
        }
        return {
          ...e,
          saving: false,
          error: result.error || "Failed to save",
        };
      })
    );
  };

  const handleDelete = async (key: string) => {
    const result = await deleteMemoryEntry(key);
    if (result.success) {
      setEntries((prev) => prev.filter((e) => e.key !== key));
    } else {
      setEntries((prev) =>
        prev.map((e) =>
          e.key === key
            ? { ...e, error: result.error || "Failed to delete" }
            : e
        )
      );
    }
  };

  const handleResetAll = async () => {
    setIsResetting(true);
    setResetError(null);
    try {
      const result = await clearAllMemory();
      if (!result.success) {
        setResetError(result.error || "Failed to reset memory");
        return;
      }
      setEntries([]);
      setResetDialogOpen(false);
    } catch (e) {
      setResetError(String(e));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-medium">Memory</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Persisted notes the assistant uses across conversations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadEntries}>
            <RotateCcwIcon />
            Refresh
          </Button>
          <AlertDialog
            open={resetDialogOpen}
            onOpenChange={(open) => {
              if (open) setResetError(null);
              setResetDialogOpen(open);
            }}
          >
            <AlertDialogTrigger
              render={
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={entries.length === 0}
                >
                  <TrashIcon />
                  Reset all
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all memory?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {entries.length} memory
                  {entries.length === 1 ? " entry" : " entries"}. This action
                  cannot be undone.
                </AlertDialogDescription>
                {resetError && (
                  <ErrorState variant="minimal" message={resetError} />
                )}
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isResetting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleResetAll}
                  disabled={isResetting}
                >
                  {isResetting ? "Resetting…" : "Reset all"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {loadError && <ErrorState variant="minimal" message={loadError} />}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading memory...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No memory entries yet. The assistant will save notes here as you chat.
        </div>
      ) : (
        <ScrollArea className="max-h-[480px]">
          <div className="divide-y divide-border p-1">
            {entries.map((entry) => {
              const isDirty = entry.draft !== entry.content;
              return (
                <div
                  key={entry.key}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-medium truncate">
                      {entry.key}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSave(entry.key)}
                        disabled={!isDirty || entry.saving}
                      >
                        <SaveIcon className="size-3.5 mr-1" />
                        {entry.saving ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-2 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(entry.key)}
                      >
                        <TrashIcon className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={entry.draft}
                    onChange={(e) =>
                      handleDraftChange(entry.key, e.target.value)
                    }
                    rows={Math.min(
                      12,
                      Math.max(3, entry.draft.split("\n").length)
                    )}
                    className="font-mono text-xs"
                  />
                  {entry.error && (
                    <ErrorState variant="minimal" message={entry.error} />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
