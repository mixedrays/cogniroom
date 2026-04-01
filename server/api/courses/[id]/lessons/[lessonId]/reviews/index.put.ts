import { defineEventHandler, getRouterParam, readBody, createError } from "h3";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { ReviewData } from "@modules/core";

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

    const body = await readBody<ReviewData>(event);

    if (!body) {
      throw createError({ statusCode: 400, statusMessage: "Missing body" });
    }

    await storageApi.put(storagePaths.reviews(courseId, lessonId), body);

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
