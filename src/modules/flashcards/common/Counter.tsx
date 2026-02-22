import { useSharedContext } from "./context";

export function Counter() {
  const { currentIndex, totalCards } = useSharedContext();
  return (
    <p className="text-muted-foreground absolute top-1/2 left-1/2 m-auto block -translate-x-1/2 -translate-y-1/2 font-sans text-sm leading-normal font-light tracking-normal antialiased">
      {currentIndex + 1} / {totalCards}
    </p>
  );
}
