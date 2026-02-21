import { useCallback, useMemo, useReducer } from "react";
import type { QuizQuestion, ChoiceQuizQuestion } from "@/lib/types";

type ShuffledOption = { text: string; isCorrect: boolean };

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildShuffledOptionsMap(
  questions: QuizQuestion[]
): Record<string, ShuffledOption[]> {
  const map: Record<string, ShuffledOption[]> = {};
  for (const q of questions) {
    if (q.type === "choice") {
      map[q.id] = shuffleArray((q as ChoiceQuizQuestion).options);
    }
  }
  return map;
}

interface QuizState {
  currentIndex: number;
  shuffledOptionsMap: Record<string, ShuffledOption[]>;
}

type QuizAction =
  | { type: "SET_CURRENT_INDEX"; index: number }
  | { type: "RESET"; questions: QuizQuestion[] };

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "SET_CURRENT_INDEX":
      return { ...state, currentIndex: action.index };
    case "RESET":
      return {
        currentIndex: 0,
        shuffledOptionsMap: buildShuffledOptionsMap(action.questions),
      };
    default:
      return state;
  }
}

export function useQuiz(questions: QuizQuestion[]) {
  const [state, dispatch] = useReducer(quizReducer, questions, (qs) => ({
    currentIndex: 0,
    shuffledOptionsMap: buildShuffledOptionsMap(qs),
  }));

  const currentQuestion = questions[state.currentIndex];
  const questionsCount = questions.length;

  const getShuffledOptions = useCallback(
    (id: string): ShuffledOption[] => state.shuffledOptionsMap[id] ?? [],
    [state.shuffledOptionsMap]
  );

  const setCurrentIndex = useCallback((index: number) => {
    dispatch({ type: "SET_CURRENT_INDEX", index });
  }, []);

  const resetQuiz = useCallback(() => {
    dispatch({ type: "RESET", questions });
  }, [questions]);

  return useMemo(
    () => ({
      currentIndex: state.currentIndex,
      currentQuestion,
      questionsCount,
      questions,
      getShuffledOptions,
      setCurrentIndex,
      resetQuiz,
    }),
    [
      state.currentIndex,
      currentQuestion,
      questionsCount,
      questions,
      getShuffledOptions,
      setCurrentIndex,
      resetQuiz,
    ]
  );
}
