import { defineEventHandler, getRouterParam } from "h3";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import { toErrorMessage } from "@root/server/lib/errors";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      return { success: false, error: "Missing course ID" };
    }

    // Delete the entire course folder (includes lessons, exercises)
    const response = await storageApi.delete(storagePaths.courseDir(id), true);

    if (!response.ok && response.status !== 404) {
      return { success: false, error: response.error ?? response.statusText };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting course:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
