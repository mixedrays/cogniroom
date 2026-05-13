import { defineEventHandler } from "h3";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import type { Deck, DeckMetadata } from "@modules/core";

async function readDeck(id: string): Promise<Deck | null> {
  const response = await storageApi.get<string>(storagePaths.deck(id));
  if (!response.ok) return null;
  try {
    return JSON.parse(await response.text()) as Deck;
  } catch {
    return null;
  }
}

async function countItems(deck: Deck): Promise<number> {
  try {
    if (deck.kind === "flashcards") {
      const res = await storageApi.get<string>(
        storagePaths.deckFlashcards(deck.id)
      );
      if (!res.ok) return 0;
      const adapter = getFormatAdapter("flashcards");
      const content = adapter.deserialize(await res.text());
      return content.flashcards?.length ?? 0;
    }
    const res = await storageApi.get<string>(storagePaths.deckQuiz(deck.id));
    if (!res.ok) return 0;
    const adapter = getFormatAdapter("quiz");
    const content = adapter.deserialize(await res.text());
    return content.quizQuestions?.length ?? 0;
  } catch {
    return 0;
  }
}

export default defineEventHandler(async (): Promise<DeckMetadata[]> => {
  try {
    const folders = await storageApi.list("decks", {
      directories: true,
      files: false,
    });

    const decks = await Promise.all(
      folders.map(async (folder) => {
        const deck = await readDeck(folder.name);
        if (!deck) return null;
        const itemCount = await countItems(deck);
        const metadata: DeckMetadata = {
          id: deck.id,
          title: deck.title,
          kind: deck.kind,
          createdAt: deck.createdAt,
          updatedAt: deck.updatedAt,
          source: deck.source,
          itemCount,
        };
        if (deck.description) metadata.description = deck.description;
        return metadata;
      })
    );

    const valid = decks.filter((d): d is DeckMetadata => d !== null);
    valid.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return valid;
  } catch (error) {
    console.error("Error listing decks:", error);
    return [];
  }
});
