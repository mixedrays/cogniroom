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

    // Try JSON format first
    const jsonResponse = await storage<any>(`courses/${courseId}/tests/${lessonId}.json`);

    if (jsonResponse.ok) {
      const parsed = await jsonResponse.json();
      return { content: parsed };
    }

    // Fall back to legacy markdown format
    const mdResponse = await storage<string>(`courses/${courseId}/tests/${lessonId}.md`);

    if (mdResponse.ok) {
      const legacyContent = await mdResponse.text();
      return {
        content: {
          version: 1,
          flashcards: [],
          quizQuestions: [],
          legacyMarkdown: legacyContent,
        },
      };
    }

    throw createError({
      statusCode: 404,
      statusMessage: "Tests content not found",
    });
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to load tests content",
    });
  }
});
