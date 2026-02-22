import { Slider } from "@/components/Slider";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentIndex: number;
  totalCards: number;
  onScrollToSlide: (index: number) => void;
  stepClasses?: (string | undefined)[];
  className?: string;
}

export function ProgressBar({
  currentIndex,
  totalCards,
  onScrollToSlide,
  stepClasses,
  className,
}: ProgressBarProps) {
  return (
    <Slider
      className={cn("mx-4", className)}
      max={totalCards}
      value={currentIndex}
      onChange={onScrollToSlide}
      stepClasses={stepClasses}
    />
  );
}
