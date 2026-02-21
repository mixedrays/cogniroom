import { Undo as IconReset } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import type { Flashcard } from "@/lib/types";

interface SM2SessionTopbarProps {
  currentIndex: number;
  sessionCards: Flashcard[];
  dueCount: number;
  newCount: number;
  sessionComplete: boolean;
  onReset: () => void;
}

export default function SM2SessionTopbar({
  currentIndex,
  sessionCards,
  dueCount,
  newCount,
  sessionComplete,
  onReset,
}: SM2SessionTopbarProps) {
  const total = sessionCards.length;
  const progress = total > 0 ? (currentIndex / total) * 100 : 0;

  return (
    <div>
      <div className="relative flex justify-between gap-1 px-4 py-2">
        <Tooltip content="Reset session">
          <span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              disabled={currentIndex === 0}
            >
              <IconReset />
            </Button>
          </span>
        </Tooltip>

        <p className="text-muted-foreground absolute top-1/2 left-1/2 m-auto block -translate-x-1/2 -translate-y-1/2 font-sans text-sm leading-normal font-light tracking-normal antialiased">
          {sessionComplete
            ? "Session complete"
            : `${currentIndex + 1} / ${total}`}
        </p>

        <div className="flex gap-2 items-center">
          {dueCount > 0 && (
            <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs">
              {dueCount} due
            </span>
          )}
          {newCount > 0 && (
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs">
              {newCount} new
            </span>
          )}
        </div>
      </div>

      {!sessionComplete && (
        <div className="mx-4 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
