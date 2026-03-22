import { useEffect } from "react";
import { useSharedContext } from "../../common/context";
import { useSM2Context } from "./context";

export function KeyboardShortcuts() {
  const { currentIndex, onFlipCard, slidesApi } = useSharedContext();
  const { rateCard, currentCard, sessionComplete, isSaving } = useSM2Context();

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === " ") {
        e.preventDefault();
        onFlipCard(currentIndex);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        slidesApi.scrollToPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        slidesApi.scrollToNext();
      }
      if (!currentCard || sessionComplete || isSaving) return;
      if (e.key === "1") void rateCard(1);
      if (e.key === "2") void rateCard(3);
      if (e.key === "3") void rateCard(5);
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [
    currentIndex,
    onFlipCard,
    slidesApi,
    rateCard,
    currentCard,
    sessionComplete,
    isSaving,
  ]);

  return null;
}
