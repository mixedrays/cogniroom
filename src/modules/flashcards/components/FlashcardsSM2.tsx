import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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
import { useFlashcardsSM2, type QualityRating } from "../hooks/useFlashcardsSM2";
import StudyFlashCard from "./Flashcard";
import SM2QualityControls from "./SM2QualityControls";

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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
  const [forceAll, setForceAll] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledCards, setShuffledCards] = useState(cards);
  const [flipCards, setFlipCards] = useState(false);
  const [ratingColors, setRatingColors] = useState<(string | undefined)[]>([]);

  const sm2 = useFlashcardsSM2(shuffledCards, reviewData, onSave, forceAll);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!isShuffled) setShuffledCards(cards);
  }, [cards, isShuffled]);

  useEffect(() => {
    setIsFlipped(flipCards);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sm2.currentIndex]);

  const flip = useCallback(() => setIsFlipped((f) => !f), []);

  const handleToggleFlipCards = useCallback(() => {
    setFlipCards((f) => {
      setIsFlipped(!f);
      return !f;
    });
  }, []);

  const handleToggleShuffle = useCallback(() => {
    const next = !isShuffled;
    setIsShuffled(next);
    setShuffledCards(next ? shuffleArray(cards) : cards);
    setRatingColors([]);
    sm2.resetSession();
  }, [cards, isShuffled, sm2.resetSession]);

  const rateCard = useCallback(
    async (q: QualityRating) => {
      const index = sm2.currentIndex;
      setRatingColors((prev) => {
        const next = [...prev];
        next[index] = getRatingColor(q);
        return next;
      });
      await sm2.rateCard(q);
    },
    [sm2.currentIndex, sm2.rateCard]
  );

  const resetSession = useCallback(() => {
    sm2.resetSession();
    setRatingColors([]);
  }, [sm2.resetSession]);

  return {
    ...sm2,
    rateCard,
    resetSession,
    isFlipped,
    flip,
    flipCards,
    handleToggleFlipCards,
    isShuffled,
    handleToggleShuffle,
    ratingColors,
    forceAll,
    setForceAll,
  };
};

type SM2ContextValue = ReturnType<typeof useFlashcardsSM2Value>;

const SM2Context = createContext<SM2ContextValue | null>(null);

const useSM2Context = (): SM2ContextValue => {
  const context = useContext(SM2Context);
  if (!context) {
    throw new Error("useSM2Context must be used within FlashcardsSM2.Container");
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
        <Button variant="outline" onClick={() => value.setForceAll(true)}>
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
    isShuffled,
    handleToggleShuffle,
    ratingColors,
  } = useSM2Context();

  return (
    <div>
      <div className="relative flex justify-between gap-1 px-4 py-2">
        <Tooltip content="Reset session">
          <span>
            <AlertDialog
              trigger={
                <Button variant="ghost" size="icon" disabled={currentIndex === 0}>
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
            <IconShuffle className={cn(isShuffled && "text-primary")} />
            {isShuffled && (
              <span className="bg-primary absolute top-[80%] left-1/2 size-0.75 -translate-x-1/2 rounded-full" />
            )}
          </Button>
        </Tooltip>
      </div>

      <ProgressSlider
        className="mx-4"
        max={sessionCards.length}
        value={currentIndex}
        stepClasses={ratingColors}
      />
    </div>
  );
};

interface FlashcardsSM2CardProps {
  className?: string;
}

const FlashcardsSM2Card = ({ className }: FlashcardsSM2CardProps) => {
  const { currentCard, isFlipped, flip, flipCards } = useSM2Context();

  return (
    <div
      className={cn(
        "flex-1 flex items-center justify-center px-4 pb-6 pt-4 overflow-hidden cursor-pointer",
        className
      )}
      onClick={flip}
    >
      {currentCard && (
        <StudyFlashCard
          question={currentCard.question}
          answer={currentCard.answer}
          isFlipped={isFlipped}
          className="h-full w-full sm:h-auto"
          isFlippedByDefault={flipCards}
        />
      )}
    </div>
  );
};

const FlashcardsSM2Controls = () => {
  const { currentCard, isFlipped, flip, sessionComplete, isSaving, rateCard } = useSM2Context();

  return (
    <div className="p-4 flex justify-center">
      {isFlipped ? (
        <SM2QualityControls
          currentCard={currentCard}
          sessionComplete={sessionComplete}
          isSaving={isSaving}
          onRate={rateCard}
        />
      ) : (
        <Button variant="outline" onClick={flip}>
          Show Answer{" "}
          <span className="ml-1 text-xs text-muted-foreground">(Space)</span>
        </Button>
      )}
    </div>
  );
};

const FlashcardsSM2KeyboardShortcuts = () => {
  const { flip } = useSM2Context();

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        flip();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [flip]);

  return null;
};

export const FlashcardsSM2 = {
  Container: FlashcardsSM2Container,
  Topbar: FlashcardsSM2Topbar,
  Card: FlashcardsSM2Card,
  Controls: FlashcardsSM2Controls,
  KeyboardShortcuts: FlashcardsSM2KeyboardShortcuts,
};
