import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { ReviewData } from "@modules/core";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw new HTTPError({ status: 400, message: "Missing deck ID" });
    }
    const response = await storageApi.get<ReviewData>(
      storagePaths.deckReviews(id)
    );
    if (response.ok) {
      return await response.json();
    }
    throw new HTTPError({ status: 404, message: "Reviews not found" });
  } catch (error) {
    if (error instanceof HTTPError) throw error;
    throw new HTTPError({ status: 500, message: "Failed to load reviews" });
  }
});
