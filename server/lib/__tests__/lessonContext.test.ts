import { describe, it, expect, vi, beforeEach } from "vitest";
import { HTTPError } from "h3";
import type { Course } from "@modules/core";

const getMock = vi.fn();

vi.mock("@modules/storage", () => ({
  storageApi: {
    get: (...args: unknown[]) => getMock(...args),
  },
}));

vi.mock("@modules/content-formats", () => ({
  getFormatAdapter: () => ({
    deserialize: (text: string) => JSON.parse(text) as Course,
    serialize: (value: unknown) => JSON.stringify(value),
    extension: ".json",
  }),
}));

import {
  loadLessonContext,
  loadLessonTheoryBlock,
  buildLessonPromptVars,
} from "../lessonContext";

const course: Course = {
  id: "c1",
  title: "Course One",
  description: "Course desc",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  source: "llm",
  topics: [
    {
      id: "t1",
      title: "Topic One",
      description: "Topic desc",
      lessons: [
        { id: "l1", title: "Lesson One", description: "Lesson desc" },
        { id: "l2", title: "Lesson Two" },
      ],
    },
  ],
};

function okText(text: string) {
  return { ok: true, status: 200, statusText: "OK", text: async () => text };
}

function errorResponse(status: number, statusText = "Error") {
  return { ok: false, status, statusText, text: async () => "" };
}

beforeEach(() => {
  getMock.mockReset();
});

describe("loadLessonContext", () => {
  it("returns the course, topic, and lesson when found", async () => {
    getMock.mockResolvedValueOnce(okText(JSON.stringify(course)));
    const ctx = await loadLessonContext("c1", "l1");
    expect(ctx.course.id).toBe("c1");
    expect(ctx.topic.id).toBe("t1");
    expect(ctx.lesson.id).toBe("l1");
  });

  it("throws HTTPError 404 'Course not found' when the course is missing", async () => {
    getMock.mockResolvedValueOnce(errorResponse(404, "Not Found"));
    await expect(loadLessonContext("missing", "l1")).rejects.toMatchObject({
      status: 404,
      message: "Course not found",
    });
  });

  it("propagates non-404 storage errors with status and statusText", async () => {
    getMock.mockResolvedValueOnce(errorResponse(500, "Boom"));
    await expect(loadLessonContext("c1", "l1")).rejects.toMatchObject({
      status: 500,
      message: "Boom",
    });
  });

  it("throws HTTPError 404 'Lesson not found in course' when the lesson is missing", async () => {
    getMock.mockResolvedValueOnce(okText(JSON.stringify(course)));
    await expect(loadLessonContext("c1", "nope")).rejects.toMatchObject({
      status: 404,
      message: "Lesson not found in course",
    });
  });

  it("throws an HTTPError instance (so route guards rethrow it)", async () => {
    getMock.mockResolvedValueOnce(errorResponse(404, "Not Found"));
    await expect(loadLessonContext("missing", "l1")).rejects.toBeInstanceOf(
      HTTPError
    );
  });
});

describe("loadLessonTheoryBlock", () => {
  it("returns an empty string without reading storage when includeContent is false", async () => {
    const block = await loadLessonTheoryBlock("c1", "l1", false);
    expect(block).toBe("");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("returns an empty string when the lesson file is absent", async () => {
    getMock.mockResolvedValueOnce(errorResponse(404, "Not Found"));
    expect(await loadLessonTheoryBlock("c1", "l1")).toBe("");
  });

  it("returns an empty string when the lesson content is blank", async () => {
    getMock.mockResolvedValueOnce(okText("   \n  "));
    expect(await loadLessonTheoryBlock("c1", "l1")).toBe("");
  });

  it("wraps trimmed lesson content in the theory block", async () => {
    getMock.mockResolvedValueOnce(okText("  # Heading\n\nBody  "));
    expect(await loadLessonTheoryBlock("c1", "l1")).toBe(
      "\n\nLesson Theory Content:\n---\n# Heading\n\nBody\n---"
    );
  });
});

describe("buildLessonPromptVars", () => {
  const ctx = {
    course,
    topic: course.topics[0],
    lesson: course.topics[0].lessons[0],
  };

  it("maps course, topic, and lesson fields into prompt variables", () => {
    const vars = buildLessonPromptVars(ctx, "\nextra");
    expect(vars).toEqual({
      courseTitle: "Course One",
      topicTitle: "Topic One",
      topicDescription: "Topic desc",
      lessonTitle: "Lesson One",
      lessonDescription: "Lesson desc",
      lessonContent: "",
      additionalInstructions: "\nextra",
    });
  });

  it("defaults missing descriptions to empty strings", () => {
    const vars = buildLessonPromptVars(
      {
        course,
        topic: { id: "t", title: "T", lessons: [] },
        lesson: { id: "l", title: "L" },
      },
      ""
    );
    expect(vars.topicDescription).toBe("");
    expect(vars.lessonDescription).toBe("");
  });

  it("includes the supplied lesson content block", () => {
    const vars = buildLessonPromptVars(ctx, "", "\n\nLesson Theory...");
    expect(vars.lessonContent).toBe("\n\nLesson Theory...");
  });
});
