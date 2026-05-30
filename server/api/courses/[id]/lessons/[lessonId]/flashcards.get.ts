import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";

export default defineEventHandler(
  withErrorGuard("Failed to load flashcards", async (event) => {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      throw new HTTPError({
        status: 400,
        message: "Missing course ID or lesson ID",
      });
    }

    const flashcardsAdapter = getFormatAdapter("flashcards");
    const response = await storageApi.get<string>(
      storagePaths.flashcards(courseId, lessonId)
    );
    if (response.ok) {
      const text = await response.text();
      const content = flashcardsAdapter.deserialize(text);
      return { content };
    }

    throw new HTTPError({
      status: 404,
      message: "Flashcards not found",
    });
  })
);
