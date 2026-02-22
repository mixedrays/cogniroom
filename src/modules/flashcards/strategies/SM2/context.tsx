import React, { createContext, useCallback, useContext, useState } from "react";
import type { Flashcard, ReviewData } from "@/lib/types";
import { useFlashCards } from "../../common/useFlashCards";
import { useSlidesApi } from "../../common/useSlidesApi";
import {
  SharedFlashcardsProvider,
  type SharedFlashcardsContext,
} from "../../common/context";
import { useFlashcardsSM2, type QualityRating } from "./useFlashcardsSM2";

const getRatingColor = (q: QualityRating): string =>
  q >= 4 ? "bg-green-500!" : q >= 3 ? "bg-yellow-500!" : "bg-red-500!";

const useSM2Value = ({
  cards,
  reviewData,
  onSave,
}: {
  cards: Flashcard[];
  reviewData: ReviewData | null;
  onSave: (data: ReviewData) => Promise<void>;
}) => {
  const [showAllCards, setShowAllCards] = useState(false);
  const [ratingColors, setRatingColors] = useState<(string | undefined)[]>([]);

  const flashcards = useFlashCards<Flashcard>(cards);
  const sm2 = useFlashcardsSM2(
    flashcards.cardsToDisplay,
    reviewData,
    onSave,
    showAllCards
  );

  const slidesApi = useSlidesApi({
    slidesCount: sm2.sessionCards.length,
    currentIndex: sm2.currentIndex,
    onIndexChange: sm2.setCurrentIndex,
  });

  const handleToggleShuffleCards = useCallback(() => {
    flashcards.handleToggleShuffleCards();
    setRatingColors([]);
    sm2.resetSession();
    slidesApi.scrollToSlide(0);
  }, [flashcards.handleToggleShuffleCards, sm2.resetSession, slidesApi.scrollToSlide]);

  const rateCard = useCallback(
    async (q: QualityRating) => {
      const index = sm2.currentIndex;
      setRatingColors((prev) => {
        const next = [...prev];
        next[index] = getRatingColor(q);
        return next;
      });
      await sm2.rateCard(q);
      slidesApi.scrollToSlide(index + 1);
    },
    [sm2.currentIndex, sm2.rateCard, slidesApi.scrollToSlide]
  );

  const resetSession = useCallback(() => {
    sm2.resetSession();
    setRatingColors([]);
    flashcards.resetStudyState();
    slidesApi.scrollToSlide(0);
  }, [sm2.resetSession, flashcards.resetStudyState, slidesApi.scrollToSlide]);

  const isCurrentFlipped = flashcards.flippedCards.includes(sm2.currentIndex);
  const isAnswerVisible = flashcards.flipCards ? !isCurrentFlipped : isCurrentFlipped;

  const sharedContext: SharedFlashcardsContext = {
    currentIndex: sm2.currentIndex,
    totalCards: sm2.sessionCards.length,
    slidesApi,
    flippedCards: flashcards.flippedCards,
    flipCards: flashcards.flipCards,
    areCardsShuffled: flashcards.areCardsShuffled,
    canReset: sm2.currentIndex > 0,
    onFlipCard: (index: number) => flashcards.toggleCardFlip(index),
    handleToggleFlipCards: flashcards.handleToggleFlipCards,
    handleToggleShuffleCards,
    onReset: resetSession,
  };

  return {
    sharedContext,
    ...sm2,
    rateCard,
    resetSession,
    ratingColors,
    isAnswerVisible,
    showAllCards,
    setShowAllCards,
    slidesApi,
    flipCards: flashcards.flipCards,
    flippedCards: flashcards.flippedCards,
    toggleCardFlip: flashcards.toggleCardFlip,
  };
};

export type SM2ContextValue = Omit<ReturnType<typeof useSM2Value>, "sharedContext">;

const SM2Context = createContext<SM2ContextValue | null>(null);

export function useSM2Context(): SM2ContextValue {
  const ctx = useContext(SM2Context);
  if (!ctx) {
    throw new Error("useSM2Context must be used within SM2Provider");
  }
  return ctx;
}

interface SM2ProviderProps {
  cards: Flashcard[];
  reviewData: ReviewData | null;
  onSave: (data: ReviewData) => Promise<void>;
  children: React.ReactNode;
}

export function SM2Provider({ cards, reviewData, onSave, children }: SM2ProviderProps) {
  const { sharedContext, ...sm2Value } = useSM2Value({ cards, reviewData, onSave });

  return (
    <SharedFlashcardsProvider value={sharedContext}>
      <SM2Context.Provider value={sm2Value}>
        {children}
      </SM2Context.Provider>
    </SharedFlashcardsProvider>
  );
}
