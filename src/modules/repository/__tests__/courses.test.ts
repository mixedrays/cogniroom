import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { createClientStorageApi } from "@/modules/storage/client";
import type { StorageApi } from "@/modules/storage/client";
import { courseRepo } from "@/modules/repository";

const reset = () => {
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB =
    new IDBFactory();
};

let api: StorageApi;

beforeEach(() => {
  reset();
  api = createClientStorageApi({
    databaseName: "cogniroom-data-test",
    storeName: "files",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("courseRepo against IndexedDB adapter", () => {
  it("creates a course and lists it with computed metadata", async () => {
    const created = await courseRepo.createCourse(api, {
      title: "Intro to Testing",
      topics: [
        {
          title: "Basics",
          lessons: [{ title: "First lesson" }, { title: "Second lesson" }],
        },
      ],
    });
    expect(created.success).toBe(true);
    expect(created.id).toBeTruthy();

    const list = await courseRepo.listCourses(api);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      title: "Intro to Testing",
      lessonCount: 2,
      completedCount: 0,
      progress: 0,
    });
  });

  it("round-trips lesson content and reflects it in content flags", async () => {
    const { id: courseId } = await courseRepo.createCourse(api, {
      title: "Course A",
      topics: [{ title: "T1", lessons: [{ id: "l1", title: "Lesson 1" }] }],
    });
    if (!courseId) throw new Error("no course id");

    await courseRepo.saveLessonContent(api, courseId, "l1", "# Hello");
    const lesson = await courseRepo.getLessonContent(api, courseId, "l1");
    expect(lesson?.content).toBe("# Hello");

    const course = await courseRepo.getCourse(api, courseId);
    const l1 = course?.topics[0]?.lessons[0];
    expect(l1?.hasContent).toBe(true);
    expect(l1?.hasFlashcards).toBe(false);
  });

  it("toggles lesson completion and updates metadata progress", async () => {
    const { id: courseId } = await courseRepo.createCourse(api, {
      title: "Course B",
      topics: [{ title: "T1", lessons: [{ id: "l1", title: "Lesson 1" }] }],
    });
    if (!courseId) throw new Error("no course id");

    const result = await courseRepo.updateLessonCompletion(
      api,
      courseId,
      "l1",
      true,
      "theory"
    );
    expect(result).toMatchObject({ completed: true, section: "theory" });

    const list = await courseRepo.listCourses(api);
    expect(list[0]).toMatchObject({ completedCount: 1, progress: 100 });
  });

  it("returns null completion result for an unknown lesson", async () => {
    const { id: courseId } = await courseRepo.createCourse(api, {
      title: "Course C",
      topics: [{ title: "T1", lessons: [{ id: "l1", title: "Lesson 1" }] }],
    });
    if (!courseId) throw new Error("no course id");
    const result = await courseRepo.updateLessonCompletion(
      api,
      courseId,
      "missing",
      true
    );
    expect(result).toBeNull();
  });

  it("deletes flashcards and clears its completion flag and reviews", async () => {
    const { id: courseId } = await courseRepo.createCourse(api, {
      title: "Course D",
      topics: [{ title: "T1", lessons: [{ id: "l1", title: "Lesson 1" }] }],
    });
    if (!courseId) throw new Error("no course id");

    await courseRepo.saveLessonFlashcards(api, courseId, "l1", {
      version: 2,
      flashcards: [
        { id: "c1", question: "Q", answer: "A", difficulty: "easy" },
      ],
    });
    await courseRepo.updateLessonCompletion(api, courseId, "l1", true, "flashcards");
    await courseRepo.saveFlashcardsReviews(api, courseId, "l1", {
      lessonId: "l1",
      entries: [],
    });

    const del = await courseRepo.deleteLessonFlashcards(api, courseId, "l1");
    expect(del.success).toBe(true);

    expect(await courseRepo.getLessonFlashcards(api, courseId, "l1")).toBeNull();
    expect(await courseRepo.getFlashcardsReviews(api, courseId, "l1")).toBeNull();
    const course = await courseRepo.getCourse(api, courseId);
    const progress = course?.topics[0]?.lessons[0]?.progress;
    expect(progress?.flashcards?.completed ?? false).toBe(false);
  });
});
