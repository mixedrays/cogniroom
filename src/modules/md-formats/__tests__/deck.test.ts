import { describe, it, expect } from "vitest";
import { deckToShareMd, shareMdToDeck } from "../deck";
import type { FlashcardsContent, QuizContent } from "@modules/core";

const flashcards: FlashcardsContent = {
  version: 2,
  flashcards: [
    {
      id: "card-1",
      question: "What is a closure?",
      answer: "A function bundled with its lexical scope.",
      difficulty: "easy",
      hint: "Think scope.",
    },
  ],
};

const quiz: QuizContent = {
  version: 2,
  quizQuestions: [
    {
      id: "q-1",
      type: "choice",
      question: "What is 2 + 2?",
      difficulty: "easy",
      options: [
        { text: "4", isCorrect: true },
        { text: "3", isCorrect: false },
      ],
    },
  ],
};

describe("deckToShareMd / shareMdToDeck round-trip", () => {
  it("round-trips a flashcards deck with description", () => {
    const md = deckToShareMd({
      title: "TS Essentials",
      description: "Core concepts",
      kind: "flashcards",
      content: flashcards,
    });
    const parsed = shareMdToDeck(md);
    expect(parsed.title).toBe("TS Essentials");
    expect(parsed.description).toBe("Core concepts");
    expect(parsed.kind).toBe("flashcards");
    expect(parsed.content).toEqual(flashcards);
  });

  it("round-trips a quiz deck without description", () => {
    const md = deckToShareMd({
      title: "Math quiz",
      kind: "quiz",
      content: quiz,
    });
    const parsed = shareMdToDeck(md);
    expect(parsed.title).toBe("Math quiz");
    expect(parsed.description).toBeUndefined();
    expect(parsed.kind).toBe("quiz");
    expect(parsed.content).toEqual(quiz);
  });

  it("throws when the kind header is missing", () => {
    expect(() => shareMdToDeck("just some pasted text")).toThrow(/kind/);
  });
});
