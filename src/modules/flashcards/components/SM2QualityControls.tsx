import { Button } from "@/components/ui/button";
import type { Flashcard } from "@/lib/types";
import type { QualityRating } from "../hooks/useFlashcardsSM2";

const ratings: {
  label: string;
  q: QualityRating;
  variant: "default" | "secondary" | "outline";
}[] = [
  { label: "Didn't know", q: 1, variant: "outline" },
  { label: "Knew after hint", q: 3, variant: "secondary" },
  { label: "Knew after hesitation", q: 4, variant: "secondary" },
  { label: "Knew immediately", q: 5, variant: "default" },
];

interface SM2QualityControlsProps {
  currentCard: Flashcard | undefined;
  sessionComplete: boolean;
  isSaving: boolean;
  onRate: (q: QualityRating) => Promise<void>;
}

export default function SM2QualityControls({
  currentCard,
  sessionComplete,
  isSaving,
  onRate,
}: SM2QualityControlsProps) {
  if (sessionComplete || !currentCard) return null;

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {ratings.map(({ label, q, variant }) => (
        <Button
          key={q}
          variant={variant}
          size="sm"
          disabled={isSaving}
          onClick={() => void onRate(q)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
