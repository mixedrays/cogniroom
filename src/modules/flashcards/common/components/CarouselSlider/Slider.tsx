import { cn } from "@/lib/utils";
import type { SlidesApi } from "./useSlidesApi";
import Flashcard from "../../Flashcard";

export interface SliderCard {
  id: string;
  question: string;
  answer: string;
  knownCount?: number;
}

interface SliderProps {
  cards: SliderCard[];
  flipCards: boolean;
  flippedCards: number[];
  onFlipCard: (index: number) => void;
  slidesApi: SlidesApi;
  className?: string;
}

export function Slider({
  cards,
  flipCards,
  flippedCards,
  onFlipCard,
  slidesApi,
  className,
}: SliderProps) {
  return (
    <div
      ref={slidesApi.scrollContainerRef}
      className={cn("grow overflow-hidden", className)}
    >
      <div className="flex h-full">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="flex h-full min-h-0 w-full shrink-0 grow-0 basis-full items-center justify-center px-4 pb-6 pt-4"
          >
            <Flashcard
              question={card.question}
              answer={card.answer}
              knownCount={card.knownCount}
              isFlipped={flippedCards.includes(index)}
              className="h-full w-full sm:h-auto"
              isFlippedByDefault={flipCards}
              onClick={() => onFlipCard(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
