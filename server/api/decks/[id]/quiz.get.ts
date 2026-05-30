import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";

export default defineEventHandler(
  withErrorGuard("Failed to load quiz", async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw new HTTPError({ status: 400, message: "Missing deck ID" });
    }
    const adapter = getFormatAdapter("quiz");
    const response = await storageApi.get<string>(storagePaths.deckQuiz(id));
    if (response.ok) {
      return { content: adapter.deserialize(await response.text()) };
    }
    throw new HTTPError({ status: 404, message: "Quiz not found" });
  })
);
