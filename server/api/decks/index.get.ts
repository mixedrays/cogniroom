import { defineEventHandler } from "h3";
import { storageApi } from "@modules/storage";
import { deckRepo } from "@modules/repository";
import type { DeckMetadata } from "@modules/core";

export default defineEventHandler(async (): Promise<DeckMetadata[]> => {
  try {
    return await deckRepo.listDecks(storageApi);
  } catch (error) {
    console.error("Error listing decks:", error);
    return [];
  }
});
