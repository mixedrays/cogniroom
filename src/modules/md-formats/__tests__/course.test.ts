import { describe, it, expect } from "vitest";
import { courseToMd, mdToCourse } from "../course";
import type { Course } from "@modules/core";

const course: Course = {
  id: "c1",
  title: "Test Course",
  description: "A course",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
  source: "llm",
  topics: [
    {
      id: "t1",
      title: "Topic 1",
      description: "First topic",
      lessons: [
        {
          id: "l1",
          title: "Lesson 1",
          description: "Intro",
          progress: {
            theory: {
              completed: true,
              completedAt: "2024-01-03T00:00:00.000Z",
            },
            quiz: { completed: false },
          },
        },
        { id: "l2", title: "Lesson 2" },
      ],
    },
  ],
};

describe("course md round-trip", () => {
  it("preserves the progress map through serialize → deserialize", () => {
    const restored = mdToCourse(courseToMd(course));
    expect(restored).toEqual(course);
  });

  it("omits progress entirely for lessons with no completion state", () => {
    const md = courseToMd(course);
    const restored = mdToCourse(md);
    expect(restored.topics[0].lessons[1].progress).toBeUndefined();
  });

  it("writes flat per-section frontmatter keys", () => {
    const md = courseToMd(course);
    expect(md).toContain("theoryCompleted: true");
    expect(md).toContain("theoryCompletedAt: 2024-01-03T00:00:00.000Z");
    expect(md).toContain("quizCompleted: false");
  });
});

describe("legacy completion migration on read", () => {
  function buildMd(lessonFrontmatter: string): string {
    return [
      "---",
      "id: c1",
      "title: Legacy Course",
      "createdAt: 2024-01-01",
      "updatedAt: 2024-01-01",
      "source: llm",
      "---",
      "",
      "## Topic 1",
      "",
      "---",
      "id: t1",
      "---",
      "",
      "### Lesson 1",
      "",
      "---",
      "id: l1",
      lessonFrontmatter,
      "---",
      "",
    ].join("\n");
  }

  it("maps legacy flat section fields into the progress map", () => {
    const restored = mdToCourse(
      buildMd(
        [
          "theoryCompleted: true",
          "theoryCompletedAt: 2024-05-01",
          "flashcardsCompleted: true",
        ].join("\n")
      )
    );
    expect(restored.topics[0].lessons[0].progress).toEqual({
      theory: { completed: true, completedAt: "2024-05-01" },
      flashcards: { completed: true },
    });
  });

  it("maps the deprecated `completed` field onto progress.theory", () => {
    const restored = mdToCourse(
      buildMd(["completed: true", "completedAt: 2024-05-01"].join("\n"))
    );
    expect(restored.topics[0].lessons[0].progress).toEqual({
      theory: { completed: true, completedAt: "2024-05-01" },
    });
  });

  it("prefers theoryCompleted over the deprecated completed field", () => {
    const restored = mdToCourse(
      buildMd(["theoryCompleted: false", "completed: true"].join("\n"))
    );
    expect(restored.topics[0].lessons[0].progress?.theory).toEqual({
      completed: false,
    });
  });

  it("drops the legacy keys when re-serialized", () => {
    const restored = mdToCourse(
      buildMd(["completed: true", "completedAt: 2024-05-01"].join("\n"))
    );
    const reSerialized = courseToMd(restored);
    expect(reSerialized).not.toContain("\ncompleted:");
    expect(reSerialized).toContain("theoryCompleted: true");
  });
});
