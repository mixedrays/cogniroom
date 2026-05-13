import { defineEventHandler, getRouterParam, readBody, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { ReviewData } from "@modules/core";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw new HTTPError({ status: 400, message: "Missing deck ID" });
    }
    const body = await readBody<ReviewData>(event);
    if (!body) {
      throw new HTTPError({ status: 400, message: "Missing body" });
    }
    await storageApi.put(storagePaths.deckReviews(id), body);
    return { success: true };
  } catch (error) {
    if (error instanceof HTTPError) throw error;
    throw new HTTPError({ status: 500, message: "Failed to save reviews" });
  }
});
