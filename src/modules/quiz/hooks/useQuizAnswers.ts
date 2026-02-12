import { useCallback, useMemo, useReducer } from "react";
import type { QuizQuestion } from "@/lib/types";

interface QuizAnswersState {
  selectedAnswers: Record<string, string>;
  checkedQuestions: Record<string, boolean>;
}

type QuizAnswersAction =
  | { type: "SELECT_ANSWER"; questionId: string; option: string }
  | { type: "CHECK_ANSWER"; questionId: string }
  | { type: "RESET" };

const initialState: QuizAnswersState = {
  selectedAnswers: {},
  checkedQuestions: {},
};

function quizAnswersReducer(
  state: QuizAnswersState,
  action: QuizAnswersAction
): QuizAnswersState {
  switch (action.type) {
    case "SELECT_ANSWER": {
      if (state.checkedQuestions[action.questionId]) {
        return state;
      }
      return {
        ...state,
        selectedAnswers: {
          ...state.selectedAnswers,
          [action.questionId]: action.option,
        },
      };
    }
    case "CHECK_ANSWER":
      return {
        ...state,
        checkedQuestions: {
          ...state.checkedQuestions,
          [action.questionId]: true,
        },
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useQuizAnswers() {
  const [state, dispatch] = useReducer(quizAnswersReducer, initialState);

  const selectAnswer = useCallback(
    (questionId: string, option: string) => {
      dispatch({ type: "SELECT_ANSWER", questionId, option });
    },
    []
  );

  const checkAnswer = useCallback((questionId: string) => {
    dispatch({ type: "CHECK_ANSWER", questionId });
  }, []);

  const isChecked = useCallback(
    (questionId: string): boolean => {
      return !!state.checkedQuestions[questionId];
    },
    [state.checkedQuestions]
  );

  const getSelectedAnswer = useCallback(
    (questionId: string): string | undefined => {
      return state.selectedAnswers[questionId];
    },
    [state.selectedAnswers]
  );

  const isAnswerCorrect = useCallback(
    (questionId: string, correctAnswer: string): boolean | undefined => {
      if (!state.checkedQuestions[questionId]) return undefined;
      return state.selectedAnswers[questionId] === correctAnswer;
    },
    [state.checkedQuestions, state.selectedAnswers]
  );

  const getScore = useCallback(
    (questions: QuizQuestion[]): { correct: number; total: number; checked: number } => {
      let correct = 0;
      let checked = 0;
      for (const q of questions) {
        if (state.checkedQuestions[q.id]) {
          checked++;
          if (state.selectedAnswers[q.id] === q.answer) {
            correct++;
          }
        }
      }
      return { correct, total: questions.length, checked };
    },
    [state.checkedQuestions, state.selectedAnswers]
  );

  const getStatuses = useCallback(
    (questions: QuizQuestion[]): Array<boolean | undefined> => {
      return questions.map((q) => {
        if (!state.checkedQuestions[q.id]) return undefined;
        return state.selectedAnswers[q.id] === q.answer;
      });
    },
    [state.checkedQuestions, state.selectedAnswers]
  );

  const resetAnswers = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const hasSelection = useCallback(
    (questionId: string): boolean => {
      return questionId in state.selectedAnswers;
    },
    [state.selectedAnswers]
  );

  return useMemo(
    () => ({
      selectedAnswers: state.selectedAnswers,
      checkedQuestions: state.checkedQuestions,
      selectAnswer,
      checkAnswer,
      isChecked,
      getSelectedAnswer,
      isAnswerCorrect,
      getScore,
      getStatuses,
      resetAnswers,
      hasSelection,
    }),
    [
      state.selectedAnswers,
      state.checkedQuestions,
      selectAnswer,
      checkAnswer,
      isChecked,
      getSelectedAnswer,
      isAnswerCorrect,
      getScore,
      getStatuses,
      resetAnswers,
      hasSelection,
    ]
  );
}
