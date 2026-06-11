import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import { QuizContentOutputSchema } from "@/modules/agent/lib/contentOutputSchemas";

export default defineEventHandler(async (event) => {
  const courseId = getRouterParam(event, "id");
  const lessonId = getRouterParam(event, "lessonId");

  if (!courseId || !lessonId) {
    throw new HTTPError({
      status: 400,
      message: "Missing courseId or lessonId",
    });
  }

  const body = await readBody<{ content: unknown }>(event);
  const parsed = QuizContentOutputSchema.safeParse(body?.content);
  if (!parsed.success) {
    throw new HTTPError({
      status: 400,
      message: `Invalid quiz content: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
    });
  }

  const content = { version: 2 as const, ...parsed.data };

  const adapter = getFormatAdapter("quiz");
  await storageApi.put(
    storagePaths.quiz(courseId, lessonId),
    adapter.serialize(content)
  );
  return { success: true };
});
