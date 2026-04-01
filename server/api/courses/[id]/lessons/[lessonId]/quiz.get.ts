import { defineEventHandler, getRouterParam, createError } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";

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

    const quizAdapter = getFormatAdapter("quiz");
    const response = await storageApi.get<string>(
      storagePaths.quiz(courseId, lessonId)
    );
    if (response.ok) {
      const text = await response.text();
      const content = quizAdapter.deserialize(text);
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
