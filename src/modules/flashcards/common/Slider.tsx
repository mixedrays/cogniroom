import { cn } from "@/lib/utils";
import type { SlidesApi } from "./useSlidesApi";
import Flashcard from "./Flashcard";

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
      className={cn(
        "grow snap-y snap-mandatory overflow-y-auto scroll-smooth no-scrollbar",
        className
      )}
    >
      {cards.map((card, index) => (
        <div
          key={card.id}
          ref={slidesApi.getSlideRef(index)}
          className="flex h-full w-full snap-start snap-always items-center justify-center px-4 pb-6 pt-4"
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
  );
}
