import { Frown, Smile, Laugh } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { useSM2Context } from "./context";
import type { QualityRating } from "./useFlashcardsSM2";

const ratings: {
  label: string;
  description: string;
  q: QualityRating;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}[] = [
  {
    label: "Hard",
    description: "Resets review interval to tomorrow",
    q: 1,
    shortcut: "1",
    icon: Frown,
    className:
      "border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-500",
  },
  {
    label: "Good",
    description: "Extends review interval normally",
    q: 3,
    shortcut: "2",
    icon: Smile,
    className:
      "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-500",
  },
  {
    label: "Easy",
    description: "Extends review interval further",
    q: 5,
    shortcut: "3",
    icon: Laugh,
    className:
      "border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-500",
  },
];

export function Controls() {
  const { currentCard, sessionComplete, isSaving, rateCard } = useSM2Context();

  if (sessionComplete || !currentCard) return null;

  return (
    <div className="flex gap-2">
      {ratings.map(
        ({ label, description, q, shortcut, icon: Icon, className }) => (
          <Tooltip
            key={q}
            content={
              <>
                {description}{" "}
                <span className="text-muted-foreground text-xs">
                  ({shortcut})
                </span>
              </>
            }
          >
            <Button
              variant="outline"
              size="lg"
              disabled={isSaving}
              className={className}
              onClick={() => void rateCard(q)}
            >
              <Icon />
              {label}
            </Button>
          </Tooltip>
        )
      )}
    </div>
  );
}
