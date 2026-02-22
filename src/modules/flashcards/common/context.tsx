import { createContext, useContext } from "react";
import type { SlidesApi } from "./useSlidesApi";

export interface SharedFlashcardsContext {
  currentIndex: number;
  totalCards: number;
  slidesApi: SlidesApi;
  flippedCards: number[];
  flipCards: boolean;
  areCardsShuffled: boolean;
  canReset: boolean;
  onFlipCard: (index: number) => void;
  handleToggleFlipCards: () => void;
  handleToggleShuffleCards: () => void;
  onReset: () => void;
}

const SharedFlashcardsContext = createContext<SharedFlashcardsContext | null>(null);

export const SharedFlashcardsProvider = SharedFlashcardsContext.Provider;

export function useSharedContext(): SharedFlashcardsContext {
  const ctx = useContext(SharedFlashcardsContext);
  if (!ctx) {
    throw new Error("useSharedContext must be used within a flashcard strategy provider");
  }
  return ctx;
}
