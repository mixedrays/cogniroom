import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
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

    const quizAdapter = getFormatAdapter("quiz");
    const response = await storageApi.get<string>(
      storagePaths.quiz(courseId, lessonId)
    );
    if (response.ok) {
      const text = await response.text();
      const content = quizAdapter.deserialize(text);
      return { content };
    }

    throw new HTTPError({
      status: 404,
      message: "Quiz not found",
    });
  } catch (error: unknown) {
    if (error instanceof HTTPError) {
      throw error;
    }
    throw new HTTPError({
      status: 500,
      message: "Failed to load quiz",
    });
  }
});
