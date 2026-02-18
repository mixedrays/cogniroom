import { defineEventHandler, readBody } from "h3";
import { readdirSync } from "node:fs";
import { storageApi } from "@root/modules/storage";
import { COURSES_DIR } from "@root/server/env";

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50)
    .replace(/-$/, "");
}

function courseId(title: string): string {
  const slug = toSlug(title);
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
        return { ...lesson, id: `${lessonCounter}-${toSlug(lesson.title)}` };
      }),
    }));

    const course = { ...body, id, topics: updatedTopics };

    const response = await storageApi.post(`courses/${id}/course.json`, course);

    if (!response.ok) {
      return { success: false, error: response.statusText };
    }

    return { success: true, id };
  } catch (error) {
    console.error("Error saving course:", error);
    return { success: false, error: String(error) };
  }
});
