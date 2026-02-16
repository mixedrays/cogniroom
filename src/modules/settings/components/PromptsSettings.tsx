import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RotateCcwIcon, SaveIcon } from "lucide-react";
import {
  getPrompts,
  savePrompt,
  resetPrompt,
  type PromptInfo,
} from "@/lib/prompts";

interface PromptsSettingsProps {
  defaultPromptId?: string;
}

export function PromptsSettings({ defaultPromptId }: PromptsSettingsProps) {
  const queryClient = useQueryClient();
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selected = prompts.find((p) => p.id === selectedId);
  const isDirty = selected ? draft !== selected.content : false;

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setIsLoading(true);
    const result = await getPrompts();
    if (result.success) {
      setPrompts(result.prompts);
      if (!selectedId && result.prompts.length > 0) {
        const initial =
          result.prompts.find((p) => p.id === defaultPromptId) ??
          result.prompts[0];
        setSelectedId(initial.id);
        setDraft(initial.content);
      }
    }
    setIsLoading(false);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const prompt = prompts.find((p) => p.id === id);
    if (prompt) setDraft(prompt.content);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setIsSaving(true);
    const result = await savePrompt(selectedId, draft);
    if (result.success) {
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === selectedId
            ? { ...p, content: draft, isCustomized: true }
            : p
        )
      );
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    }
    setIsSaving(false);
  };

  const handleReset = async () => {
    if (!selectedId) return;
    setIsSaving(true);
    const result = await resetPrompt(selectedId);
    if (result.success && result.content) {
      setDraft(result.content);
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === selectedId
            ? { ...p, content: result.content!, isCustomized: false }
            : p
        )
      );
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    }
    setIsSaving(false);
  };

  // Group prompts by category
  const categories = prompts.reduce<Record<string, PromptInfo[]>>(
    (acc, p) => {
      (acc[p.category] ??= []).push(p);
      return acc;
    },
    {}
  );

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading prompts...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <p className="font-medium">Prompts</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customize prompts used for content generation
        </p>
      </div>

      <div className="mb-4">
        <Select
          value={selectedId ?? undefined}
          onValueChange={(v) => v && handleSelect(v)}
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categories).map(([category, items]) => (
              <SelectGroup key={category}>
                <SelectLabel>{category}</SelectLabel>
                {items.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      {p.label}
                      {p.isCustomized && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          Customized
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <>
          <div className="mb-3">
            <p className="text-sm text-muted-foreground">
              {selected.description}
            </p>
            {selected.variables.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Variables:{" "}
                {selected.variables.map((v) => (
                  <code
                    key={v}
                    className="bg-muted px-1 py-0.5 rounded text-[11px] mr-1"
                  >
                    {`{{${v}}}`}
                  </code>
                ))}
              </p>
            )}
          </div>

          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="font-mono text-xs min-h-[240px] mb-3"
            spellCheck={false}
          />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
            >
              <SaveIcon className="size-3.5 mr-1.5" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            {selected.isCustomized && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isSaving}
              >
                <RotateCcwIcon className="size-3.5 mr-1.5" />
                Reset to Default
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
