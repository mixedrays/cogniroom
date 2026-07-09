import { defineEventHandler, getRouterParam, readBody, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { reviewDataSchema } from "@modules/core";
import { deckRepo } from "@modules/repository";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";

export default defineEventHandler(
  withErrorGuard("Failed to save reviews", async (event) => {
    assertServerStorageEnabled();
    const id = getRouterParam(event, "id");
    if (!id) {
      throw new HTTPError({ status: 400, message: "Missing deck ID" });
    }
    const parsed = reviewDataSchema.safeParse(await readBody(event));
    if (!parsed.success) {
      throw new HTTPError({
        status: 400,
        message: `Invalid review data: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
      });
    }
    return deckRepo.saveDeckReviews(storageApi, id, parsed.data);
  })
);
