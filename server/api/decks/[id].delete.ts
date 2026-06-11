import { defineEventHandler, getRouterParam } from "h3";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import { toErrorMessage } from "@root/server/lib/errors";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return { success: false, error: "Missing deck ID" };
    }
    const response = await storageApi.delete(storagePaths.deckDir(id), true);
    if (!response.ok && response.status !== 404) {
      return { success: false, error: response.error ?? response.statusText };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting deck:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
