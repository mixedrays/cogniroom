import { describe, it, expect } from "vitest";
import {
  generateId,
  isLessonSectionCompleted,
  getLessonSectionCompletedAt,
  setLessonSectionCompletion,
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

function withProgress(
  overrides: Partial<Lesson>,
  progress: NonNullable<Lesson["progress"]>
): Lesson {
  return { ...baseLesson, ...overrides, progress };
}

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

  it("reads completion from the progress map per section", () => {
    expect(
      isLessonSectionCompleted(
        withProgress({}, { theory: { completed: true } }),
        "theory"
      )
    ).toBe(true);
    expect(
      isLessonSectionCompleted(
        withProgress({}, { flashcards: { completed: true } }),
        "flashcards"
      )
    ).toBe(true);
    expect(
      isLessonSectionCompleted(
        withProgress({}, { quiz: { completed: true } }),
        "quiz"
      )
    ).toBe(true);
    expect(
      isLessonSectionCompleted(
        withProgress({}, { exercises: { completed: true } }),
        "exercises"
      )
    ).toBe(true);
  });

  it("returns false when a section is explicitly marked not completed", () => {
    expect(
      isLessonSectionCompleted(
        withProgress({}, { theory: { completed: false } }),
        "theory"
      )
    ).toBe(false);
  });
});

describe("getLessonSectionCompletedAt", () => {
  it("returns the recorded timestamp for a completed section", () => {
    const lesson = withProgress(
      {},
      { quiz: { completed: true, completedAt: "2024-02-02" } }
    );
    expect(getLessonSectionCompletedAt(lesson, "quiz")).toBe("2024-02-02");
  });

  it("returns undefined when the section is absent", () => {
    expect(getLessonSectionCompletedAt(baseLesson, "quiz")).toBeUndefined();
  });
});

describe("setLessonSectionCompletion", () => {
  it("marks a section completed with a timestamp", () => {
    const lesson: Lesson = { ...baseLesson };
    setLessonSectionCompletion(lesson, "theory", true, "2024-03-03");
    expect(lesson.progress?.theory).toEqual({
      completed: true,
      completedAt: "2024-03-03",
    });
  });

  it("omits the timestamp when none is provided", () => {
    const lesson: Lesson = { ...baseLesson };
    setLessonSectionCompletion(lesson, "flashcards", true);
    expect(lesson.progress?.flashcards).toEqual({ completed: true });
  });

  it("clears the timestamp when marking not completed", () => {
    const lesson = withProgress(
      {},
      { exercises: { completed: true, completedAt: "2024-03-03" } }
    );
    setLessonSectionCompletion(lesson, "exercises", false);
    expect(lesson.progress?.exercises).toEqual({ completed: false });
  });

  it("does not affect other sections", () => {
    const lesson = withProgress({}, { theory: { completed: true } });
    setLessonSectionCompletion(lesson, "quiz", true);
    expect(lesson.progress?.theory).toEqual({ completed: true });
    expect(lesson.progress?.quiz).toEqual({ completed: true });
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
      isLessonFullyCompleted(
        withProgress(
          { hasContent: true, hasExercises: true },
          { theory: { completed: true }, exercises: { completed: true } }
        )
      )
    ).toBe(true);
  });

  it("returns false when only theory is completed but exercises are not", () => {
    expect(
      isLessonFullyCompleted(
        withProgress(
          { hasContent: true, hasExercises: true },
          { theory: { completed: true }, exercises: { completed: false } }
        )
      )
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

  it("returns 100 when all lessons have theory completed", () => {
    const course: Course = {
      ...baseCourse,
      topics: [
        {
          id: "t1",
          title: "T1",
          lessons: [
            withProgress({}, { theory: { completed: true } }),
            withProgress({ id: "l2" }, { theory: { completed: true } }),
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
            withProgress({}, { theory: { completed: true } }),
            { ...baseLesson, id: "l2" },
            { ...baseLesson, id: "l3" },
          ],
        },
      ],
    };
    expect(calculateProgress(course)).toBe(33);
  });

  it("only counts theory completion toward progress", () => {
    const course: Course = {
      ...baseCourse,
      topics: [
        {
          id: "t1",
          title: "T1",
          lessons: [withProgress({}, { quiz: { completed: true } })],
        },
      ],
    };
    expect(calculateProgress(course)).toBe(0);
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
            withProgress({ id: "l2" }, { theory: { completed: true } }),
            withProgress({ id: "l3" }, { theory: { completed: true } }),
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
