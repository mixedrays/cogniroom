import React, { createContext, useContext, useCallback } from "react";
import {
  Undo as IconReset,
  ArrowLeft as IconPrev,
  ArrowRight as IconNext,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { AlertDialog } from "@/components/AlertDialog";
import { Slider as ProgressSlider } from "@/components/Slider";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/types";
import { useSlidesApi } from "@/modules/flashcards/common/components/CarouselSlider";
import { useQuiz } from "../hooks/useQuiz";
import { useQuizAnswers } from "../hooks/useQuizAnswers";
import { useQuizKeyboardShortcuts } from "../hooks/useQuizKeyboardShortcuts";
import { QuizOptionRadio } from "./QuizOptionRadio";
import { QuizOptionCheckbox } from "./QuizOptionCheckbox";
import { QuizComplete } from "./QuizComplete";
import { Markdown } from "@/modules/markdown";

type QuizContextValue = ReturnType<typeof useQuiz> &
  ReturnType<typeof useQuizAnswers> & {
    slidesApi: ReturnType<typeof useSlidesApi>;
    isSessionComplete: boolean;
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

  const isSessionComplete =
    quizHook.questionsCount > 0 &&
    answersHook.isChecked(quizHook.questions[quizHook.questionsCount - 1].id);

  return (
    <QuizContext.Provider
      value={{ ...quizHook, ...answersHook, slidesApi, isSessionComplete }}
    >
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
    isSessionComplete,
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

  if (isSessionComplete) {
    return null;
  }

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
    questionsCount,
    getShuffledOptions,
    selectSingle,
    toggleMulti,
    checkMulti,
    isOptionSelected,
    isChecked,
    hasSelection,
    getScore,
    isSessionComplete,
    resetQuiz,
    resetAnswers,
    slidesApi,
  } = useQuizContext();

  const score = getScore(questions);

  const handleReset = useCallback(() => {
    resetQuiz();
    resetAnswers();
    slidesApi.scrollToSlide(0);
  }, [resetQuiz, resetAnswers, slidesApi]);

  if (isSessionComplete) {
    return (
      <div className="grow overflow-hidden">
        <QuizComplete
          stats={{
            correct: score.correct,
            incorrect: score.checked - score.correct,
            unanswered: questionsCount - score.checked,
          }}
          onReset={handleReset}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line react-hooks/refs
    <div ref={slidesApi.scrollContainerRef} className="grow overflow-hidden">
      <div className="flex h-full">
        {questions.map((q) => {
          const checked = isChecked(q.id);

          let inputType: "radio" | "checkbox" = "radio";
          let optionsToRender: { text: string; isCorrect: boolean }[] = [];
          let handleSelect: (optionText: string) => void;

          const scrollToNextDelayed = () => {
            if (!slidesApi.isLastSlide) {
              // commented for now
              // setTimeout(() => slidesApi.scrollToNext(), 500);
            }
          };

          if (q.type === "true-false") {
            inputType = "radio";
            optionsToRender = [
              { text: "True", isCorrect: q.answer === true },
              { text: "False", isCorrect: q.answer === false },
            ];
            handleSelect = (optionText) => {
              selectSingle(q.id, optionText);
              scrollToNextDelayed();
            };
          } else {
            const correctCount = q.options.filter((o) => o.isCorrect).length;
            inputType = correctCount > 1 ? "checkbox" : "radio";
            optionsToRender = getShuffledOptions(q.id);
            handleSelect =
              inputType === "radio"
                ? (optionText) => {
                    selectSingle(q.id, optionText);
                    scrollToNextDelayed();
                  }
                : (optionText) => toggleMulti(q.id, optionText);
          }

          return (
            <div
              key={q.id}
              className="flex items-center h-full min-h-0 w-full shrink-0 grow-0 basis-full justify-center overflow-y-auto px-4 pb-6 pt-4"
            >
              <div className="w-full max-w-2xl space-y-6">
                <Markdown content={q.question} variant="quiz" />

                <div className="space-y-2">
                  {optionsToRender.map((option, idx) =>
                    inputType === "checkbox" ? (
                      <QuizOptionCheckbox
                        key={option.text}
                        option={option}
                        isSelected={isOptionSelected(q.id, option.text)}
                        isChecked={checked}
                        onClick={() => handleSelect(option.text)}
                        shortcutKey={idx + 1}
                      />
                    ) : (
                      <QuizOptionRadio
                        key={option.text}
                        option={option}
                        isSelected={isOptionSelected(q.id, option.text)}
                        isChecked={checked}
                        onClick={() => handleSelect(option.text)}
                        shortcutKey={idx + 1}
                      />
                    )
                  )}
                </div>

                {inputType === "checkbox" && (
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!hasSelection(q.id) || checked}
                    onClick={() => {
                      checkMulti(q.id);
                      scrollToNextDelayed();
                    }}
                  >
                    Check answers
                  </Button>
                )}

                {q.explanation && (
                  <div
                    className={cn(
                      "text-sm invisible text-muted-foreground p-3 bg-muted/50 rounded-md",
                      checked && "visible"
                    )}
                  >
                    <Markdown
                      content={q.explanation}
                      className="text-sm text-muted-foreground"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const QuizControls = () => {
  const { isSessionComplete, slidesApi } = useQuizContext();

  if (isSessionComplete) return null;

  return (
    <div className="flex w-full items-center justify-between gap-1 p-4">
      <Tooltip
        content={
          <>
            Previous question <Kbd>J</Kbd>
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
            Next question <Kbd>K</Kbd>
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
    checkMulti,
    isChecked,
    hasSelection,
    slidesApi,
  } = useQuizContext();

  useQuizKeyboardShortcuts({
    currentQuestion,
    getShuffledOptions,
    selectSingle,
    toggleMulti,
    checkMulti,
    isChecked,
    hasSelection,
    slidesApi,
  });

  return null;
};

export const Quiz = {
  Container: QuizContainer,
  Topbar: QuizTopbar,
  QuestionView: QuizQuestionView,
  Controls: QuizControls,
  KeyboardShortcuts: QuizKeyboardShortcuts,
};
