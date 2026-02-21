import { defineEventHandler, getRouterParam, readBody, createError } from "h3";
import { storageApi } from "@root/modules/storage";

export default defineEventHandler(async (event) => {
  try {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing course ID or lesson ID",
      });
    }

    const body = await readBody(event) as object;

    await storageApi.put(
      `courses/${courseId}/lessons/${lessonId}/reviews.json`,
      body
    );

    return { success: true };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to save reviews",
    });
  }
});
