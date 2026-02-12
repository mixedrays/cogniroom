import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { usePromptPreview } from "@/hooks/use-prompt-preview";

interface PromptPreviewProps {
  promptId: string;
  variables: Record<string, string>;
}

export function PromptPreview({ promptId, variables }: PromptPreviewProps) {
  const { renderedPrompt, isLoading } = usePromptPreview(promptId, variables);

  return (
    <Collapsible defaultOpen={false} className="group/prompt">
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1">
        <ChevronRight className="size-3.5 transition-transform group-data-[open]/prompt:rotate-90" />
        Prompt Preview
      </CollapsibleTrigger>
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
