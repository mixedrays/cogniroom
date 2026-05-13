import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { Deck } from "@modules/core";

export default defineEventHandler(async (event): Promise<Deck> => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw new HTTPError({ status: 400, message: "Missing deck ID" });
  }
  const response = await storageApi.get<string>(storagePaths.deck(id));
  if (!response.ok) {
    throw new HTTPError({
      status: response.status,
      message: response.status === 404 ? "Deck not found" : response.statusText,
    });
  }
  try {
    return JSON.parse(await response.text()) as Deck;
  } catch {
    throw new HTTPError({ status: 500, message: "Failed to parse deck" });
  }
});
