import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  Undo as IconReset,
  RotateCcw as IconFlip,
  Shuffle as IconShuffle,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/AlertDialog";
import { Slider as ProgressSlider } from "@/components/Slider";
import { cn } from "@/lib/utils";
import type { Flashcard, ReviewData } from "@/lib/types";
import { useFlashCards } from "../hooks/useFlashCards";
import {
  useFlashcardsSM2,
  type QualityRating,
} from "../hooks/useFlashcardsSM2";
import { useSlidesApi } from "../hooks/useSlidesApi";
import StudyFlashCard from "./Flashcard";
import SM2QualityControls from "./SM2QualityControls";

const getRatingColor = (q: QualityRating): string =>
  q >= 4 ? "bg-green-500!" : q >= 3 ? "bg-yellow-500!" : "bg-red-500!";

const useFlashcardsSM2Value = ({
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

  const handleToggleShuffle = useCallback(() => {
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
  }, [sm2.resetSession, slidesApi.scrollToSlide]);

  const isCurrentFlipped = flashcards.flippedCards.includes(sm2.currentIndex);
  const isAnswerVisible = flashcards.flipCards
    ? !isCurrentFlipped
    : isCurrentFlipped;

  return {
    ...sm2,
    rateCard,
    resetSession,
    flipCards: flashcards.flipCards,
    handleToggleFlipCards: flashcards.handleToggleFlipCards,
    areCardsShuffled: flashcards.areCardsShuffled,
    handleToggleShuffle,
    ratingColors,
    flippedCards: flashcards.flippedCards,
    toggleCardFlip: flashcards.toggleCardFlip,
    isAnswerVisible,
    slidesApi,
    showAllCards,
    setShowAllCards,
  };
};

type SM2ContextValue = ReturnType<typeof useFlashcardsSM2Value>;

const SM2Context = createContext<SM2ContextValue | null>(null);

const useSM2Context = (): SM2ContextValue => {
  const context = useContext(SM2Context);
  if (!context) {
    throw new Error(
      "useSM2Context must be used within FlashcardsSM2.Container"
    );
  }
  return context;
};

interface FlashcardsSM2ContainerProps {
  cards: Flashcard[];
  reviewData: ReviewData | null;
  onSave: (data: ReviewData) => Promise<void>;
  className?: string;
  children: React.ReactNode;
}

const FlashcardsSM2Container = ({
  cards,
  reviewData,
  onSave,
  className,
  children,
}: FlashcardsSM2ContainerProps) => {
  const value = useFlashcardsSM2Value({ cards, reviewData, onSave });

  if (value.sessionCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
        <p className="text-lg font-medium">No cards due for review</p>
        <p className="text-muted-foreground text-sm">
          All cards are scheduled for a future session. Check back later.
        </p>
        <Button variant="outline" onClick={() => value.setShowAllCards(true)}>
          Review anyway
        </Button>
      </div>
    );
  }

  if (value.sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
        <p className="text-xl font-semibold">Session complete!</p>
        <p className="text-muted-foreground text-sm">
          All {value.sessionCards.length} cards reviewed.
        </p>
        <Button variant="outline" onClick={value.resetSession}>
          Review again
        </Button>
      </div>
    );
  }

  return (
    <SM2Context.Provider value={value}>
      <div className={cn("flex flex-col h-full", className)}>{children}</div>
    </SM2Context.Provider>
  );
};

const FlashcardsSM2Topbar = () => {
  const {
    currentIndex,
    sessionCards,
    resetSession,
    flipCards,
    handleToggleFlipCards,
    areCardsShuffled,
    handleToggleShuffle,
    ratingColors,
    slidesApi,
  } = useSM2Context();

  return (
    <div>
      <div className="relative flex justify-between gap-1 px-4 py-2">
        <Tooltip content="Reset session">
          <span>
            <AlertDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentIndex === 0}
                >
                  <IconReset />
                </Button>
              }
              confirmText="Reset"
              title="Reset session"
              description="Are you sure? All current progress will be lost."
              onConfirm={resetSession}
            />
          </span>
        </Tooltip>

        <p className="text-muted-foreground absolute top-1/2 left-1/2 m-auto block -translate-x-1/2 -translate-y-1/2 font-sans text-sm leading-normal font-light tracking-normal antialiased">
          {currentIndex + 1} / {sessionCards.length}
        </p>

        <Tooltip content="Flip all cards">
          <Button
            className="relative ml-auto"
            variant="ghost"
            size="icon"
            onClick={handleToggleFlipCards}
          >
            <IconFlip className={cn(flipCards && "text-primary")} />
            {flipCards && (
              <span className="bg-primary absolute top-[75%] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full" />
            )}
          </Button>
        </Tooltip>

        <Tooltip content="Shuffle cards">
          <Button
            className="relative"
            variant="ghost"
            size="icon"
            onClick={handleToggleShuffle}
          >
            <IconShuffle className={cn(areCardsShuffled && "text-primary")} />
            {areCardsShuffled && (
              <span className="bg-primary absolute top-[80%] left-1/2 size-0.75 -translate-x-1/2 rounded-full" />
            )}
          </Button>
        </Tooltip>
      </div>

      <ProgressSlider
        className="mx-4"
        max={sessionCards.length}
        value={currentIndex}
        onChange={slidesApi.scrollToSlide}
        stepClasses={ratingColors}
      />
    </div>
  );
};

interface FlashcardsSM2CardProps {
  className?: string;
}

const FlashcardsSM2Card = ({ className }: FlashcardsSM2CardProps) => {
  const { sessionCards, flipCards, flippedCards, toggleCardFlip, slidesApi } =
    useSM2Context();

  return (
    <div
      ref={slidesApi.scrollContainerRef}
      className={cn(
        "grow snap-y snap-mandatory overflow-y-auto scroll-smooth no-scrollbar",
        className
      )}
    >
      {sessionCards.map((card, index) => (
        <div
          key={card.id}
          ref={slidesApi.getSlideRef(index)}
          className="flex h-full w-full snap-start snap-always items-center justify-center px-4 pb-6 pt-4 cursor-pointer"
          onClick={() => toggleCardFlip(index)}
        >
          <StudyFlashCard
            question={card.question}
            answer={card.answer}
            isFlipped={flippedCards.includes(index)}
            className="h-full w-full sm:h-auto"
            isFlippedByDefault={flipCards}
          />
        </div>
      ))}
    </div>
  );
};

const FlashcardsSM2Controls = () => {
  const {
    currentIndex,
    currentCard,
    isAnswerVisible,
    toggleCardFlip,
    sessionComplete,
    isSaving,
    rateCard,
  } = useSM2Context();

  return (
    <div className="p-4 flex justify-center">
      {isAnswerVisible ? (
        <SM2QualityControls
          currentCard={currentCard}
          sessionComplete={sessionComplete}
          isSaving={isSaving}
          onRate={rateCard}
        />
      ) : (
        <Button variant="outline" onClick={() => toggleCardFlip(currentIndex)}>
          Show Answer{" "}
          <span className="ml-1 text-xs text-muted-foreground">(Space)</span>
        </Button>
      )}
    </div>
  );
};

const FlashcardsSM2KeyboardShortcuts = () => {
  const { currentIndex, toggleCardFlip } = useSM2Context();

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        toggleCardFlip(currentIndex);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [currentIndex, toggleCardFlip]);

  return null;
};

export const FlashcardsSM2 = {
  Container: FlashcardsSM2Container,
  Topbar: FlashcardsSM2Topbar,
  Card: FlashcardsSM2Card,
  Controls: FlashcardsSM2Controls,
  KeyboardShortcuts: FlashcardsSM2KeyboardShortcuts,
};
