import { defineEventHandler, getRouterParam, createError } from "h3";
import { storage } from "@root/modules/storage";

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

    const response = await storage<string>(`courses/${courseId}/exercises/${lessonId}.md`);

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: response.status === 404 ? "Exercises content not found" : response.statusText,
      });
    }

    const content = await response.text();
    return { content };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to load exercises content",
    });
  }
});
