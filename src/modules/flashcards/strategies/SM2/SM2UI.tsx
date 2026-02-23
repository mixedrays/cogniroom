import { cn } from "@/lib/utils";
import type { Flashcard, ReviewData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Topbar } from "../../common/Topbar";
import { Counter } from "../../common/Counter";
import { ResetButton } from "../../common/ResetButton";
import { FlipButton } from "../../common/FlipButton";
import { ShuffleButton } from "../../common/ShuffleButton";
import { ProgressBar } from "../../common/ProgressBar";
import { Slider } from "../../common/Slider";
import { BottomBar } from "../../common/BottomBar";
import { useSharedContext } from "../../common/context";
import { SM2Provider, useSM2Context } from "./context";
import { Controls } from "./Controls";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { SessionComplete } from "./SessionComplete";

function SM2Topbar() {
  const { ratingColors } = useSM2Context();
  const {
    currentIndex,
    totalCards,
    flipCards,
    areCardsShuffled,
    canReset,
    onReset,
    handleToggleFlipCards,
    handleToggleShuffleCards,
    slidesApi,
  } = useSharedContext();

  return (
    <div>
      <Topbar className="relative">
        <ResetButton canReset={canReset} onReset={onReset} />
        <Counter
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          currentIndex={currentIndex}
          totalCards={totalCards}
        />
        <FlipButton flipCards={flipCards} onToggle={handleToggleFlipCards} />
        <ShuffleButton
          areCardsShuffled={areCardsShuffled}
          onToggle={handleToggleShuffleCards}
        />
      </Topbar>
      <ProgressBar
        currentIndex={currentIndex}
        totalCards={totalCards}
        onScrollToSlide={slidesApi.scrollToSlide}
        stepClasses={ratingColors}
      />
    </div>
  );
}

function SM2Slider() {
  const { sessionCards } = useSM2Context();
  const { flipCards, flippedCards, onFlipCard, slidesApi } = useSharedContext();
  return (
    <Slider
      cards={sessionCards}
      flipCards={flipCards}
      flippedCards={flippedCards}
      onFlipCard={onFlipCard}
      slidesApi={slidesApi}
    />
  );
}

function SM2Layout({ className }: { className?: string }) {
  const { slidesApi } = useSharedContext();
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <KeyboardShortcuts />
      <SM2Topbar />
      <SM2Slider />
      <BottomBar
        onScrollToPrev={slidesApi.scrollToPrev}
        onScrollToNext={slidesApi.scrollToNext}
        isFirstSlide={slidesApi.isFirstSlide}
        isLastSlide={slidesApi.isLastSlide}
      >
        <Controls />
      </BottomBar>
    </div>
  );
}

interface SM2UIProps {
  cards: Flashcard[];
  reviewData: ReviewData | null;
  onSave: (data: ReviewData) => Promise<void>;
  className?: string;
}

export function SM2UI({ cards, reviewData, onSave, className }: SM2UIProps) {
  return (
    <SM2Provider cards={cards} reviewData={reviewData} onSave={onSave}>
      <SM2UIContent className={className} />
    </SM2Provider>
  );
}

function SM2UIContent({ className }: { className?: string }) {
  const { sessionCards, sessionComplete, sessionStats, resetSession, setShowAllCards } =
    useSM2Context();

  if (sessionCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
        <p className="text-lg font-medium">No cards due for review</p>
        <p className="text-muted-foreground text-sm">
          All cards are scheduled for a future session. Check back later.
        </p>
        <Button variant="outline" onClick={() => setShowAllCards(true)}>
          Review anyway
        </Button>
      </div>
    );
  }

  if (sessionComplete) {
    return <SessionComplete stats={sessionStats} onReset={resetSession} />;
  }

  return <SM2Layout className={className} />;
}
