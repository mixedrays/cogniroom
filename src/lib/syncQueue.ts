import type { ReviewData } from "./types";
import {
  deleteCache,
  listCachePaths,
  readCache,
  writeCache,
} from "./clientStorage";

const QUEUE_PREFIX = "_pending/reviews";

type PendingFlashcards = {
  kind: "flashcards";
  courseId: string;
  lessonId: string;
  data: ReviewData;
  updatedAt: number;
};

type PendingDeck = {
  kind: "deck";
  deckId: string;
  data: ReviewData;
  updatedAt: number;
};

export type PendingReview = PendingFlashcards | PendingDeck;

function flashcardsPath(courseId: string, lessonId: string): string {
  return `${QUEUE_PREFIX}/flashcards/${courseId}/${lessonId}`;
}

function deckPath(deckId: string): string {
  return `${QUEUE_PREFIX}/deck/${deckId}`;
}

function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  return "http://localhost:3000";
}

export async function enqueueFlashcardsReview(
  courseId: string,
  lessonId: string,
  data: ReviewData
): Promise<void> {
  const entry: PendingFlashcards = {
    kind: "flashcards",
    courseId,
    lessonId,
    data,
    updatedAt: Date.now(),
  };
  await writeCache(flashcardsPath(courseId, lessonId), entry);
}

export async function enqueueDeckReview(
  deckId: string,
  data: ReviewData
): Promise<void> {
  const entry: PendingDeck = {
    kind: "deck",
    deckId,
    data,
    updatedAt: Date.now(),
  };
  await writeCache(deckPath(deckId), entry);
}

export async function getPendingReviews(): Promise<PendingReview[]> {
  const paths = await listCachePaths(QUEUE_PREFIX);
  const entries: PendingReview[] = [];
  for (const path of paths) {
    const entry = await readCache<PendingReview>(path);
    if (entry) entries.push(entry);
  }
  return entries;
}

export interface FlushResult {
  synced: number;
  failed: number;
}

async function pushFlashcards(entry: PendingFlashcards): Promise<boolean> {
  const response = await fetch(
    `${getBaseUrl()}/api/courses/${entry.courseId}/lessons/${entry.lessonId}/reviews`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry.data),
    }
  );
  return response.ok;
}

async function pushDeck(entry: PendingDeck): Promise<boolean> {
  const response = await fetch(
    `${getBaseUrl()}/api/decks/${entry.deckId}/reviews`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry.data),
    }
  );
  return response.ok;
}

export async function flushSyncQueue(): Promise<FlushResult> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { synced: 0, failed: 0 };
  }
  const pending = await getPendingReviews();
  let synced = 0;
  let failed = 0;
  for (const entry of pending) {
    try {
      const ok =
        entry.kind === "flashcards"
          ? await pushFlashcards(entry)
          : await pushDeck(entry);
      if (ok) {
        await deleteCache(
          entry.kind === "flashcards"
            ? flashcardsPath(entry.courseId, entry.lessonId)
            : deckPath(entry.deckId)
        );
        synced += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }
  return { synced, failed };
}
