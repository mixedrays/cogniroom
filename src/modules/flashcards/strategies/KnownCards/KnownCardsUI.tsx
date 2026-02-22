import { cn } from "@/lib/utils";
import { useOS } from "@/hooks/use-os";
import { Topbar } from "../../common/Topbar";
import { Counter } from "../../common/Counter";
import { ResetButton } from "../../common/ResetButton";
import { FlipButton } from "../../common/FlipButton";
import { ShuffleButton } from "../../common/ShuffleButton";
import { ProgressBar } from "../../common/ProgressBar";
import { Slider } from "../../common/Slider";
import { BottomBar } from "../../common/BottomBar";
import { useSharedContext } from "../../common/context";
import {
  KnownCardsProvider,
  useKnownCardsContext,
  type FlashcardData,
  type FlashcardsOnFinish,
} from "./context";
import { Controls } from "./Controls";
import { Settings } from "./Settings";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

function KnownCardsTopbar() {
  const { statuses } = useKnownCardsContext();
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
        <Settings />
      </Topbar>
      <ProgressBar
        currentIndex={currentIndex}
        totalCards={totalCards}
        onScrollToSlide={slidesApi.scrollToSlide}
        stepClasses={statuses}
      />
    </div>
  );
}

function KnownCardsSlider() {
  const { cardsToDisplay } = useKnownCardsContext();
  const { flipCards, flippedCards, onFlipCard, slidesApi } = useSharedContext();
  return (
    <Slider
      cards={cardsToDisplay}
      flipCards={flipCards}
      flippedCards={flippedCards}
      onFlipCard={onFlipCard}
      slidesApi={slidesApi}
    />
  );
}

function KnownCardsLayout({ className }: { className?: string }) {
  const { isMac } = useOS();
  const { slidesApi } = useSharedContext();

  return (
    <div className={cn("relative flex h-full flex-col", className)}>
      <KeyboardShortcuts />
      <KnownCardsTopbar />
      <KnownCardsSlider />
      <BottomBar
        onScrollToPrev={slidesApi.scrollToPrev}
        onScrollToNext={slidesApi.scrollToNext}
        isFirstSlide={slidesApi.isFirstSlide}
        isLastSlide={slidesApi.isLastSlide}
      >
        <Controls
          isLastSlide={slidesApi.isLastSlide}
          finishShortcutLabel={`${isMac ? "⌘" : "Ctrl"} + Enter`}
        />
      </BottomBar>
    </div>
  );
}

interface KnownCardsUIProps {
  cards: FlashcardData[];
  className?: string;
  onFinish?: FlashcardsOnFinish;
}

export function KnownCardsUI({
  cards,
  className,
  onFinish,
}: KnownCardsUIProps) {
  return (
    <KnownCardsProvider cards={cards} onFinish={onFinish}>
      <KnownCardsLayout className={className} />
    </KnownCardsProvider>
  );
}
