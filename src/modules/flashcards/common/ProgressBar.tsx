import { Slider } from "@/components/Slider";
import { cn } from "@/lib/utils";
import { useSharedContext } from "./context";

interface ProgressBarProps {
  className?: string;
  stepClasses?: (string | undefined)[];
}

export function ProgressBar({ className, stepClasses }: ProgressBarProps) {
  const { currentIndex, totalCards, slidesApi } = useSharedContext();
  return (
    <Slider
      className={cn("mx-4", className)}
      max={totalCards}
      value={currentIndex}
      onChange={slidesApi.scrollToSlide}
      stepClasses={stepClasses}
    />
  );
}
