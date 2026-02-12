import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrashIcon, RotateCcwIcon } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { COLOR_THEMES, type SettingsHistoryEntry } from "../lib/settingsTypes";
import { AVAILABLE_MODELS } from "@/lib/llmModels";
import {
  getSettingsHistory,
  deleteHistoryEntry,
  restoreFromHistory,
} from "../lib/settings";

export function HistorySettings() {
  const { applySettings, loadSettings } = useSettings();
  const [history, setHistory] = useState<SettingsHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    const result = await getSettingsHistory();
    if (result.success) {
      setHistory(result.history.entries);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteHistoryEntry(id);
    if (result.success) {
      setHistory((prev) => prev.filter((entry) => entry.id !== id));
    }
  };

  const handleRestore = async (entry: SettingsHistoryEntry) => {
    setRestoringId(entry.id);
    const result = await restoreFromHistory(entry);
    if (result.success && result.settings) {
      applySettings(result.settings);
      await loadSettings();
      await loadHistory();
    }
    setRestoringId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-medium">Settings history</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and restore previous configurations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadHistory}
        >
          <RotateCcwIcon className="size-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading history...
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No settings history yet. Changes are automatically saved.
        </div>
      ) : (
        <ScrollArea className="max-h-[350px]">
          <div className="divide-y divide-border">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-start justify-between py-3 first:pt-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium">
                      {formatDate(entry.savedAt)}
                    </span>
                    {index === 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                  </div>
                  {entry.description && (
                    <p className="text-sm text-muted-foreground mb-1">
                      {entry.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="bg-muted px-1.5 py-0.5 rounded">
                      {COLOR_THEMES[entry.settings.appearance.colorTheme]}
                    </span>
                    <span className="bg-muted px-1.5 py-0.5 rounded">
                      {entry.settings.appearance.mode}
                    </span>
                    <span className="bg-muted px-1.5 py-0.5 rounded">
                      {AVAILABLE_MODELS[entry.settings.llm.defaultModel]
                        ?.label || entry.settings.llm.defaultModel}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 ml-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(entry)}
                    disabled={restoringId === entry.id}
                  >
                    {restoringId === entry.id ? (
                      "Restoring..."
                    ) : (
                      <>
                        <RotateCcwIcon className="size-3.5 mr-1" />
                        Restore
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <TrashIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
