import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";

export default defineEventHandler(async (event) => {
  try {
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
  } catch (error) {
    if (error instanceof HTTPError) throw error;
    throw new HTTPError({ status: 500, message: "Failed to load quiz" });
  }
});
