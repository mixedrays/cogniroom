import { defineEventHandler, getRouterParam, readBody, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import { reviewDataSchema } from "@modules/core";

export default defineEventHandler(async (event) => {
  try {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      throw new HTTPError({
        status: 400,
        message: "Missing course ID or lesson ID",
      });
    }

    const parsed = reviewDataSchema.safeParse(await readBody(event));

    if (!parsed.success) {
      throw new HTTPError({
        status: 400,
        message: `Invalid review data: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
      });
    }

    await storageApi.put(
      storagePaths.reviews(courseId, lessonId),
      parsed.data
    );

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof HTTPError) {
      throw error;
    }
    throw new HTTPError({
      status: 500,
      message: "Failed to save reviews",
    });
  }
});
