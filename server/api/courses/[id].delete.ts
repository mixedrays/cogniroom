import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { toErrorMessage } from "@root/server/lib/errors";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";
import { courseRepo } from "@modules/repository";

export default defineEventHandler(async (event) => {
  try {
    assertServerStorageEnabled();
    const id = getRouterParam(event, "id");
    if (!id) {
      return { success: false, error: "Missing course ID" };
    }
    return await courseRepo.deleteCourse(storageApi, id);
  } catch (error: unknown) {
    if (error instanceof HTTPError) throw error;
    console.error("Error deleting course:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
