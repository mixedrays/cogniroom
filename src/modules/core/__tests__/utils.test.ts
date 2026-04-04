import { describe, it, expect } from "vitest";
import {
  generateId,
  isLessonSectionCompleted,
  isLessonFullyCompleted,
  calculateProgress,
  getCourseMetadata,
} from "../utils";
import type { Course, Lesson } from "../types";

const baseCourse: Course = {
  id: "c1",
  title: "Test Course",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  source: "llm",
  topics: [],
};

const baseLesson: Lesson = {
  id: "l1",
  title: "Lesson 1",
};

describe("generateId", () => {
  it("returns a non-empty string", () => {
    expect(typeof generateId()).toBe("string");
    expect(generateId().length).toBeGreaterThan(0);
  });

  it("returns unique values on subsequent calls", () => {
    const ids = new Set(Array.from({ length: 100 }, generateId));
    expect(ids.size).toBe(100);
  });
});

describe("isLessonSectionCompleted", () => {
  it("returns false for all sections on a bare lesson", () => {
    expect(isLessonSectionCompleted(baseLesson, "theory")).toBe(false);
    expect(isLessonSectionCompleted(baseLesson, "flashcards")).toBe(false);
    expect(isLessonSectionCompleted(baseLesson, "quiz")).toBe(false);
    expect(isLessonSectionCompleted(baseLesson, "exercises")).toBe(false);
  });

  it("returns true for theory when theoryCompleted is true", () => {
    expect(
      isLessonSectionCompleted(
        { ...baseLesson, theoryCompleted: true },
        "theory"
      )
    ).toBe(true);
  });

  it("falls back to deprecated completed field for theory", () => {
    expect(
      isLessonSectionCompleted({ ...baseLesson, completed: true }, "theory")
    ).toBe(true);
  });

  it("theoryCompleted takes precedence over deprecated completed", () => {
    expect(
      isLessonSectionCompleted(
        { ...baseLesson, theoryCompleted: false, completed: true },
        "theory"
      )
    ).toBe(false);
  });

  it("returns true for flashcards when flashcardsCompleted is true", () => {
    expect(
      isLessonSectionCompleted(
        { ...baseLesson, flashcardsCompleted: true },
        "flashcards"
      )
    ).toBe(true);
  });

  it("returns true for quiz when quizCompleted is true", () => {
    expect(
      isLessonSectionCompleted({ ...baseLesson, quizCompleted: true }, "quiz")
    ).toBe(true);
  });

  it("returns true for exercises when exercisesCompleted is true", () => {
    expect(
      isLessonSectionCompleted(
        { ...baseLesson, exercisesCompleted: true },
        "exercises"
      )
    ).toBe(true);
  });
});

describe("isLessonFullyCompleted", () => {
  it("returns true when lesson has no content and no exercises", () => {
    expect(isLessonFullyCompleted(baseLesson)).toBe(true);
  });

  it("returns false when hasContent is true but theory not completed", () => {
    expect(isLessonFullyCompleted({ ...baseLesson, hasContent: true })).toBe(
      false
    );
  });

  it("returns false when hasExercises is true but exercises not completed", () => {
    expect(isLessonFullyCompleted({ ...baseLesson, hasExercises: true })).toBe(
      false
    );
  });

  it("returns true when both content and exercises are completed", () => {
    expect(
      isLessonFullyCompleted({
        ...baseLesson,
        hasContent: true,
        theoryCompleted: true,
        hasExercises: true,
        exercisesCompleted: true,
      })
    ).toBe(true);
  });

  it("returns false when only theory is completed but exercises are not", () => {
    expect(
      isLessonFullyCompleted({
        ...baseLesson,
        hasContent: true,
        theoryCompleted: true,
        hasExercises: true,
        exercisesCompleted: false,
      })
    ).toBe(false);
  });
});

describe("calculateProgress", () => {
  it("returns 0 for a course with no topics", () => {
    expect(calculateProgress(baseCourse)).toBe(0);
  });

  it("returns 0 for a course with no completed lessons", () => {
    const course: Course = {
      ...baseCourse,
      topics: [
        {
          id: "t1",
          title: "T1",
          lessons: [baseLesson, { ...baseLesson, id: "l2" }],
        },
      ],
    };
    expect(calculateProgress(course)).toBe(0);
  });

  it("returns 100 when all lessons are completed", () => {
    const course: Course = {
      ...baseCourse,
      topics: [
        {
          id: "t1",
          title: "T1",
          lessons: [
            { ...baseLesson, theoryCompleted: true },
            { ...baseLesson, id: "l2", theoryCompleted: true },
          ],
        },
      ],
    };
    expect(calculateProgress(course)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    const course: Course = {
      ...baseCourse,
      topics: [
        {
          id: "t1",
          title: "T1",
          lessons: [
            { ...baseLesson, theoryCompleted: true },
            { ...baseLesson, id: "l2" },
            { ...baseLesson, id: "l3" },
          ],
        },
      ],
    };
    expect(calculateProgress(course)).toBe(33);
  });

  it("counts deprecated completed field", () => {
    const course: Course = {
      ...baseCourse,
      topics: [
        {
          id: "t1",
          title: "T1",
          lessons: [{ ...baseLesson, completed: true }],
        },
      ],
    };
    expect(calculateProgress(course)).toBe(100);
  });
});

describe("getCourseMetadata", () => {
  it("returns correct metadata for an empty course", () => {
    const meta = getCourseMetadata(baseCourse);
    expect(meta).toMatchObject({
      id: "c1",
      title: "Test Course",
      topicCount: 0,
      lessonCount: 0,
      completedCount: 0,
      progress: 0,
    });
  });

  it("counts topics and lessons correctly", () => {
    const course: Course = {
      ...baseCourse,
      topics: [
        { id: "t1", title: "T1", lessons: [baseLesson] },
        {
          id: "t2",
          title: "T2",
          lessons: [
            { ...baseLesson, id: "l2", theoryCompleted: true },
            { ...baseLesson, id: "l3", theoryCompleted: true },
          ],
        },
      ],
    };
    const meta = getCourseMetadata(course);
    expect(meta.topicCount).toBe(2);
    expect(meta.lessonCount).toBe(3);
    expect(meta.completedCount).toBe(2);
    expect(meta.progress).toBe(67);
  });

  it("preserves course scalar fields", () => {
    const meta = getCourseMetadata(baseCourse);
    expect(meta.createdAt).toBe("2024-01-01");
    expect(meta.updatedAt).toBe("2024-01-01");
    expect(meta.source).toBe("llm");
  });
});
