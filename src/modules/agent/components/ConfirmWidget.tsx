import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmWidgetProps {
  title: string;
  description?: string;
  confirmLabel: string;
  dismissLabel?: string;
  variant?: "default" | "success" | "warning";
  onConfirm: () => void;
  onDismiss?: () => void;
}

export function ConfirmWidget({
  title,
  description,
  confirmLabel,
  dismissLabel,
  variant = "default",
  onConfirm,
  onDismiss,
}: ConfirmWidgetProps) {
  return (
    <div
      className={cn(
        "rounded-2xl rounded-tl-sm border px-4 py-3 text-sm space-y-3",
        variant === "success" && "border-green-500/30 bg-green-500/10",
        variant === "warning" && "border-yellow-500/30 bg-yellow-500/10",
        variant === "default" && "border-border bg-muted"
      )}
    >
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        {dismissLabel && onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            {dismissLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
