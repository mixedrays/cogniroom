import { Undo as IconReset } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/AlertDialog";

interface ResetButtonProps {
  canReset: boolean;
  onReset: () => void;
}

export function ResetButton({ canReset, onReset }: ResetButtonProps) {
  return (
    <Tooltip content="Reset study session">
      <span>
        <AlertDialog
          trigger={
            <Button variant="ghost" size="icon" disabled={!canReset}>
              <IconReset />
            </Button>
          }
          confirmText="Reset"
          title="Reset study session"
          description="Are you sure? All current progress will be lost."
          onConfirm={onReset}
        />
      </span>
    </Tooltip>
  );
}
