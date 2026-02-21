import { useOS } from "@/hooks/use-os";
import { Flashcards, type FlashcardData, type FlashcardsOnFinish } from "./Flashcards";

interface FlashcardsKnownCardsProps {
  cards: FlashcardData[];
  className?: string;
  onFinish?: FlashcardsOnFinish;
}

export function FlashcardsKnownCards({
  cards,
  className,
  onFinish,
}: FlashcardsKnownCardsProps) {
  const { isMac } = useOS();

  return (
    <Flashcards.Container className={className} cards={cards} onFinish={onFinish}>
      <Flashcards.KeyboardShortcuts />
      <Flashcards.Topbar />
      <Flashcards.Slider />
      <Flashcards.BottomBar>
        <Flashcards.KnownCardControls
          finishShortcutLabel={`${isMac ? "⌘" : "Ctrl"} + Enter`}
        />
      </Flashcards.BottomBar>
    </Flashcards.Container>
  );
}
