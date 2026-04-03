import {
  defineEventHandler,
  getRouterParam,
  readBody,
  HTTPError,
} from "h3";
import { storageApi } from "@modules/storage";
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

    const body = await readBody<ReviewData>(event);

    if (!body) {
      throw new HTTPError({ status: 400, message: "Missing body" });
    }

    await storageApi.put(storagePaths.reviews(courseId, lessonId), body);

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof HTTPError) {
      throw error;
    }
    throw new HTTPError({
      status: 500,
      message: "Failed to save reviews",
    });
  }
});
