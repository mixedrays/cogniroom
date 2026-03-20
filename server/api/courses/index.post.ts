import { defineEventHandler, readBody } from "h3";
import { readdirSync } from "node:fs";
import { storageApi } from "@root/modules/storage";
import { COURSES_DIR } from "@root/server/env";
import { getFormatAdapter } from "@root/modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";

function toSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50)
    .replace(/-$/, "");
  return slug;
}

function courseId(title: string): string {
  const slug = toSlug(title) || `course-${Date.now()}`;
  let existing: string[] = [];
  try {
    existing = readdirSync(COURSES_DIR);
  } catch {}
  if (!existing.includes(slug)) return slug;
  let n = 2;
  while (existing.includes(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      title: string;
      topics?: Array<{
        lessons?: Array<{ title: string; [key: string]: unknown }>;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    }>(event);

    if (!body || !body.title) {
      return { success: false, error: "Invalid course data" };
    }

    const id = courseId(body.title);

    let lessonCounter = 0;
    const updatedTopics = (body.topics ?? []).map((topic) => ({
      ...topic,
      lessons: (topic.lessons ?? []).map((lesson) => {
        lessonCounter++;
        const lessonSlug = toSlug(lesson.title) || `lesson`;
        return { ...lesson, id: `${lessonCounter}-${lessonSlug}` };
      }),
    }));

    const now = new Date().toISOString();
    const course = {
      ...body,
      id,
      topics: updatedTopics,
      source: body.source ?? "llm",
      createdAt: body.createdAt ?? now,
      updatedAt: now,
    };

    const courseAdapter = getFormatAdapter("course");
    const response = await storageApi.post(
      storagePaths.course(id),
      courseAdapter.serialize(course as any)
    );

    if (!response.ok) {
      return { success: false, error: response.statusText };
    }

    return { success: true, id };
  } catch (error) {
    console.error("Error saving course:", error);
    return { success: false, error: String(error) };
  }
});
