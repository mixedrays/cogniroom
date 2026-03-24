import { useEffect } from "react";
import type { QuizQuestion } from "@/lib/types";
import type { useSlidesApi } from "@/modules/flashcards/common/components/CarouselSlider";

interface UseQuizKeyboardShortcutsParams {
  currentQuestion: QuizQuestion | undefined;
  getShuffledOptions: (questionId: string) => { text: string; isCorrect: boolean }[];
  selectSingle: (questionId: string, option: string) => void;
  toggleMulti: (questionId: string, option: string) => void;
  checkMulti: (questionId: string) => void;
  isChecked: (questionId: string) => boolean;
  hasSelection: (questionId: string) => boolean;
  slidesApi: ReturnType<typeof useSlidesApi>;
}

export function useQuizKeyboardShortcuts({
  currentQuestion,
  getShuffledOptions,
  selectSingle,
  toggleMulti,
  checkMulti,
  isChecked,
  hasSelection,
  slidesApi,
}: UseQuizKeyboardShortcutsParams) {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        slidesApi.scrollToNext();
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        slidesApi.scrollToPrev();
      }

      if (currentQuestion?.type === "true-false") {
        const qId = currentQuestion.id;
        const num = parseInt(e.key);
        if ((num === 1 || num === 2) && !isChecked(qId)) {
          e.preventDefault();
          selectSingle(qId, num === 1 ? "True" : "False");
        }
      }

      if (currentQuestion?.type === "choice") {
        const qId = currentQuestion.id;
        const options = getShuffledOptions(qId);
        const isMulti =
          currentQuestion.options.filter((o) => o.isCorrect).length > 1;

        if (e.key === "Enter" && isMulti && !isChecked(qId) && hasSelection(qId)) {
          e.preventDefault();
          checkMulti(qId);
        }

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
    checkMulti,
    isChecked,
    hasSelection,
    slidesApi,
  ]);
}
