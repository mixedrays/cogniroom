import { defineEventHandler, readBody } from "h3";
import { readdirSync } from "node:fs";
import { storageApi } from "@modules/storage";
import { COURSES_DIR } from "@root/server/env";
import { getFormatAdapter } from "@modules/content-formats";
import { toErrorMessage } from "@root/server/lib/errors";
import { storagePaths } from "@root/server/lib/storagePaths";
import { toSlug, generateUniqueCourseId } from "@modules/core";
import type { Course } from "@modules/core";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<Partial<Course>>(event);

    if (!body || !body.title) {
      return { success: false, error: "Invalid course data" };
    }

    let existingIds: string[] = [];
    try {
      existingIds = readdirSync(COURSES_DIR);
    } catch {}
    const id = generateUniqueCourseId(body.title, existingIds);

    const updatedTopics = (body.topics ?? []).map((topic) => {
      const topicTitle = typeof topic.title === "string" ? topic.title : "";
      const topicId =
        typeof topic.id === "string" && topic.id
          ? topic.id
          : toSlug(topicTitle) || "topic";
      return {
        ...topic,
        id: topicId,
        lessons: (topic.lessons ?? []).map((lesson) => ({
          ...lesson,
          id:
            typeof lesson.id === "string" && lesson.id
              ? lesson.id
              : toSlug(lesson.title) || "lesson",
        })),
      };
    });

    const now = new Date().toISOString();
    const course: Course = {
      ...body,
      id,
      title: body.title ?? "Untitled Course",
      topics: updatedTopics,
      source: body.source ?? "llm",
      createdAt: body.createdAt ?? now,
      updatedAt: now,
    };

    const courseAdapter = getFormatAdapter("course");
    const response = await storageApi.post(
      storagePaths.course(id),
      courseAdapter.serialize(course)
    );

    if (!response.ok) {
      return { success: false, error: response.statusText };
    }

    return { success: true, id };
  } catch (error: unknown) {
    console.error("Error saving course:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
