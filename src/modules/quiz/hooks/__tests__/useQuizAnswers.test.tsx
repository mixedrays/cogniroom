import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useQuizAnswers } from "../useQuizAnswers";
import type { QuizQuestion } from "@/lib/types";

const questions: QuizQuestion[] = [
  { id: "q1", question: "What is 2+2?", answer: "4", options: ["3", "5", "6"] },
  { id: "q2", question: "What is 3+3?", answer: "6", options: ["5", "7", "8"] },
];

describe("useQuizAnswers", () => {
  it("starts with no selections", () => {
    const { result } = renderHook(() => useQuizAnswers());

    expect(result.current.hasSelection("q1")).toBe(false);
    expect(result.current.getSelectedAnswer("q1")).toBeUndefined();
    expect(result.current.isChecked("q1")).toBe(false);
  });

  it("selects an answer", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectAnswer("q1", "4");
    });

    expect(result.current.hasSelection("q1")).toBe(true);
    expect(result.current.getSelectedAnswer("q1")).toBe("4");
  });

  it("prevents changing answer after check", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectAnswer("q1", "4");
    });
    act(() => {
      result.current.checkAnswer("q1");
    });
    act(() => {
      result.current.selectAnswer("q1", "3");
    });

    expect(result.current.getSelectedAnswer("q1")).toBe("4");
  });

  it("reports correct answer", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectAnswer("q1", "4");
    });
    act(() => {
      result.current.checkAnswer("q1");
    });

    expect(result.current.isAnswerCorrect("q1", "4")).toBe(true);
  });

  it("reports incorrect answer", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectAnswer("q1", "3");
    });
    act(() => {
      result.current.checkAnswer("q1");
    });

    expect(result.current.isAnswerCorrect("q1", "4")).toBe(false);
  });

  it("returns undefined for unchecked question", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectAnswer("q1", "4");
    });

    expect(result.current.isAnswerCorrect("q1", "4")).toBeUndefined();
  });

  it("calculates score correctly", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectAnswer("q1", "4");
      result.current.selectAnswer("q2", "5");
    });
    act(() => {
      result.current.checkAnswer("q1");
      result.current.checkAnswer("q2");
    });

    const score = result.current.getScore(questions);
    expect(score.correct).toBe(1);
    expect(score.checked).toBe(2);
    expect(score.total).toBe(2);
  });

  it("returns statuses array", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectAnswer("q1", "4");
    });
    act(() => {
      result.current.checkAnswer("q1");
    });

    const statuses = result.current.getStatuses(questions);
    expect(statuses).toEqual([true, undefined]);
  });

  it("resets all state", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectAnswer("q1", "4");
    });
    act(() => {
      result.current.checkAnswer("q1");
    });
    act(() => {
      result.current.resetAnswers();
    });

    expect(result.current.hasSelection("q1")).toBe(false);
    expect(result.current.isChecked("q1")).toBe(false);
    expect(result.current.getScore(questions).checked).toBe(0);
  });
});
