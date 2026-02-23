import { renderHook, act } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { Flashcard, ReviewData, ReviewEntry } from "@/lib/types";
import {
  applySM2,
  useFlashcardsSM2,
} from "../useFlashcardsSM2";

const NOW = new Date("2026-02-23T10:00:00.000Z");

const cards: Flashcard[] = [
  { id: "a", question: "Q1", answer: "A1", difficulty: "easy" },
  { id: "b", question: "Q2", answer: "A2", difficulty: "medium" },
  { id: "c", question: "Q3", answer: "A3", difficulty: "hard" },
  { id: "d", question: "Q4", answer: "A4", difficulty: "easy" },
];

const entry = (partial: Partial<ReviewEntry> & Pick<ReviewEntry, "itemId">): ReviewEntry => ({
  itemId: partial.itemId,
  repetitions: partial.repetitions ?? 0,
  easeFactor: partial.easeFactor ?? 2.5,
  interval: partial.interval ?? 1,
  lastReviewedAt: partial.lastReviewedAt ?? "",
  nextReviewAt: partial.nextReviewAt ?? "",
});

const createOnSaveMock = () => vi.fn().mockResolvedValue(undefined);

describe("applySM2", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates first successful review entry from defaults", () => {
    const result = applySM2(undefined, 5, "card-1");

    expect(result.itemId).toBe("card-1");
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeCloseTo(2.6, 10);
    expect(result.lastReviewedAt).toBe(NOW.toISOString());
    expect(result.nextReviewAt).toBe(
      new Date(NOW.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    );
  });

  it("resets repetitions and interval for low quality ratings", () => {
    const prev = entry({
      itemId: "card-1",
      repetitions: 3,
      easeFactor: 2.2,
      interval: 10,
    });

    const result = applySM2(prev, 2, "card-1");

    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBe(2.2);
  });

  it("uses second-interval progression when repetitions is 1", () => {
    const prev = entry({
      itemId: "card-1",
      repetitions: 1,
      easeFactor: 2.5,
      interval: 1,
    });

    const result = applySM2(prev, 4, "card-1");

    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
    expect(result.easeFactor).toBeCloseTo(2.5, 10);
  });

  it("uses multiplicative interval progression for mature cards", () => {
    const prev = entry({
      itemId: "card-1",
      repetitions: 3,
      easeFactor: 2.4,
      interval: 10,
    });

    const result = applySM2(prev, 5, "card-1");

    expect(result.interval).toBe(24);
    expect(result.repetitions).toBe(4);
    expect(result.easeFactor).toBeCloseTo(2.5, 10);
  });

  it("applies q=3 boundary as a successful review", () => {
    const prev = entry({
      itemId: "card-1",
      repetitions: 2,
      easeFactor: 2.0,
      interval: 6,
    });

    const result = applySM2(prev, 3, "card-1");

    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(12);
    expect(result.easeFactor).toBeCloseTo(1.86, 10);
  });

  it("never lowers ease factor below 1.3", () => {
    const prev = entry({
      itemId: "card-1",
      repetitions: 5,
      easeFactor: 1.3,
      interval: 20,
    });

    const result = applySM2(prev, 3, "card-1");

    expect(result.easeFactor).toBeCloseTo(1.3, 10);
  });
});

describe("useFlashcardsSM2", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds session with due cards sorted first, then new cards", () => {
    const reviewData: ReviewData = {
      lessonId: "fixture-lesson",
      entries: [
        entry({ itemId: "a", nextReviewAt: "2026-02-21T00:00:00.000Z" }),
        entry({ itemId: "b", nextReviewAt: "2026-02-20T00:00:00.000Z" }),
        entry({ itemId: "c", nextReviewAt: "2026-03-01T00:00:00.000Z" }),
      ],
    };

    const onSave = createOnSaveMock();
    const { result } = renderHook(() =>
      useFlashcardsSM2(cards, reviewData, onSave),
    );

    expect(result.current.sessionCards.map((card) => card.id)).toEqual(["b", "a", "d"]);
    expect(result.current.dueCount).toBe(2);
    expect(result.current.newCount).toBe(1);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.currentCard?.id).toBe("b");
    expect(result.current.sessionComplete).toBe(false);
  });

  it("returns all cards when showAllCards is enabled", () => {
    const reviewData: ReviewData = {
      lessonId: "fixture-lesson",
      entries: [entry({ itemId: "a", nextReviewAt: "2099-01-01T00:00:00.000Z" })],
    };

    const onSave = createOnSaveMock();
    const { result } = renderHook(() =>
      useFlashcardsSM2(cards, reviewData, onSave, true),
    );

    expect(result.current.sessionCards.map((card) => card.id)).toEqual(["a", "b", "c", "d"]);
    expect(result.current.dueCount).toBe(0);
    expect(result.current.newCount).toBe(4);
  });

  it("is complete immediately when no cards are due/new", () => {
    const reviewData: ReviewData = {
      lessonId: "fixture-lesson",
      entries: cards.map((card) =>
        entry({ itemId: card.id, nextReviewAt: "2099-01-01T00:00:00.000Z" }),
      ),
    };

    const onSave = createOnSaveMock();
    const { result } = renderHook(() =>
      useFlashcardsSM2(cards, reviewData, onSave),
    );

    expect(result.current.sessionCards).toEqual([]);
    expect(result.current.currentCard).toBeUndefined();
    expect(result.current.sessionComplete).toBe(true);
  });

  it("is complete with empty cards input", () => {
    const onSave = createOnSaveMock();
    const { result } = renderHook(() =>
      useFlashcardsSM2([], null, onSave),
    );

    expect(result.current.sessionCards).toEqual([]);
    expect(result.current.currentCard).toBeUndefined();
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.sessionComplete).toBe(true);
  });

  it("rates current card, persists review data, and advances index", async () => {
    const reviewData: ReviewData = {
      lessonId: "lesson-1",
      entries: [
        entry({
          itemId: "a",
          repetitions: 1,
          easeFactor: 2.5,
          interval: 1,
          nextReviewAt: "2026-02-20T00:00:00.000Z",
        }),
      ],
    };

    const onSave = createOnSaveMock();
    const { result } = renderHook(() =>
      useFlashcardsSM2(cards, reviewData, onSave),
    );

    await act(async () => {
      await result.current.rateCard(3);
    });

    expect(onSave).toHaveBeenCalledTimes(1);

    const saved = onSave.mock.calls[0][0] as ReviewData;
    expect(saved.lessonId).toBe("lesson-1");
    const reviewedA = saved.entries.find((reviewEntry) => reviewEntry.itemId === "a");
    expect(reviewedA).toBeDefined();
    expect(reviewedA?.repetitions).toBe(2);
    expect(reviewedA?.interval).toBe(6);
    expect(reviewedA?.easeFactor).toBeCloseTo(2.36, 10);

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.isSaving).toBe(false);
  });

  it("accumulates entries across multiple rated cards", async () => {
    const reviewData: ReviewData = {
      lessonId: "fixture-lesson",
      entries: [
        entry({
          itemId: "a",
          repetitions: 1,
          easeFactor: 2.5,
          interval: 1,
          nextReviewAt: "2026-02-20T00:00:00.000Z",
        }),
      ],
    };
    const onSave = createOnSaveMock();

    const { result } = renderHook(() =>
      useFlashcardsSM2([cards[0], cards[1]], reviewData, onSave, true),
    );

    await act(async () => {
      await result.current.rateCard(3);
    });

    await act(async () => {
      await result.current.rateCard(5);
    });

    expect(onSave).toHaveBeenCalledTimes(2);

    const secondSave = onSave.mock.calls[1][0] as ReviewData;
    expect(secondSave.entries).toHaveLength(2);
    expect(secondSave.entries.some((reviewEntry) => reviewEntry.itemId === "a")).toBe(true);
    expect(secondSave.entries.some((reviewEntry) => reviewEntry.itemId === "b")).toBe(true);
  });

  it("becomes complete after rating the last session card", async () => {
    const onSave = createOnSaveMock();
    const { result } = renderHook(() =>
      useFlashcardsSM2([cards[0]], null, onSave, true),
    );

    expect(result.current.sessionComplete).toBe(false);

    await act(async () => {
      await result.current.rateCard(5);
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentCard).toBeUndefined();
    expect(result.current.sessionComplete).toBe(true);
  });

  it("uses empty lessonId when review data is null", async () => {
    const onSave = createOnSaveMock();
    const singleCardSession: Flashcard[] = [cards[0]];

    const { result } = renderHook(() =>
      useFlashcardsSM2(singleCardSession, null, onSave, true),
    );

    await act(async () => {
      await result.current.rateCard(5);
    });

    const saved = onSave.mock.calls[0][0] as ReviewData;
    expect(saved.lessonId).toBe("");
    expect(saved.entries).toHaveLength(1);
    expect(saved.entries[0]?.itemId).toBe("a");
  });

  it("prevents second rating while save is in progress", async () => {
    let resolveSave: (() => void) | undefined;
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useFlashcardsSM2([cards[0], cards[1]], null, onSave, true),
    );

    let firstCallPromise: Promise<void> | undefined;

    await act(async () => {
      firstCallPromise = result.current.rateCard(5);
    });

    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      await result.current.rateCard(5);
    });

    expect(onSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave?.();
      await firstCallPromise;
    });

    expect(result.current.isSaving).toBe(false);
  });

  it("does nothing when rating and there is no current card", async () => {
    const reviewData: ReviewData = {
      lessonId: "fixture-lesson",
      entries: cards.map((card) =>
        entry({ itemId: card.id, nextReviewAt: "2099-01-01T00:00:00.000Z" }),
      ),
    };
    const onSave = createOnSaveMock();

    const { result } = renderHook(() =>
      useFlashcardsSM2(cards, reviewData, onSave),
    );

    await act(async () => {
      await result.current.rateCard(5);
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.currentIndex).toBe(0);
  });

  it("resets session index to start", async () => {
    const onSave = createOnSaveMock();
    const { result } = renderHook(() =>
      useFlashcardsSM2([cards[0], cards[1]], null, onSave, true),
    );

    await act(async () => {
      await result.current.rateCard(5);
    });

    expect(result.current.currentIndex).toBe(1);

    act(() => {
      result.current.resetSession();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.sessionComplete).toBe(false);
    expect(result.current.currentCard?.id).toBe("a");
  });

  it("keeps learned entries after resetSession", async () => {
    const onSave = createOnSaveMock();
    const { result } = renderHook(() =>
      useFlashcardsSM2([cards[0]], null, onSave, true),
    );

    await act(async () => {
      await result.current.rateCard(5);
    });

    act(() => {
      result.current.resetSession();
    });

    await act(async () => {
      await result.current.rateCard(5);
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    const secondSave = onSave.mock.calls[1][0] as ReviewData;
    expect(secondSave.entries).toHaveLength(1);
    expect(secondSave.entries[0]?.itemId).toBe("a");
    expect(secondSave.entries[0]?.repetitions).toBe(2);
    expect(secondSave.entries[0]?.interval).toBe(6);
  });
});
