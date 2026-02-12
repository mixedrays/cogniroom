import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useQuiz } from "../useQuiz";
import type { QuizQuestion } from "@/lib/types";

const questions: QuizQuestion[] = [
  { id: "q1", question: "What is 2+2?", answer: "4", options: ["3", "5", "6"] },
  { id: "q2", question: "What is 3+3?", answer: "6", options: ["5", "7", "8"] },
  { id: "q3", question: "What is 4+4?", answer: "8", options: ["7", "9", "10"] },
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
    expect(options).toContain("4");
    expect(options).toContain("3");
    expect(options).toContain("5");
    expect(options).toContain("6");
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
    // Options are reshuffled — they still contain all the same values
    const optionsAfter = result.current.getShuffledOptions("q1");
    expect(optionsAfter).toHaveLength(4);
    expect(optionsAfter.sort()).toEqual(optionsBefore.sort());
  });
});
