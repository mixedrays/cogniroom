import { Button } from "@/components/ui/button";
import { useSM2Context } from "./context";
import type { QualityRating } from "./useFlashcardsSM2";

const ratings: {
  label: string;
  q: QualityRating;
  variant: "default" | "secondary" | "outline";
}[] = [
  { label: "Hard", q: 1, variant: "outline" },
  { label: "Good", q: 3, variant: "secondary" },
  { label: "Easy", q: 5, variant: "default" },
];

interface ControlsProps {
  currentIndex: number;
  onFlipCard: (index: number) => void;
}

export function Controls({ currentIndex, onFlipCard }: ControlsProps) {
  const { currentCard, isAnswerVisible, sessionComplete, isSaving, rateCard } =
    useSM2Context();

  if (sessionComplete || !currentCard) return null;

  return (
    <div className="flex justify-center p-4">
      {isAnswerVisible ? (
        <div className="flex gap-2 flex-wrap justify-center">
          {ratings.map(({ label, q, variant }) => (
            <Button
              key={q}
              variant={variant}
              disabled={isSaving}
              onClick={() => void rateCard(q)}
            >
              {label}
            </Button>
          ))}
        </div>
      ) : (
        <Button variant="outline" onClick={() => onFlipCard(currentIndex)}>
          Show Answer{" "}
          <span className="ml-1 text-xs text-muted-foreground">(Space)</span>
        </Button>
      )}
    </div>
  );
}
