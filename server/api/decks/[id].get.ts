import { defineEventHandler, getRouterParam, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import { deckRepo } from "@modules/repository";
import type { Deck } from "@modules/core";

export default defineEventHandler(async (event): Promise<Deck> => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw new HTTPError({ status: 400, message: "Missing deck ID" });
  }
  const deck = await deckRepo.getDeck(storageApi, id);
  if (!deck) {
    throw new HTTPError({ status: 404, message: "Deck not found" });
  }
  return deck;
});
