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

    // Try new format first
    const newResponse = await storage<any>(
      `courses/${courseId}/lessons/${lessonId}/quiz.json`
    );
    if (newResponse.ok) {
      const parsed = await newResponse.json();
      return { content: parsed };
    }

    // Fallback: read quiz questions from legacy tests.json
    const legacyResponse = await storage<any>(
      `courses/${courseId}/lessons/${lessonId}/tests.json`
    );
    if (legacyResponse.ok) {
      const parsed = await legacyResponse.json();
      if (Array.isArray(parsed.quizQuestions) && parsed.quizQuestions.length > 0) {
        return { content: { version: 1, quizQuestions: parsed.quizQuestions } };
      }
    }

    throw createError({
      statusCode: 404,
      statusMessage: "Quiz not found",
    });
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to load quiz",
    });
  }
});
