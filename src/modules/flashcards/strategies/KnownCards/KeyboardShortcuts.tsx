import { useEffect } from "react";
import { useSharedContext } from "../../common/context";
import { useKnownCardsContext } from "./context";

export function KeyboardShortcuts() {
  const { currentIndex, slidesApi, onFlipCard } = useSharedContext();
  const {
    trackProgress,
    canFinishStudy,
    toggleKnownCardWithAutoScroll,
    finishStudy,
  } = useKnownCardsContext();

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        slidesApi.scrollToNext();
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        slidesApi.scrollToPrev();
      }

      if (e.key === " ") {
        e.preventDefault();
        onFlipCard(currentIndex);
      }

      if (e.key === "ArrowRight") {
        toggleKnownCardWithAutoScroll(true);
      }

      if (e.key === "ArrowLeft") {
        toggleKnownCardWithAutoScroll(false);
      }

      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        if (trackProgress && canFinishStudy) {
          e.preventDefault();
          void finishStudy();
        }
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [
    currentIndex,
    slidesApi,
    onFlipCard,
    trackProgress,
    canFinishStudy,
    toggleKnownCardWithAutoScroll,
    finishStudy,
  ]);

  return null;
}
