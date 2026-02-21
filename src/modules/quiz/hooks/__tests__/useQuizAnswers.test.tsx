import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useQuizAnswers } from "../useQuizAnswers";
import type { ChoiceQuizQuestion, TrueFalseQuizQuestion } from "@/lib/types";

const singleChoiceQuestion: ChoiceQuizQuestion = {
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
};

const multiChoiceQuestion: ChoiceQuizQuestion = {
  id: "q2",
  type: "choice",
  question: "Which are even numbers?",
  options: [
    { text: "2", isCorrect: true },
    { text: "3", isCorrect: false },
    { text: "4", isCorrect: true },
    { text: "5", isCorrect: false },
  ],
  difficulty: "medium",
};

const trueFalseQuestion: TrueFalseQuizQuestion = {
  id: "q3",
  type: "true-false",
  question: "Is the sky blue?",
  answer: true,
  difficulty: "easy",
};

describe("useQuizAnswers", () => {
  it("starts with no selections", () => {
    const { result } = renderHook(() => useQuizAnswers());

    expect(result.current.hasSelection("q1")).toBe(false);
    expect(result.current.isOptionSelected("q1", "4")).toBe(false);
    expect(result.current.isChecked("q1")).toBe(false);
  });

  it("auto-checks on selectSingle", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectSingle("q1", "4");
    });

    expect(result.current.isChecked("q1")).toBe(true);
    expect(result.current.isOptionSelected("q1", "4")).toBe(true);
    expect(result.current.hasSelection("q1")).toBe(true);
  });

  it("prevents changing answer after check (selectSingle is idempotent once checked)", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectSingle("q1", "4");
    });
    act(() => {
      result.current.selectSingle("q1", "3");
    });

    expect(result.current.isOptionSelected("q1", "4")).toBe(true);
    expect(result.current.isOptionSelected("q1", "3")).toBe(false);
  });

  it("auto-checks on toggleMulti", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.toggleMulti("q2", "2");
    });

    expect(result.current.isChecked("q2")).toBe(true);
    expect(result.current.isOptionSelected("q2", "2")).toBe(true);
  });

  it("scores correctly for single-choice question", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectSingle("q1", "4");
    });

    const score = result.current.getScore([singleChoiceQuestion]);
    expect(score.correct).toBe(1);
    expect(score.checked).toBe(1);
    expect(score.total).toBe(1);
  });

  it("scores incorrectly for wrong single-choice answer", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectSingle("q1", "3");
    });

    const score = result.current.getScore([singleChoiceQuestion]);
    expect(score.correct).toBe(0);
    expect(score.checked).toBe(1);
  });

  it("scores correctly for multi-choice when all correct options selected", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.toggleMulti("q2", "2");
    });
    act(() => {
      result.current.toggleMulti("q2", "4");
    });

    const score = result.current.getScore([multiChoiceQuestion]);
    expect(score.correct).toBe(1);
  });

  it("scores incorrectly for multi-choice with partial selection", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.toggleMulti("q2", "2");
    });

    const score = result.current.getScore([multiChoiceQuestion]);
    expect(score.correct).toBe(0);
  });

  it("scores correctly for true-false question", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectSingle("q3", "true");
    });

    const score = result.current.getScore([trueFalseQuestion]);
    expect(score.correct).toBe(1);
  });

  it("scores incorrectly for wrong true-false answer", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectSingle("q3", "false");
    });

    const score = result.current.getScore([trueFalseQuestion]);
    expect(score.correct).toBe(0);
  });

  it("returns statuses array", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectSingle("q1", "4");
    });

    const statuses = result.current.getStatuses([singleChoiceQuestion, trueFalseQuestion]);
    expect(statuses[0]).toBe("bg-green-500!");
    expect(statuses[1]).toBeUndefined();
  });

  it("resets all state", () => {
    const { result } = renderHook(() => useQuizAnswers());

    act(() => {
      result.current.selectSingle("q1", "4");
    });
    act(() => {
      result.current.resetAnswers();
    });

    expect(result.current.hasSelection("q1")).toBe(false);
    expect(result.current.isChecked("q1")).toBe(false);
    expect(result.current.getScore([singleChoiceQuestion]).checked).toBe(0);
  });
});
