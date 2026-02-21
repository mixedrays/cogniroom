import { useCallback, useMemo, useReducer } from "react";
import type { QuizQuestion } from "@/lib/types";

interface QuizAnswersState {
  selections: Record<string, string[]>;
  checkedQuestions: Record<string, boolean>;
}

type QuizAnswersAction =
  | { type: "SELECT_SINGLE"; questionId: string; option: string }
  | { type: "TOGGLE_MULTI"; questionId: string; option: string }
  | { type: "RESET" };

const initialState: QuizAnswersState = {
  selections: {},
  checkedQuestions: {},
};

function quizAnswersReducer(
  state: QuizAnswersState,
  action: QuizAnswersAction
): QuizAnswersState {
  switch (action.type) {
    case "SELECT_SINGLE": {
      if (state.checkedQuestions[action.questionId]) return state;
      return {
        selections: { ...state.selections, [action.questionId]: [action.option] },
        checkedQuestions: { ...state.checkedQuestions, [action.questionId]: true },
      };
    }
    case "TOGGLE_MULTI": {
      const current = state.selections[action.questionId] ?? [];
      const updated = current.includes(action.option)
        ? current.filter((o) => o !== action.option)
        : [...current, action.option];
      return {
        selections: { ...state.selections, [action.questionId]: updated },
        checkedQuestions: { ...state.checkedQuestions, [action.questionId]: true },
      };
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

function isQuestionCorrect(q: QuizQuestion, selected: string[]): boolean {
  if (q.type === "true-false") {
    return selected[0] === String(q.answer);
  }
  const correctTexts = q.options
    .filter((o) => o.isCorrect)
    .map((o) => o.text)
    .sort();
  const selectedSorted = [...selected].sort();
  return (
    correctTexts.length === selectedSorted.length &&
    correctTexts.every((v, i) => v === selectedSorted[i])
  );
}

export function useQuizAnswers() {
  const [state, dispatch] = useReducer(quizAnswersReducer, initialState);

  const selectSingle = useCallback((questionId: string, option: string) => {
    dispatch({ type: "SELECT_SINGLE", questionId, option });
  }, []);

  const toggleMulti = useCallback((questionId: string, option: string) => {
    dispatch({ type: "TOGGLE_MULTI", questionId, option });
  }, []);

  const isChecked = useCallback(
    (questionId: string): boolean => !!state.checkedQuestions[questionId],
    [state.checkedQuestions]
  );

  const isOptionSelected = useCallback(
    (questionId: string, optionText: string): boolean =>
      state.selections[questionId]?.includes(optionText) ?? false,
    [state.selections]
  );

  const hasSelection = useCallback(
    (questionId: string): boolean =>
      (state.selections[questionId]?.length ?? 0) > 0,
    [state.selections]
  );

  const getScore = useCallback(
    (questions: QuizQuestion[]): { correct: number; total: number; checked: number } => {
      let correct = 0;
      let checked = 0;
      for (const q of questions) {
        if (state.checkedQuestions[q.id]) {
          checked++;
          if (isQuestionCorrect(q, state.selections[q.id] ?? [])) {
            correct++;
          }
        }
      }
      return { correct, total: questions.length, checked };
    },
    [state.checkedQuestions, state.selections]
  );

  const getStatuses = useCallback(
    (questions: QuizQuestion[]): Array<string | undefined> =>
      questions.map((q) => {
        if (!state.checkedQuestions[q.id]) return undefined;
        return isQuestionCorrect(q, state.selections[q.id] ?? [])
          ? "bg-green-500!"
          : "bg-red-500!";
      }),
    [state.checkedQuestions, state.selections]
  );

  const resetAnswers = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return useMemo(
    () => ({
      selections: state.selections,
      checkedQuestions: state.checkedQuestions,
      selectSingle,
      toggleMulti,
      isChecked,
      isOptionSelected,
      hasSelection,
      getScore,
      getStatuses,
      resetAnswers,
    }),
    [
      state.selections,
      state.checkedQuestions,
      selectSingle,
      toggleMulti,
      isChecked,
      isOptionSelected,
      hasSelection,
      getScore,
      getStatuses,
      resetAnswers,
    ]
  );
}
