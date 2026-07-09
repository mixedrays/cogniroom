import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { toErrorMessage } from "@root/server/lib/errors";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";
import { deckRepo } from "@modules/repository";

export default defineEventHandler(async (event) => {
  try {
    assertServerStorageEnabled();
    const id = getRouterParam(event, "id");
    if (!id) {
      return { success: false, error: "Missing deck ID" };
    }
    return await deckRepo.deleteDeck(storageApi, id);
  } catch (error) {
    if (error instanceof HTTPError) throw error;
    console.error("Error deleting deck:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
