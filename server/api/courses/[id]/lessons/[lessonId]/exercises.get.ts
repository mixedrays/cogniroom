import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";

export default defineEventHandler(
  withErrorGuard("Failed to load exercises content", async (event) => {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");

    if (!courseId || !lessonId) {
      throw new HTTPError({
        status: 400,
        message: "Missing course ID or lesson ID",
      });
    }

    const response = await storageApi.get<string>(
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
  })
);
