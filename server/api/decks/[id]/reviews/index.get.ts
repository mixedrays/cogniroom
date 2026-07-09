import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { deckRepo } from "@modules/repository";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";

export default defineEventHandler(
  withErrorGuard("Failed to load reviews", async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw new HTTPError({ status: 400, message: "Missing deck ID" });
    }
    const result = await deckRepo.getDeckReviews(storageApi, id);
    if (!result) {
      throw new HTTPError({ status: 404, message: "Reviews not found" });
    }
    return result;
  })
);
