import React, { createContext, useContext, useEffect, useCallback } from "react";
import {
  Undo as IconReset,
  ArrowUp as IconPrev,
  ArrowDown as IconNext,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/AlertDialog";
import { Slider as ProgressSlider } from "@/components/Slider";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/types";
import { useSlidesApi } from "@/modules/flashcards/common/useSlidesApi";
import { useQuiz } from "../hooks/useQuiz";
import { useQuizAnswers } from "../hooks/useQuizAnswers";
import { QuizOption } from "./QuizOption";
import { Markdown } from "@/modules/markdown";

type QuizContextValue = ReturnType<typeof useQuiz> &
  ReturnType<typeof useQuizAnswers> & {
    slidesApi: ReturnType<typeof useSlidesApi>;
  };

const QuizContext = createContext<QuizContextValue | null>(null);

export const useQuizContext = (): QuizContextValue => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error("useQuizContext must be used within Quiz.Container");
  }
  return context;
};

interface QuizContainerProps {
  questions: QuizQuestion[];
  className?: string;
  children: React.ReactNode;
}

const QuizContainer = ({
  questions,
  className,
  children,
}: QuizContainerProps) => {
  const quizHook = useQuiz(questions);
  const answersHook = useQuizAnswers();

  const slidesApi = useSlidesApi({
    slidesCount: quizHook.questionsCount,
    currentIndex: quizHook.currentIndex,
    onIndexChange: quizHook.setCurrentIndex,
  });

  return (
    <QuizContext.Provider value={{ ...quizHook, ...answersHook, slidesApi }}>
      <div className={cn("relative flex h-full flex-col", className)}>
        {children}
      </div>
    </QuizContext.Provider>
  );
};

const QuizTopbar = () => {
  const {
    currentIndex,
    questionsCount,
    questions,
    getScore,
    getStatuses,
    resetQuiz,
    resetAnswers,
    slidesApi,
  } = useQuizContext();

  const score = getScore(questions);
  const statuses = getStatuses(questions);

  const handleReset = useCallback(() => {
    resetQuiz();
    resetAnswers();
    slidesApi.scrollToSlide(0);
  }, [resetQuiz, resetAnswers, slidesApi]);

  return (
    <div>
      <div className="relative flex justify-between gap-1 px-4 py-2">
        <Tooltip content="Reset quiz">
          <span>
            <AlertDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={score.checked === 0}
                >
                  <IconReset />
                </Button>
              }
              confirmText="Reset"
              title="Reset quiz"
              description="Are you sure? All answers will be cleared."
              onConfirm={handleReset}
            />
          </span>
        </Tooltip>

        <p className="text-muted-foreground absolute top-1/2 left-1/2 m-auto block -translate-x-1/2 -translate-y-1/2 font-sans text-sm leading-normal font-light tracking-normal antialiased">
          {currentIndex + 1} / {questionsCount}
          {score.checked > 0 && (
            <span className="ml-2 text-xs">
              ({score.correct}/{score.checked} correct)
            </span>
          )}
        </p>

        <div />
      </div>

      <ProgressSlider
        className="mx-4"
        max={questionsCount}
        value={currentIndex}
        onChange={slidesApi.scrollToSlide}
        stepClasses={statuses}
      />
    </div>
  );
};

const QuizQuestionView = () => {
  const {
    questions,
    getShuffledOptions,
    selectSingle,
    toggleMulti,
    isOptionSelected,
    isChecked,
    slidesApi,
  } = useQuizContext();

  return (
    <div
      ref={slidesApi.scrollContainerRef}
      className="grow snap-y snap-mandatory overflow-y-auto scroll-smooth"
    >
      {questions.map((q, index) => {
        const checked = isChecked(q.id);

        let inputType: "radio" | "checkbox" = "radio";
        let optionsToRender: { text: string; isCorrect: boolean }[] = [];
        let handleSelect: (optionText: string) => void;

        if (q.type === "true-false") {
          inputType = "radio";
          optionsToRender = [
            { text: "True", isCorrect: q.answer === true },
            { text: "False", isCorrect: q.answer === false },
          ];
          handleSelect = (optionText) => selectSingle(q.id, optionText);
        } else {
          const correctCount = q.options.filter((o) => o.isCorrect).length;
          inputType = correctCount > 1 ? "checkbox" : "radio";
          optionsToRender = getShuffledOptions(q.id);
          handleSelect =
            inputType === "radio"
              ? (optionText) => selectSingle(q.id, optionText)
              : (optionText) => toggleMulti(q.id, optionText);
        }

        return (
          <div
            key={q.id}
            ref={slidesApi.getSlideRef(index)}
            className="flex h-full w-full snap-start snap-always items-start justify-center px-4 pb-6 pt-4"
          >
            <div className="w-full max-w-2xl space-y-6 m-auto">
              <Markdown content={q.question} variant="quiz" />
              <div className="space-y-2">
                {optionsToRender.map((option) => (
                  <QuizOption
                    key={option.text}
                    option={option}
                    isSelected={isOptionSelected(q.id, option.text)}
                    isChecked={checked}
                    inputType={inputType}
                    onClick={() => handleSelect(option.text)}
                  />
                ))}
              </div>
              {checked && q.explanation && (
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                  {q.explanation}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const QuizControls = () => {
  const { slidesApi } = useQuizContext();

  return (
    <div className="flex w-full items-center justify-between gap-1 p-4">
      <Tooltip
        content={
          <>
            Previous question{" "}
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

      <Tooltip
        content={
          <>
            Next question{" "}
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

const QuizKeyboardShortcuts = () => {
  const {
    currentQuestion,
    getShuffledOptions,
    selectSingle,
    toggleMulti,
    isChecked,
    slidesApi,
  } = useQuizContext();

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

      if (currentQuestion?.type === "choice") {
        const qId = currentQuestion.id;
        const options = getShuffledOptions(qId);
        const isMulti = currentQuestion.options.filter((o) => o.isCorrect).length > 1;

        const num = parseInt(e.key);
        if (num >= 1 && num <= options.length && !isChecked(qId)) {
          e.preventDefault();
          const optionText = options[num - 1].text;
          if (isMulti) {
            toggleMulti(qId, optionText);
          } else {
            selectSingle(qId, optionText);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [
    currentQuestion,
    getShuffledOptions,
    selectSingle,
    toggleMulti,
    isChecked,
    slidesApi,
  ]);

  return null;
};

export const Quiz = {
  Container: QuizContainer,
  Topbar: QuizTopbar,
  QuestionView: QuizQuestionView,
  Controls: QuizControls,
  KeyboardShortcuts: QuizKeyboardShortcuts,
};
