import { RotateCcw as IconFlip } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlipButtonProps {
  flipCards: boolean;
  onToggle: () => void;
}

export function FlipButton({ flipCards, onToggle }: FlipButtonProps) {
  return (
    <Tooltip content="Flip all cards">
      <Button
        className="relative ml-auto"
        variant="ghost"
        size="icon"
        onClick={onToggle}
      >
        <IconFlip className={cn(flipCards && "text-primary")} />
        {flipCards && (
          <span className="bg-primary absolute top-[80%] left-1/2 size-0.75 -translate-x-1/2 rounded-full" />
        )}
      </Button>
    </Tooltip>
  );
}
