import { describe, it, expect } from "vitest";
import { findLessonInCourse } from "../utils";
import type { Course } from "../types";

const course: Course = {
  id: "c1",
  title: "Test Course",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  source: "llm",
  topics: [
    {
      id: "t1",
      title: "Topic 1",
      lessons: [
        { id: "l1", title: "Lesson 1" },
        { id: "l2", title: "Lesson 2" },
      ],
    },
    {
      id: "t2",
      title: "Topic 2",
      lessons: [{ id: "l3", title: "Lesson 3" }],
    },
  ],
};

describe("findLessonInCourse", () => {
  it("returns the lesson and its containing topic", () => {
    const result = findLessonInCourse(course, "l2");
    expect(result).not.toBeNull();
    expect(result?.lesson.id).toBe("l2");
    expect(result?.topic.id).toBe("t1");
  });

  it("finds a lesson in a later topic", () => {
    const result = findLessonInCourse(course, "l3");
    expect(result?.lesson.id).toBe("l3");
    expect(result?.topic.id).toBe("t2");
  });

  it("returns null when the lesson does not exist", () => {
    expect(findLessonInCourse(course, "missing")).toBeNull();
  });

  it("returns null for a course with no topics", () => {
    expect(findLessonInCourse({ ...course, topics: [] }, "l1")).toBeNull();
  });

  it("tolerates a course whose topics array is missing", () => {
    const malformed = { ...course, topics: undefined } as unknown as Course;
    expect(findLessonInCourse(malformed, "l1")).toBeNull();
  });

  it("tolerates a topic with a missing lessons array", () => {
    const malformed = {
      ...course,
      topics: [{ id: "t9", title: "Empty" } as Course["topics"][number]],
    };
    expect(findLessonInCourse(malformed, "l1")).toBeNull();
  });

  it("returns the first match when ids are duplicated across topics", () => {
    const dup: Course = {
      ...course,
      topics: [
        { id: "tA", title: "A", lessons: [{ id: "dup", title: "First" }] },
        { id: "tB", title: "B", lessons: [{ id: "dup", title: "Second" }] },
      ],
    };
    const result = findLessonInCourse(dup, "dup");
    expect(result?.topic.id).toBe("tA");
    expect(result?.lesson.title).toBe("First");
  });

  it("returns a live reference so callers can mutate the lesson in place", () => {
    const local: Course = JSON.parse(JSON.stringify(course));
    const result = findLessonInCourse(local, "l1");
    result!.lesson.title = "Mutated";
    expect(local.topics[0].lessons[0].title).toBe("Mutated");
  });
});
