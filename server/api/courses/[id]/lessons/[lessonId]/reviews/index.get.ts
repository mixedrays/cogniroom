import { defineEventHandler, getRouterParam, createError } from "h3";
import { storage } from "@modules/storage";
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

    const response = await storage<ReviewData>(
      storagePaths.reviews(courseId, lessonId)
    );

    if (response.ok) {
      return await response.json();
    }

    throw createError({
      statusCode: 404,
      statusMessage: "Reviews not found",
    });
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to load reviews",
    });
  }
});
