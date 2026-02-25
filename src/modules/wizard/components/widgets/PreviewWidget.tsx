import { Badge } from "@/components/ui/badge";
import type { AgentMessage } from "../../schema";

interface PreviewWidgetProps {
  data: Extract<AgentMessage, { type: "preview" }>;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  lesson: "Lesson",
  flashcards: "Flashcards",
  quiz: "Quiz",
  exercise: "Exercise",
  roadmap: "Roadmap",
};

export function PreviewWidget({ data }: PreviewWidgetProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">Generated Prompt</p>
        <Badge variant="secondary">
          {CONTENT_TYPE_LABELS[data.contentType] ?? data.contentType}
        </Badge>
      </div>
      <pre className="whitespace-pre-wrap break-words rounded-md border bg-muted/50 p-3 text-xs font-mono text-muted-foreground max-h-48 overflow-y-auto">
        {data.prompt}
      </pre>
      <p className="text-xs text-muted-foreground">
        Click "Generate Content" below to create content using this prompt.
      </p>
    </div>
  );
}
