import React from "react";
import { QtyIndicator } from "@/components/QtyIndicator";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface FlashcardSideProps {
  content: string;
  label: string;
  knownCount?: number;
  className?: string;
}

export const FlashcardSide = ({
  content,
  knownCount,
  label,
  className,
}: FlashcardSideProps) => {
  return (
    <div
      className={cn(
        "absolute flex h-full w-full items-center justify-center p-4 backface-hidden md:p-12 lg:p-14",
        className
      )}
    >
      <div className="absolute top-3 right-4 text-2xl font-bold text-gray-300 opacity-50">
        {label}
      </div>

      {knownCount !== undefined && (
        <QtyIndicator
          max={3}
          current={knownCount}
          className="absolute top-4 left-4 opacity-70"
        />
      )}

      <div className="max-h-full max-w-full overflow-auto text-lg">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

interface FlashcardProps {
  question: string;
  answer: string;
  knownCount?: number;
  isFlipped: boolean;
  className?: string;
  isFlippedByDefault?: boolean;
}

const Flashcard = ({
  question,
  answer,
  isFlipped,
  knownCount,
  className,
  isFlippedByDefault = false,
}: FlashcardProps) => {
  return (
    <div className={cn("perspective-[4000px]", className)}>
      <div
        className={cn(
          "aspect-3/2 h-full w-full",
          "bg-card relative rounded-lg text-lg",
          "border-border/75 dark:border-border border shadow-lg transition-transform duration-500 transform-3d",
          "transform-gpu lg:text-xl",
          isFlipped && "transform-[rotateY(180deg)]"
        )}
      >
        {isFlippedByDefault ? (
          <>
            <FlashcardSide
              content={question}
              label="Q"
              className="transform-[rotateY(180deg)]"
              knownCount={knownCount}
            />
            <FlashcardSide content={answer} label="A" knownCount={knownCount} />
          </>
        ) : (
          <>
            <FlashcardSide
              content={question}
              label="Q"
              knownCount={knownCount}
            />
            <FlashcardSide
              knownCount={knownCount}
              content={answer}
              label="A"
              className="transform-[rotateY(180deg)]"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(Flashcard);
