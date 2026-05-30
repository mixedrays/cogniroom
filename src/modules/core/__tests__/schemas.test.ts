import { describe, it, expect } from "vitest";
import {
  courseCreateSchema,
  lessonCompletionUpdateSchema,
  lessonContentSchema,
  lessonSectionSchema,
  reviewDataSchema,
} from "../schemas";

describe("courseCreateSchema", () => {
  it("accepts a minimal course with only a title", () => {
    const result = courseCreateSchema.safeParse({ title: "My Course" });
    expect(result.success).toBe(true);
  });

  it("accepts a full course with topics and lessons", () => {
    const result = courseCreateSchema.safeParse({
      title: "My Course",
      description: "desc",
      source: "import",
      sourceUrl: "https://example.com",
      createdAt: "2024-01-01",
      topics: [
        {
          id: "t1",
          title: "Topic 1",
          lessons: [
            {
              id: "l1",
              title: "Lesson 1",
              progress: { theory: { completed: true, completedAt: "2024-01-02" } },
            },
            { title: "Lesson 2" },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing title", () => {
    expect(courseCreateSchema.safeParse({ topics: [] }).success).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(courseCreateSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("rejects an invalid source", () => {
    const result = courseCreateSchema.safeParse({
      title: "x",
      source: "wikipedia",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a topic without a title", () => {
    const result = courseCreateSchema.safeParse({
      title: "x",
      topics: [{ lessons: [] }],
    });
    expect(result.success).toBe(false);
  });

  it("strips unknown top-level keys", () => {
    const result = courseCreateSchema.parse({
      title: "x",
      id: "should-be-removed",
      updatedAt: "should-be-removed",
    });
    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("updatedAt");
  });
});

describe("lessonSectionSchema", () => {
  it("accepts every known section", () => {
    for (const section of ["theory", "flashcards", "quiz", "exercises"]) {
      expect(lessonSectionSchema.safeParse(section).success).toBe(true);
    }
  });

  it("rejects an unknown section", () => {
    expect(lessonSectionSchema.safeParse("notes").success).toBe(false);
  });
});

describe("lessonCompletionUpdateSchema", () => {
  it("accepts an empty object", () => {
    expect(lessonCompletionUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts completed + section", () => {
    const result = lessonCompletionUpdateSchema.safeParse({
      completed: false,
      section: "quiz",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid section", () => {
    expect(
      lessonCompletionUpdateSchema.safeParse({ section: "bogus" }).success
    ).toBe(false);
  });

  it("rejects a non-boolean completed", () => {
    expect(
      lessonCompletionUpdateSchema.safeParse({ completed: "yes" }).success
    ).toBe(false);
  });
});

describe("lessonContentSchema", () => {
  it("accepts non-empty content", () => {
    expect(lessonContentSchema.safeParse({ content: "hello" }).success).toBe(
      true
    );
  });

  it("rejects whitespace-only content", () => {
    expect(lessonContentSchema.safeParse({ content: "   " }).success).toBe(
      false
    );
  });

  it("rejects a missing or non-string content", () => {
    expect(lessonContentSchema.safeParse({}).success).toBe(false);
    expect(lessonContentSchema.safeParse({ content: 42 }).success).toBe(false);
  });
});

describe("reviewDataSchema", () => {
  const entry = {
    itemId: "card-1",
    repetitions: 2,
    easeFactor: 2.5,
    interval: 6,
    lastReviewedAt: "2024-01-01",
    nextReviewAt: "2024-01-07",
  };

  it("accepts valid review data", () => {
    const result = reviewDataSchema.safeParse({
      lessonId: "l1",
      entries: [entry],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty lessonId and entries", () => {
    const result = reviewDataSchema.safeParse({ lessonId: "", entries: [] });
    expect(result.success).toBe(true);
  });

  it("rejects an entry missing numeric fields", () => {
    const result = reviewDataSchema.safeParse({
      lessonId: "l1",
      entries: [{ ...entry, easeFactor: "high" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing entries array", () => {
    expect(reviewDataSchema.safeParse({ lessonId: "l1" }).success).toBe(false);
  });
});
