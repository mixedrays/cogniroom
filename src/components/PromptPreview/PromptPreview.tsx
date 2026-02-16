import { ChevronRight, SquarePen } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/modules/settings";
import { usePromptPreview } from "@/hooks/use-prompt-preview";

interface PromptPreviewProps {
  promptId: string;
  variables: Record<string, string>;
}

export function PromptPreview({ promptId, variables }: PromptPreviewProps) {
  const { renderedPrompt, isLoading } = usePromptPreview(promptId, variables);

  return (
    <Collapsible defaultOpen={false} className="group/prompt">
      <div className="flex items-center gap-2">
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1">
          <ChevronRight className="size-4 transition-transform group-data-open/prompt:rotate-90" />
          Result Prompt Preview
        </CollapsibleTrigger>
        <SettingsDialog
          defaultTab="prompts"
          defaultPromptId={promptId}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <SquarePen className="size-3 mr-1" />
              Edit system prompt
            </Button>
          }
        />
      </div>
      <CollapsibleContent>
        {isLoading ? (
          <div className="mt-2 rounded-md bg-muted/50 border p-3 space-y-2 animate-pulse">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-5/6" />
          </div>
        ) : renderedPrompt ? (
          <pre className="mt-2 rounded-md bg-muted/50 border p-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
            {renderedPrompt}
          </pre>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
