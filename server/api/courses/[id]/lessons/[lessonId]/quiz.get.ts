import { defineEventHandler, getRouterParam, createError } from "h3";
import { storageApi } from "@root/modules/storage";
import { mdToQuiz } from "@root/modules/md-formats";

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

    const response = await storageApi.get<string>(
      `courses/${courseId}/lessons/${lessonId}/quiz.md`
    );
    if (response.ok) {
      const text = await response.text();
      const content = mdToQuiz(text);
      return { content };
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
