import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { ReviewData } from "@modules/core";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";

export default defineEventHandler(
  withErrorGuard("Failed to load reviews", async (event) => {
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
  })
);
