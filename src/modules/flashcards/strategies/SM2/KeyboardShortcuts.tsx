import { useEffect } from "react";
import { useSharedContext } from "../../common/context";

export function KeyboardShortcuts() {
  const { currentIndex, onFlipCard } = useSharedContext();

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        onFlipCard(currentIndex);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [currentIndex, onFlipCard]);

  return null;
}
