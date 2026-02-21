import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useQuiz } from "../useQuiz";
import type { ChoiceQuizQuestion } from "@/lib/types";

const questions: ChoiceQuizQuestion[] = [
  {
    id: "q1",
    type: "choice",
    question: "What is 2+2?",
    options: [
      { text: "3", isCorrect: false },
      { text: "4", isCorrect: true },
      { text: "5", isCorrect: false },
      { text: "6", isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "q2",
    type: "choice",
    question: "What is 3+3?",
    options: [
      { text: "5", isCorrect: false },
      { text: "6", isCorrect: true },
      { text: "7", isCorrect: false },
      { text: "8", isCorrect: false },
    ],
    difficulty: "easy",
  },
  {
    id: "q3",
    type: "choice",
    question: "What is 4+4?",
    options: [
      { text: "7", isCorrect: false },
      { text: "8", isCorrect: true },
      { text: "9", isCorrect: false },
      { text: "10", isCorrect: false },
    ],
    difficulty: "easy",
  },
];

describe("useQuiz", () => {
  it("initializes with first question and correct count", () => {
    const { result } = renderHook(() => useQuiz(questions));

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.questionsCount).toBe(3);
    expect(result.current.currentQuestion).toBe(questions[0]);
  });

  it("navigates to a specific index", () => {
    const { result } = renderHook(() => useQuiz(questions));

    act(() => {
      result.current.setCurrentIndex(2);
    });

    expect(result.current.currentIndex).toBe(2);
    expect(result.current.currentQuestion).toBe(questions[2]);
  });

  it("builds shuffled options that include the correct answer", () => {
    const { result } = renderHook(() => useQuiz(questions));

    const options = result.current.getShuffledOptions("q1");
    expect(options).toHaveLength(4);
    expect(options.some((o) => o.text === "4" && o.isCorrect)).toBe(true);
    expect(options.some((o) => o.text === "3")).toBe(true);
    expect(options.some((o) => o.text === "5")).toBe(true);
    expect(options.some((o) => o.text === "6")).toBe(true);
  });

  it("resets to index 0 and reshuffles options", () => {
    const { result } = renderHook(() => useQuiz(questions));

    const optionsBefore = result.current.getShuffledOptions("q1");

    act(() => {
      result.current.setCurrentIndex(2);
    });

    act(() => {
      result.current.resetQuiz();
    });

    expect(result.current.currentIndex).toBe(0);
    const optionsAfter = result.current.getShuffledOptions("q1");
    expect(optionsAfter).toHaveLength(4);
    expect(optionsAfter.map((o) => o.text).sort()).toEqual(
      optionsBefore.map((o) => o.text).sort()
    );
  });
});
