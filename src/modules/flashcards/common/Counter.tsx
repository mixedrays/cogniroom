import { cn } from "@/lib/utils";

interface CounterProps {
  currentIndex: number;
  totalCards: number;
  className?: string;
}

export function Counter({ currentIndex, totalCards, className }: CounterProps) {
  return (
    <div
      className={cn(
        "text-muted-foreground m-auto font-sans text-sm leading-normal font-light tracking-normal antialiased",
        className
      )}
    >
      {currentIndex + 1} / {totalCards}
    </div>
  );
}
