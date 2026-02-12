import React, { createContext, useContext, useEffect } from "react";
import {
  Undo as IconReset,
  RotateCcw as IconFlip,
  Settings2 as IconSettings,
  Shuffle as IconShuffle,
  ArrowUp as IconPrev,
  ArrowDown as IconNext,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { AlertDialog } from "@/components/AlertDialog";
import { Slider as ProgressSlider } from "@/components/Slider";
import { cn } from "@/lib/utils";
import type { StudyAction } from "../hooks/useFlashCards";
import { useFlashCards } from "../hooks/useFlashCards";
import { useKnownCards } from "../hooks/useKnownCards";
import { useSlidesApi } from "../hooks/useSlidesApi";
import StudyFlashCard from "./Flashcard";
import KnownCardControls from "./KnownCardControls";

export type FlashcardData = {
  id: string;
  question: string;
  answer: string;
  knownCount?: number;
};

export type FlashcardsContextValue = {
  flippedCards: number[];
  knownCards: Record<string, { status: boolean; knownCount: number }>;
  currentIndex: number;
  trackProgress: boolean;
  autoScroll: boolean;
  shuffledCards: number[] | undefined;
  flipCards: boolean;
  hideKnownCards: boolean;
  areCardsShuffled: boolean;
  cardsToDisplay: FlashcardData[];
  currentCard: FlashcardData | undefined;
  currentCardId: string | undefined;
  isCardKnown: boolean | undefined;
  isCardUnknown: boolean | undefined;
  cardsCount: number;
  canFinishStudy: boolean;
  statuses: Array<boolean | undefined>;
  canResetStudyState: boolean;
  dispatch: React.Dispatch<StudyAction>;
  toggleCardFlip: (index: number) => void;
  setCurrentIndex: (index: number) => void;
  toggleKnownCard: (card: FlashcardData | undefined, status: boolean) => void;
  resetStudyState: () => void;
  toggleTrackProgress: (trackProgress: boolean) => void;
  toggleAutoScroll: (autoScroll: boolean) => void;
  toggleShuffleCards: (length: number | undefined) => void;
  toggleFlipCards: (flipCards: boolean) => void;
  toggleHideKnownCards: (hideKnownCards: boolean) => void;
  handleFlipCard: () => void;
  handleToggleFlipCards: () => void;
  handleToggleShuffleCards: () => void;
  handleToggleKnownCard: (
    card: FlashcardData | undefined,
    cardId: string | undefined,
    status: boolean,
    options?: {
      canAutoScrollNext?: boolean;
      onAutoScrollNext?: () => void;
    }
  ) => void;
  slidesApi: ReturnType<typeof useSlidesApi>;
  resetStudy: () => void;
  finishStudy: () => Promise<void>;
  toggleKnownCardWithAutoScroll: (status: boolean) => void;
  onFinish?: (k: FlashcardsContextValue["knownCards"]) => Promise<void>;
};

const FlashcardsContext = createContext<FlashcardsContextValue | null>(null);

export const useFlashcardsContext = (): FlashcardsContextValue => {
  const context = useContext(FlashcardsContext);
  if (!context) {
    throw new Error(
      "useFlashcardsContext must be used within Flashcards.Provider"
    );
  }
  return context;
};

interface FlashcardsProviderProps {
  cards: FlashcardData[];
  onFinish?: (k: FlashcardsContextValue["knownCards"]) => Promise<void>;
  slidesThreshold?: number;
  children: React.ReactNode;
}

const FlashcardsProvider = ({
  cards,
  onFinish,
  slidesThreshold,
  children,
}: FlashcardsProviderProps) => {
  const knownCardsHook = useKnownCards<FlashcardData>();
  const flashcards = useFlashCards<FlashcardData>(cards, {
    cardFilter: knownCardsHook.cardFilter,
  });

  const slidesApi = useSlidesApi({
    slidesCount: flashcards.cardsToDisplay.length,
    currentIndex: flashcards.currentIndex,
    onIndexChange: flashcards.setCurrentIndex,
    threshold: slidesThreshold,
  });

  const isCardKnown = knownCardsHook.getIsCardKnown(flashcards.currentCardId);
  const isCardUnknown = knownCardsHook.getIsCardUnknown(
    flashcards.currentCardId
  );
  const statuses = knownCardsHook.getStatuses(flashcards.cardsToDisplay);
  const canResetStudyState =
    flashcards.canResetStudyState ||
    Object.keys(knownCardsHook.knownCards).length > 0;

  const resetStudy = () => {
    flashcards.resetStudyState();
    knownCardsHook.resetKnownCardsState();
    slidesApi.scrollToSlide(0);
  };

  const finishStudy = async () => {
    await onFinish?.(knownCardsHook.knownCards);
    resetStudy();
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

  return (
    <FlashcardsContext.Provider
      value={{
        ...flashcards,
        ...knownCardsHook,
        isCardKnown,
        isCardUnknown,
        statuses,
        canResetStudyState,
        canFinishStudy: knownCardsHook.canFinishStudy,
        slidesApi,
        resetStudy,
        finishStudy,
        onFinish,
        toggleKnownCardWithAutoScroll,
      }}
    >
      {children}
    </FlashcardsContext.Provider>
  );
};

const FlashcardsKeyboardShortcuts = ({}) => {
  const {
    slidesApi,
    handleFlipCard,
    toggleKnownCardWithAutoScroll,
    trackProgress,
    canFinishStudy,
    finishStudy,
  } = useFlashcardsContext();

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
        handleFlipCard();
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

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [
    canFinishStudy,
    handleFlipCard,
    finishStudy,
    slidesApi,
    toggleKnownCardWithAutoScroll,
    trackProgress,
  ]);

  return null;
};

interface FlashcardsContainerProps {
  className?: string;
  children: React.ReactNode;
  onFinish?: (k: FlashcardsContextValue["knownCards"]) => Promise<void>;
  cards: FlashcardData[];
}

const FlashcardsContainer = ({
  className,
  children,
  onFinish,
  cards,
}: FlashcardsContainerProps) => {
  return (
    <FlashcardsProvider cards={cards} onFinish={onFinish}>
      <div className={cn("relative flex h-full flex-col", className)}>
        {children}
      </div>
    </FlashcardsProvider>
  );
};

interface FlashcardsTopbarProps {
  onReset?: () => void;
}

const FlashcardsTopbar = ({ onReset }: FlashcardsTopbarProps) => {
  const {
    currentIndex,
    cardsCount,
    canResetStudyState,
    flipCards,
    areCardsShuffled,
    trackProgress,
    autoScroll,
    hideKnownCards,
    toggleTrackProgress,
    toggleAutoScroll,
    toggleHideKnownCards,
    handleToggleFlipCards,
    handleToggleShuffleCards,
    resetStudy,
    statuses,
    slidesApi,
  } = useFlashcardsContext();

  const handleReset = onReset ?? resetStudy;

  return (
    <div>
      <div className="relative flex justify-between gap-1 px-4 py-2">
        <Tooltip content="Reset study session">
          <span>
            <AlertDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!canResetStudyState}
                >
                  <IconReset />
                </Button>
              }
              confirmText="Reset"
              title="Reset study session"
              description="Are you sure? All current progress will be lost."
              onConfirm={handleReset}
            />
          </span>
        </Tooltip>

        <p className="text-muted-foreground absolute top-1/2 left-1/2 m-auto block -translate-x-1/2 -translate-y-1/2 font-sans text-sm leading-normal font-light tracking-normal antialiased">
          {currentIndex + 1} / {cardsCount}
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
            onClick={handleToggleShuffleCards}
          >
            <IconShuffle className={cn(areCardsShuffled && "text-primary")} />
            {areCardsShuffled && (
              <span className="bg-primary absolute top-[75%] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full" />
            )}
          </Button>
        </Tooltip>

        <DropdownMenu modal={false}>
          <Tooltip content="Settings">
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <IconSettings />
            </DropdownMenuTrigger>
          </Tooltip>

          <DropdownMenuContent className="min-w-fit">
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  toggleTrackProgress(!trackProgress);
                }}
              >
                <Switch checked={trackProgress} />
                Track progress
              </DropdownMenuItem>

              <DropdownMenuItem
                className="gap-2"
                disabled={!trackProgress}
                onClick={(e) => {
                  e.preventDefault();
                  toggleAutoScroll(!autoScroll);
                }}
              >
                <Switch checked={autoScroll} />
                Auto scroll
              </DropdownMenuItem>

              <DropdownMenuItem
                className="gap-2"
                disabled={!trackProgress}
                onClick={(e) => {
                  e.preventDefault();
                  toggleHideKnownCards(!hideKnownCards);
                }}
              >
                <Switch checked={hideKnownCards} />
                Hide known cards
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProgressSlider
        className="mx-4"
        max={cardsCount}
        value={currentIndex}
        onChange={slidesApi.scrollToSlide}
        stepsStatuses={trackProgress ? statuses : undefined}
      />
    </div>
  );
};

interface FlashcardsSliderProps {
  className?: string;
}

const FlashcardsSlider = ({ className }: FlashcardsSliderProps) => {
  const {
    cardsToDisplay,
    knownCards,
    flippedCards,
    flipCards,
    handleFlipCard,
    slidesApi,
  } = useFlashcardsContext();

  return (
    <>
      <div
        ref={slidesApi.scrollContainerRef}
        className={cn(
          "grow snap-y snap-mandatory overflow-y-auto scroll-smooth",
          className
        )}
      >
        {cardsToDisplay.map((card, index) => (
          <div
            key={card.id}
            ref={slidesApi.getSlideRef(index)}
            className="flex h-full w-full snap-start snap-always items-center justify-center px-4 pb-6 pt-4"
            onClick={handleFlipCard}
          >
            <StudyFlashCard
              question={card.question}
              answer={card.answer}
              knownCount={knownCards[card.id]?.knownCount ?? card.knownCount}
              isFlipped={flippedCards.includes(index)}
              className="h-full w-full sm:h-auto"
              isFlippedByDefault={flipCards}
            />
          </div>
        ))}
      </div>
    </>
  );
};

interface FlashcardsBottomBarProps {
  className?: string;
  children?: React.ReactNode;
}

const FlashcardsBottomBar = ({
  className,
  children,
}: FlashcardsBottomBarProps) => {
  const { slidesApi } = useFlashcardsContext();

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-1 p-4",
        className
      )}
    >
      <Tooltip
        content={
          <>
            Previous card{" "}
            <span className="text-muted-foreground text-xs">(Up Arrow)</span>
          </>
        }
      >
        <span>
          <Button
            variant="secondary"
            size="icon-lg"
            onClick={slidesApi.scrollToPrev}
            disabled={slidesApi.isFirstSlide}
          >
            <IconPrev />
          </Button>
        </span>
      </Tooltip>

      {children}

      <Tooltip
        content={
          <>
            Next card{" "}
            <span className="text-muted-foreground text-xs">(Down Arrow)</span>
          </>
        }
      >
        <span>
          <Button
            variant="secondary"
            size="icon-lg"
            onClick={slidesApi.scrollToNext}
            disabled={slidesApi.isLastSlide}
          >
            <IconNext />
          </Button>
        </span>
      </Tooltip>
    </div>
  );
};

export const Flashcards = {
  Provider: FlashcardsProvider,
  Container: FlashcardsContainer,
  Topbar: FlashcardsTopbar,
  Slider: FlashcardsSlider,
  BottomBar: FlashcardsBottomBar,
  KeyboardShortcuts: FlashcardsKeyboardShortcuts,
  KnownCardControls,
};

export {
  FlashcardsProvider,
  FlashcardsContainer,
  FlashcardsTopbar,
  FlashcardsSlider,
  FlashcardsBottomBar,
  FlashcardsKeyboardShortcuts,
  KnownCardControls,
};
