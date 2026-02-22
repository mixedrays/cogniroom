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
import { KnownCardsProvider, useKnownCardsContext, type FlashcardData, type FlashcardsOnFinish } from "./context";
import { Controls } from "./Controls";
import { Settings } from "./Settings";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

function KnownCardsTopbar() {
  const { statuses } = useKnownCardsContext();
  return (
    <div>
      <Topbar>
        <ResetButton />
        <Counter />
        <FlipButton />
        <ShuffleButton />
        <Settings />
      </Topbar>
      <ProgressBar stepClasses={statuses} />
    </div>
  );
}

function KnownCardsSlider() {
  const { cardsToDisplay } = useKnownCardsContext();
  return <Slider cards={cardsToDisplay} />;
}

function KnownCardsLayout({ className }: { className?: string }) {
  const { isMac } = useOS();
  return (
    <div className={cn("relative flex h-full flex-col", className)}>
      <KeyboardShortcuts />
      <KnownCardsTopbar />
      <KnownCardsSlider />
      <BottomBar>
        <Controls finishShortcutLabel={`${isMac ? "⌘" : "Ctrl"} + Enter`} />
      </BottomBar>
    </div>
  );
}

interface KnownCardsUIProps {
  cards: FlashcardData[];
  className?: string;
  onFinish?: FlashcardsOnFinish;
}

export function KnownCardsUI({ cards, className, onFinish }: KnownCardsUIProps) {
  return (
    <KnownCardsProvider cards={cards} onFinish={onFinish}>
      <KnownCardsLayout className={className} />
    </KnownCardsProvider>
  );
}
