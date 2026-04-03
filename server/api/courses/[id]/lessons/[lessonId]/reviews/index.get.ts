import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storage } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { ReviewData } from "@modules/core";

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

    const response = await storage<ReviewData>(
      storagePaths.reviews(courseId, lessonId)
    );

    if (response.ok) {
      return await response.json();
    }

    throw new HTTPError({
      status: 404,
      message: "Reviews not found",
    });
  } catch (error: unknown) {
    if (error instanceof HTTPError) {
      throw error;
    }
    throw new HTTPError({
      status: 500,
      message: "Failed to load reviews",
    });
  }
});
