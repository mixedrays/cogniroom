import type {
  Deck,
  DeckKind,
  DeckMetadata,
  DeckSource,
  FlashcardsContent,
  QuizContent,
  ReviewData,
} from "./types";
import { withReadMirror, writeCache, deleteCache } from "./clientStorage";
import { enqueueDeckReview } from "./syncQueue";
import { postJson, getJson } from "./apiClient";
import { getStorageMode } from "./runtimeConfig";
import { getLocalDataApi, isLocalDataAvailable } from "./localRepo";
import { deckRepo } from "@modules/repository";
import {
  FlashcardsContentOutputSchema,
  QuizContentOutputSchema,
} from "@/modules/wizard-agent/lib/contentOutputSchemas";

async function isBrowserMode(): Promise<boolean> {
  return (await getStorageMode()) === "browser";
}

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return "http://localhost:3000";
}

const DECK_LIST_KEY = "cache/decks/index";
const deckKey = (id: string) => `cache/decks/${id}`;
const deckFlashcardsKey = (id: string) => `cache/decks/${id}/flashcards`;
const deckQuizKey = (id: string) => `cache/decks/${id}/quiz`;
const deckReviewsKey = (id: string) => `cache/decks/${id}/reviews`;

export async function listDecks(): Promise<DeckMetadata[]> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return [];
    return deckRepo.listDecks(getLocalDataApi());
  }
  const cached = await withReadMirror<DeckMetadata[]>(
    DECK_LIST_KEY,
    async () => {
      try {
        const response = await fetch(`${getBaseUrl()}/api/decks`);
        if (!response.ok) {
          console.error("Failed to list decks:", response.statusText);
          return null;
        }
        return (await response.json()) as DeckMetadata[];
      } catch (e) {
        console.error("Error listing decks:", e);
        return null;
      }
    }
  );
  return cached ?? [];
}

export async function getDeck(id: string): Promise<Deck | null> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return null;
    return deckRepo.getDeck(getLocalDataApi(), id);
  }
  return withReadMirror<Deck>(deckKey(id), async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/decks/${id}`);
      if (!response.ok) {
        if (response.status !== 404) {
          console.error(`Failed to fetch deck ${id}: ${response.statusText}`);
        }
        return null;
      }
      return (await response.json()) as Deck;
    } catch (e) {
      console.error(`Error getting deck ${id}:`, e);
      return null;
    }
  });
}

export interface CreateDeckInput {
  title: string;
  description?: string;
  kind: DeckKind;
  source?: DeckSource;
  content?: FlashcardsContent | QuizContent | null;
}

export async function createDeck(
  input: CreateDeckInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (await isBrowserMode()) {
    let flashcards: FlashcardsContent | null = null;
    let quiz: QuizContent | null = null;
    if (input.content !== undefined && input.content !== null) {
      if (input.kind === "flashcards") {
        const parsed = FlashcardsContentOutputSchema.safeParse(input.content);
        if (!parsed.success) {
          return {
            success: false,
            error: `Invalid flashcards content: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
          };
        }
        flashcards = { version: 2, ...parsed.data };
      } else {
        const parsed = QuizContentOutputSchema.safeParse(input.content);
        if (!parsed.success) {
          return {
            success: false,
            error: `Invalid quiz content: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
          };
        }
        quiz = { version: 2, ...parsed.data };
      }
    }
    return deckRepo.createDeck(getLocalDataApi(), {
      title: input.title,
      description: input.description,
      kind: input.kind,
      source: input.source,
      flashcards,
      quiz,
    });
  }
  return postJson<{ success: boolean; id?: string; error?: string }>(
    `${getBaseUrl()}/api/decks`,
    input,
    "Create failed"
  );
}

export async function deleteDeck(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (await isBrowserMode()) {
    return deckRepo.deleteDeck(getLocalDataApi(), id);
  }
  try {
    const response = await fetch(`${getBaseUrl()}/api/decks/${id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (response.ok) {
      void deleteCache(deckKey(id));
      void deleteCache(`cache/decks/${id}`, true);
      void deleteCache(DECK_LIST_KEY);
    }
    return result;
  } catch (e) {
    console.error(`Error deleting deck ${id}:`, e);
    return { success: false, error: String(e) };
  }
}

export async function getDeckFlashcards(
  id: string
): Promise<{ content: FlashcardsContent } | null> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return null;
    return deckRepo.getDeckFlashcards(getLocalDataApi(), id);
  }
  return withReadMirror<{ content: FlashcardsContent }>(
    deckFlashcardsKey(id),
    () =>
      getJson<{ content: FlashcardsContent }>(
        `${getBaseUrl()}/api/decks/${id}/flashcards`,
        `Error getting deck flashcards ${id}:`
      )
  );
}

export async function getDeckQuiz(
  id: string
): Promise<{ content: QuizContent } | null> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return null;
    return deckRepo.getDeckQuiz(getLocalDataApi(), id);
  }
  return withReadMirror<{ content: QuizContent }>(deckQuizKey(id), () =>
    getJson<{ content: QuizContent }>(
      `${getBaseUrl()}/api/decks/${id}/quiz`,
      `Error getting deck quiz ${id}:`
    )
  );
}

export async function getDeckReviews(id: string): Promise<ReviewData | null> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return null;
    return deckRepo.getDeckReviews(getLocalDataApi(), id);
  }
  return withReadMirror<ReviewData>(deckReviewsKey(id), () =>
    getJson<ReviewData>(
      `${getBaseUrl()}/api/decks/${id}/reviews`,
      `Error getting deck reviews ${id}:`
    )
  );
}

export interface GenerateDeckOptions {
  additionalInstructions?: string;
  model?: string;
  generationOptions?: string;
}

/** Human-readable default title for a generated deck (e.g. "2026-07-09 13:40"). */
function timestampTitle(): string {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

export async function generateFlashcardsDeck(
  options: GenerateDeckOptions = {}
): Promise<{
  success: boolean;
  id?: string;
  content?: FlashcardsContent;
  error?: string;
}> {
  const res = await postJson<{
    success: boolean;
    content?: FlashcardsContent;
    error?: string;
  }>(`${getBaseUrl()}/api/decks/flashcards/generate`, options, "Generate failed");
  if (!res.success || !res.content) return res;

  const created = await createDeck({
    title: timestampTitle(),
    kind: "flashcards",
    source: "llm",
    content: res.content,
  });
  if (!created.success) return { success: false, error: created.error };
  return { success: true, id: created.id, content: res.content };
}

export async function generateQuizDeck(
  options: GenerateDeckOptions = {}
): Promise<{
  success: boolean;
  id?: string;
  content?: QuizContent;
  error?: string;
}> {
  const res = await postJson<{
    success: boolean;
    content?: QuizContent;
    error?: string;
  }>(`${getBaseUrl()}/api/decks/quiz/generate`, options, "Generate failed");
  if (!res.success || !res.content) return res;

  const created = await createDeck({
    title: timestampTitle(),
    kind: "quiz",
    source: "llm",
    content: res.content,
  });
  if (!created.success) return { success: false, error: created.error };
  return { success: true, id: created.id, content: res.content };
}

export async function saveDeckReviews(
  id: string,
  data: ReviewData
): Promise<{ success: boolean; error?: string; queued?: boolean }> {
  if (await isBrowserMode()) {
    return deckRepo.saveDeckReviews(getLocalDataApi(), id, data);
  }
  void writeCache(deckReviewsKey(id), data);
  try {
    const response = await fetch(`${getBaseUrl()}/api/decks/${id}/reviews`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await enqueueDeckReview(id, data);
      return { success: true, queued: true };
    }
    return await response.json();
  } catch {
    await enqueueDeckReview(id, data);
    return { success: true, queued: true };
  }
}
