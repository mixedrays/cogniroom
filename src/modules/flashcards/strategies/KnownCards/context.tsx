import React, { createContext, useContext } from "react";
import { useFlashCards } from "../../common/useFlashCards";
import { useSlidesApi } from "../../common/useSlidesApi";
import {
  SharedFlashcardsProvider,
  type SharedFlashcardsContext,
} from "../../common/context";
import { useKnownCards } from "./useKnownCards";

export type FlashcardData = {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  difficulty?: "easy" | "medium" | "hard";
  knownCount?: number;
};

type KnownCardsMap = ReturnType<
  typeof useKnownCards<FlashcardData>
>["knownCards"];

export type FlashcardsOnFinish = (k: KnownCardsMap) => Promise<void>;

const useKnownCardsValue = ({
  cards,
  onFinish,
}: {
  cards: FlashcardData[];
  onFinish?: FlashcardsOnFinish;
}) => {
  const knownCardsHook = useKnownCards<FlashcardData>();
  const flashcards = useFlashCards<FlashcardData>(cards, {
    cardFilter: knownCardsHook.cardFilter,
  });

  const slidesApi = useSlidesApi({
    slidesCount: flashcards.cardsToDisplay.length,
    currentIndex: flashcards.currentIndex,
    onIndexChange: flashcards.setCurrentIndex,
  });

  const statuses = knownCardsHook.getStatuses(flashcards.cardsToDisplay);
  const canReset =
    flashcards.canResetStudyState ||
    Object.keys(knownCardsHook.knownCards).length > 0;

  const onReset = () => {
    flashcards.resetStudyState();
    knownCardsHook.resetKnownCardsState();
    slidesApi.scrollToSlide(0);
  };

  const finishStudy = async () => {
    await onFinish?.(knownCardsHook.knownCards);
    onReset();
  };

  const toggleKnownCardWithAutoScroll = (status: boolean) => {
    knownCardsHook.handleToggleKnownCard(
      flashcards.currentCard,
      flashcards.currentCardId,
      status,
      {
        canAutoScrollNext: !slidesApi.isLastSlide,
        onAutoScrollNext: slidesApi.scrollToNext,
      }
    );
  };

  const cardsToDisplay = flashcards.cardsToDisplay.map((card) => ({
    ...card,
    knownCount: knownCardsHook.knownCards[card.id]?.knownCount ?? card.knownCount,
  }));

  const sharedContext: SharedFlashcardsContext = {
    currentIndex: flashcards.currentIndex,
    totalCards: flashcards.cardsCount,
    slidesApi,
    flippedCards: flashcards.flippedCards,
    flipCards: flashcards.flipCards,
    areCardsShuffled: flashcards.areCardsShuffled,
    canReset,
    onFlipCard: (index: number) => flashcards.toggleCardFlip(index),
    handleToggleFlipCards: flashcards.handleToggleFlipCards,
    handleToggleShuffleCards: flashcards.handleToggleShuffleCards,
    onReset,
  };

  return {
    sharedContext,
    ...knownCardsHook,
    statuses,
    cardsToDisplay,
    currentCard: flashcards.currentCard,
    currentCardId: flashcards.currentCardId,
    canReset,
    onFinish,
    finishStudy,
    toggleKnownCardWithAutoScroll,
    slidesApi,
  };
};

export type KnownCardsContextValue = Omit<
  ReturnType<typeof useKnownCardsValue>,
  "sharedContext"
>;

const KnownCardsContext = createContext<KnownCardsContextValue | null>(null);

export function useKnownCardsContext(): KnownCardsContextValue {
  const ctx = useContext(KnownCardsContext);
  if (!ctx) {
    throw new Error("useKnownCardsContext must be used within KnownCardsProvider");
  }
  return ctx;
}

interface KnownCardsProviderProps {
  cards: FlashcardData[];
  onFinish?: FlashcardsOnFinish;
  children: React.ReactNode;
}

export function KnownCardsProvider({
  cards,
  onFinish,
  children,
}: KnownCardsProviderProps) {
  const { sharedContext, ...kcValue } = useKnownCardsValue({ cards, onFinish });

  return (
    <SharedFlashcardsProvider value={sharedContext}>
      <KnownCardsContext.Provider value={kcValue}>
        {children}
      </KnownCardsContext.Provider>
    </SharedFlashcardsProvider>
  );
}
