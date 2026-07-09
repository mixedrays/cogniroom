/**
 * Isomorphic deck domain operations. See `./courses` for the design rationale.
 */

import type { StorageApi } from "@modules/storage/client";
import { storagePaths } from "@modules/storage/paths";
import { getFormatAdapter } from "@modules/content-formats";
import { generateUniqueDeckId } from "@modules/core";
import type {
  Deck,
  DeckKind,
  DeckMetadata,
  DeckSource,
  FlashcardsContent,
  QuizContent,
  ReviewData,
} from "@modules/core";
import type { MutationResult } from "./courses";

async function readDeck(api: StorageApi, id: string): Promise<Deck | null> {
  const response = await api.get<string>(storagePaths.deck(id));
  if (!response.ok) return null;
  try {
    return JSON.parse(await response.text()) as Deck;
  } catch {
    return null;
  }
}

async function countItems(api: StorageApi, deck: Deck): Promise<number> {
  try {
    if (deck.kind === "flashcards") {
      const res = await api.get<string>(storagePaths.deckFlashcards(deck.id));
      if (!res.ok) return 0;
      const content = getFormatAdapter("flashcards").deserialize(
        await res.text()
      );
      return content.flashcards?.length ?? 0;
    }
    const res = await api.get<string>(storagePaths.deckQuiz(deck.id));
    if (!res.ok) return 0;
    const content = getFormatAdapter("quiz").deserialize(await res.text());
    return content.quizQuestions?.length ?? 0;
  } catch {
    return 0;
  }
}

export async function listDecks(api: StorageApi): Promise<DeckMetadata[]> {
  const folders = await api.list("decks", { directories: true, files: false });

  const decks = await Promise.all(
    folders.map(async (folder) => {
      const deck = await readDeck(api, folder.name);
      if (!deck) return null;
      const itemCount = await countItems(api, deck);
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
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return valid;
}

export async function getDeck(
  api: StorageApi,
  id: string
): Promise<Deck | null> {
  return readDeck(api, id);
}

export interface CreateDeckInput {
  title: string;
  description?: string;
  kind: DeckKind;
  source?: DeckSource;
  flashcards?: FlashcardsContent | null;
  quiz?: QuizContent | null;
}

export async function createDeck(
  api: StorageApi,
  input: CreateDeckInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const existing = await api.list("decks", {
    directories: true,
    files: false,
  });
  const id = generateUniqueDeckId(
    input.title,
    existing.map((f) => f.name)
  );

  const now = new Date().toISOString();
  const deck: Deck = {
    id,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    kind: input.kind,
    source: input.source ?? "manual",
    createdAt: now,
    updatedAt: now,
  };

  await api.post(storagePaths.deck(id), JSON.stringify(deck, null, 2));

  if (input.flashcards) {
    await api.post(
      storagePaths.deckFlashcards(id),
      getFormatAdapter("flashcards").serialize(input.flashcards)
    );
  }
  if (input.quiz) {
    await api.post(
      storagePaths.deckQuiz(id),
      getFormatAdapter("quiz").serialize(input.quiz)
    );
  }

  return { success: true, id };
}

export async function deleteDeck(
  api: StorageApi,
  id: string
): Promise<MutationResult> {
  const response = await api.delete(storagePaths.deckDir(id), true);
  if (!response.ok && response.status !== 404) {
    return { success: false, error: response.error ?? response.statusText };
  }
  return { success: true };
}

export async function getDeckFlashcards(
  api: StorageApi,
  id: string
): Promise<{ content: FlashcardsContent } | null> {
  const response = await api.get<string>(storagePaths.deckFlashcards(id));
  if (!response.ok) return null;
  return {
    content: getFormatAdapter("flashcards").deserialize(await response.text()),
  };
}

export async function getDeckQuiz(
  api: StorageApi,
  id: string
): Promise<{ content: QuizContent } | null> {
  const response = await api.get<string>(storagePaths.deckQuiz(id));
  if (!response.ok) return null;
  return {
    content: getFormatAdapter("quiz").deserialize(await response.text()),
  };
}

export async function getDeckReviews(
  api: StorageApi,
  id: string
): Promise<ReviewData | null> {
  const response = await api.get<ReviewData>(storagePaths.deckReviews(id));
  if (!response.ok) return null;
  return await response.json();
}

export async function saveDeckReviews(
  api: StorageApi,
  id: string,
  data: ReviewData
): Promise<MutationResult> {
  await api.put(storagePaths.deckReviews(id), data);
  return { success: true };
}
