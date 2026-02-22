import { Shuffle as IconShuffle } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSharedContext } from "./context";

export function ShuffleButton() {
  const { areCardsShuffled, handleToggleShuffleCards } = useSharedContext();
  return (
    <Tooltip content="Shuffle cards">
      <Button
        className="relative"
        variant="ghost"
        size="icon"
        onClick={handleToggleShuffleCards}
      >
        <IconShuffle className={cn(areCardsShuffled && "text-primary")} />
        {areCardsShuffled && (
          <span className="bg-primary absolute top-[80%] left-1/2 size-0.75 -translate-x-1/2 rounded-full" />
        )}
      </Button>
    </Tooltip>
  );
}
