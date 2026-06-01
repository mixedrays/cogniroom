import { describe, it, expect, vi } from "vitest";

vi.mock("@modules/content-formats", () => ({
  // Distinct, type-derived extension so each path assertion is unambiguous.
  getFormatAdapter: (type: string) => ({ extension: `.${type}` }),
}));

import { storagePaths } from "../storagePaths";

describe("storagePaths", () => {
  it("builds course directory and file paths", () => {
    expect(storagePaths.courseDir("c1")).toBe("courses/c1");
    expect(storagePaths.course("c1")).toBe("courses/c1/course.course");
  });

  it("builds lesson content paths under the course/lesson tree", () => {
    expect(storagePaths.lesson("c1", "l1")).toBe(
      "courses/c1/lessons/l1/lesson.md"
    );
    expect(storagePaths.exercise("c1", "l1")).toBe(
      "courses/c1/lessons/l1/exercise.md"
    );
    expect(storagePaths.reviews("c1", "l1")).toBe(
      "courses/c1/lessons/l1/reviews.json"
    );
  });

  it("uses the format adapter extension for flashcards and quiz", () => {
    expect(storagePaths.flashcards("c1", "l1")).toBe(
      "courses/c1/lessons/l1/flashcards.flashcards"
    );
    expect(storagePaths.quiz("c1", "l1")).toBe(
      "courses/c1/lessons/l1/quiz.quiz"
    );
  });

  it("builds deck directory and file paths", () => {
    expect(storagePaths.deckDir("d1")).toBe("decks/d1");
    expect(storagePaths.deck("d1")).toBe("decks/d1/deck.json");
    expect(storagePaths.deckReviews("d1")).toBe("decks/d1/reviews.json");
  });

  it("uses the format adapter extension for deck flashcards and quiz", () => {
    expect(storagePaths.deckFlashcards("d1")).toBe(
      "decks/d1/flashcards.flashcards"
    );
    expect(storagePaths.deckQuiz("d1")).toBe("decks/d1/quiz.quiz");
  });
});
