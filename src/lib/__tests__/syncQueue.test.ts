import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import type { ReviewData } from "@/lib/types";

const reset = async () => {
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB =
    new IDBFactory();
  vi.resetModules();
};

const sample = (lessonId = "lesson-1", itemId = "card-1"): ReviewData => ({
  lessonId,
  entries: [
    {
      itemId,
      repetitions: 0,
      easeFactor: 2.5,
      interval: 0,
      lastReviewedAt: new Date().toISOString(),
      nextReviewAt: new Date().toISOString(),
    },
  ],
});

beforeEach(reset);
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("syncQueue", () => {
  it("enqueues a flashcards review and reads it back", async () => {
    const { enqueueFlashcardsReview, getPendingReviews } =
      await import("@/lib/syncQueue");
    await enqueueFlashcardsReview("c1", "l1", sample("l1"));
    const pending = await getPendingReviews();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      kind: "flashcards",
      courseId: "c1",
      lessonId: "l1",
    });
  });

  it("collapses repeated enqueues for the same target to the latest payload", async () => {
    const { enqueueFlashcardsReview, getPendingReviews } =
      await import("@/lib/syncQueue");
    await enqueueFlashcardsReview("c1", "l1", sample("l1", "card-1"));
    await enqueueFlashcardsReview("c1", "l1", sample("l1", "card-2"));
    const pending = await getPendingReviews();
    expect(pending).toHaveLength(1);
    if (pending[0].kind !== "flashcards") throw new Error("wrong kind");
    expect(pending[0].data.entries[0].itemId).toBe("card-2");
  });

  it("flushSyncQueue PUTs each entry and clears them on success", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { onLine: true });

    const {
      enqueueFlashcardsReview,
      enqueueDeckReview,
      flushSyncQueue,
      getPendingReviews,
    } = await import("@/lib/syncQueue");

    await enqueueFlashcardsReview("c1", "l1", sample("l1"));
    await enqueueDeckReview("d1", sample("d1"));

    const result = await flushSyncQueue();
    expect(result).toEqual({ synced: 2, failed: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await getPendingReviews()).toHaveLength(0);
  });

  it("flushSyncQueue counts failures and keeps entries queued", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { onLine: true });

    const { enqueueDeckReview, flushSyncQueue, getPendingReviews } =
      await import("@/lib/syncQueue");

    await enqueueDeckReview("d1", sample("d1"));
    const result = await flushSyncQueue();
    expect(result).toEqual({ synced: 0, failed: 1 });
    expect(await getPendingReviews()).toHaveLength(1);
  });

  it("flushSyncQueue is a no-op when navigator.onLine is false", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { onLine: false });

    const { enqueueDeckReview, flushSyncQueue } =
      await import("@/lib/syncQueue");
    await enqueueDeckReview("d1", sample("d1"));
    const result = await flushSyncQueue();
    expect(result).toEqual({ synced: 0, failed: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
