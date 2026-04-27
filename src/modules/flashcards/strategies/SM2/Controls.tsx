import { Frown, Smile, Laugh } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { useSM2Context } from "./context";
import type { QualityRating } from "./useFlashcardsSM2";

const ratings: {
  label: string;
  description: string;
  q: QualityRating;
  ratingKey: "hard" | "good" | "easy";
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  activeClassName: string;
}[] = [
  {
    label: "Hard",
    description: "Couldn't recall — review again tomorrow",
    q: 1,
    ratingKey: "hard",
    shortcut: "1",
    icon: Frown,
    className:
      "border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-500 active:bg-red-500/30",
    activeClassName: "bg-red-500/20",
  },
  {
    label: "Good",
    description: "Recalled with effort — review on the usual schedule",
    q: 3,
    ratingKey: "good",
    shortcut: "2",
    icon: Smile,
    className:
      "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-500 active:bg-yellow-500/30",
    activeClassName: "bg-yellow-500/20",
  },
  {
    label: "Easy",
    description: "Recalled instantly — wait longer before next review",
    q: 5,
    ratingKey: "easy",
    shortcut: "3",
    icon: Laugh,
    className:
      "border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-500 active:bg-green-500/30",
    activeClassName: "bg-green-500/20",
  },
];

export function Controls() {
  const {
    currentCard,
    sessionComplete,
    isSaving,
    rateCard,
    sessionRatingsByCard,
  } = useSM2Context();

  if (sessionComplete || !currentCard) return null;

  const currentRating = sessionRatingsByCard[currentCard.id];

  return (
    <div className="flex gap-2">
      {ratings.map(
        ({
          label,
          description,
          q,
          ratingKey,
          shortcut,
          icon: Icon,
          className,
          activeClassName,
        }) => {
          const isActive = currentRating === ratingKey;
          return (
            <Tooltip
              key={q}
              content={
                <>
                  {description} <Kbd>{shortcut}</Kbd>
                </>
              }
            >
              <Button
                variant="outline"
                size="lg"
                disabled={isSaving}
                className={cn(
                  className,
                  isActive && activeClassName,
                  "active:scale-95"
                )}
                onClick={() => void rateCard(q)}
              >
                <Icon />
                {label}
              </Button>
            </Tooltip>
          );
        }
      )}
    </div>
  );
}
