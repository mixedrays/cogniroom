import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storage } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";

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

    const response = await storage<string>(
      storagePaths.exercise(courseId, lessonId)
    );

    if (!response.ok) {
      throw new HTTPError({
        status: response.status,
        message:
          response.status === 404
            ? "Exercises content not found"
            : response.statusText,
      });
    }

    const content = await response.text();
    return { content };
  } catch (error: unknown) {
    if (error instanceof HTTPError) {
      throw error;
    }
    throw new HTTPError({
      status: 500,
      message: "Failed to load exercises content",
    });
  }
});
