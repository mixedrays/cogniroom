import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { deckRepo } from "@modules/repository";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";

export default defineEventHandler(
  withErrorGuard("Failed to load quiz", async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw new HTTPError({ status: 400, message: "Missing deck ID" });
    }
    const result = await deckRepo.getDeckQuiz(storageApi, id);
    if (!result) {
      throw new HTTPError({ status: 404, message: "Quiz not found" });
    }
    return result;
  })
);
