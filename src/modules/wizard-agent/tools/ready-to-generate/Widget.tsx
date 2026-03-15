import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReadyToGenerateParamsSchema } from "./schema";

interface ReadyToGenerateWidgetProps {
  params: unknown;
  onSubmit: (result: unknown) => void;
  onDismiss: () => void;
}

export function ReadyToGenerateWidget({
  params,
  onSubmit,
  onDismiss,
}: ReadyToGenerateWidgetProps) {
  const parsed = ReadyToGenerateParamsSchema.safeParse(params);
  if (!parsed.success) return null;

  const { prompt, contentType, summary } = parsed.data;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Ready to generate
        </p>
        <p className="text-sm font-medium capitalize">{contentType}</p>
        {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => onSubmit({ prompt, contentType })}
        >
          <Wand2 className="size-3.5" />
          Generate {contentType}
        </Button>
      </div>
    </div>
  );
}
