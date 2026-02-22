import { Shuffle as IconShuffle } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShuffleButtonProps {
  areCardsShuffled: boolean;
  onToggle: () => void;
}

export function ShuffleButton({ areCardsShuffled, onToggle }: ShuffleButtonProps) {
  return (
    <Tooltip content="Shuffle cards">
      <Button
        className="relative"
        variant="ghost"
        size="icon"
        onClick={onToggle}
      >
        <IconShuffle className={cn(areCardsShuffled && "text-primary")} />
        {areCardsShuffled && (
          <span className="bg-primary absolute top-[80%] left-1/2 size-0.75 -translate-x-1/2 rounded-full" />
        )}
      </Button>
    </Tooltip>
  );
}
