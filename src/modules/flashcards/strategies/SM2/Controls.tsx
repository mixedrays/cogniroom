import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { useSM2Context } from "./context";
import type { QualityRating } from "./useFlashcardsSM2";

const ratings: {
  label: string;
  q: QualityRating;
  shortcut: string;
  variant: "default" | "secondary" | "outline";
}[] = [
  { label: "Hard", q: 1, shortcut: "1", variant: "outline" },
  { label: "Good", q: 3, shortcut: "2", variant: "secondary" },
  { label: "Easy", q: 5, shortcut: "3", variant: "default" },
];

export function Controls() {
  const { currentCard, sessionComplete, isSaving, rateCard } = useSM2Context();

  if (sessionComplete || !currentCard) return null;

  return (
    <div className="flex gap-2">
      {ratings.map(({ label, q, shortcut, variant }) => (
        <Tooltip
          key={q}
          content={
            <>
              {label}{" "}
              <span className="text-muted-foreground text-xs">({shortcut})</span>
            </>
          }
        >
          <Button
            variant={variant}
            disabled={isSaving}
            onClick={() => void rateCard(q)}
          >
            {label}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
}
