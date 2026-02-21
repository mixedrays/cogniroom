import { useState, useMemo, useCallback } from "react";
import type { Flashcard, ReviewEntry, ReviewData } from "@/lib/types";

export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

export function applySM2(
  entry: ReviewEntry | undefined,
  q: QualityRating,
  itemId: string
): ReviewEntry {
  const now = new Date();
  const prev = entry ?? {
    itemId,
    repetitions: 0,
    easeFactor: 2.5,
    interval: 1,
    lastReviewedAt: "",
    nextReviewAt: "",
  };

  let { repetitions, easeFactor, interval } = prev;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    easeFactor = Math.max(
      1.3,
      easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
    );
    repetitions += 1;
  }

  const nextReviewAt = new Date(
    now.getTime() + interval * 24 * 60 * 60 * 1000
  ).toISOString();

  return {
    itemId,
    repetitions,
    easeFactor,
    interval,
    lastReviewedAt: now.toISOString(),
    nextReviewAt,
  };
}

export function useFlashcardsSM2(
  cards: Flashcard[],
  initialReviewData: ReviewData | null,
  onSave: (data: ReviewData) => Promise<void>,
  forceAll = false
) {
  const now = useMemo(() => new Date().toISOString(), []);

  const { sessionCards, initialEntriesMap, dueCount, newCount } = useMemo(() => {
    const entriesMap: Record<string, ReviewEntry> = {};
    for (const entry of initialReviewData?.entries ?? []) {
      entriesMap[entry.itemId] = entry;
    }

    if (forceAll) {
      return {
        sessionCards: cards,
        initialEntriesMap: entriesMap,
        dueCount: 0,
        newCount: cards.length,
      };
    }

    const dueCards: Flashcard[] = [];
    const newCards: Flashcard[] = [];

    for (const card of cards) {
      const entry = entriesMap[card.id];
      if (!entry) {
        newCards.push(card);
      } else if (entry.nextReviewAt <= now) {
        dueCards.push(card);
      }
    }

    dueCards.sort((a, b) =>
      (entriesMap[a.id]?.nextReviewAt ?? "").localeCompare(
        entriesMap[b.id]?.nextReviewAt ?? ""
      )
    );

    return {
      sessionCards: [...dueCards, ...newCards],
      initialEntriesMap: entriesMap,
      dueCount: dueCards.length,
      newCount: newCards.length,
    };
  }, [cards, initialReviewData, now, forceAll]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [entriesMap, setEntriesMap] =
    useState<Record<string, ReviewEntry>>(initialEntriesMap);
  const [isSaving, setIsSaving] = useState(false);

  const sessionComplete = currentIndex >= sessionCards.length;
  const currentCard = sessionCards[currentIndex];

  const rateCard = useCallback(
    async (q: QualityRating) => {
      if (!currentCard || isSaving) return;

      const newEntry = applySM2(entriesMap[currentCard.id], q, currentCard.id);
      const newEntriesMap = { ...entriesMap, [currentCard.id]: newEntry };

      setEntriesMap(newEntriesMap);
      setCurrentIndex((i) => i + 1);
      setIsSaving(true);

      try {
        const reviewData: ReviewData = {
          lessonId: initialReviewData?.lessonId ?? "",
          entries: Object.values(newEntriesMap),
        };
        await onSave(reviewData);
      } finally {
        setIsSaving(false);
      }
    },
    [currentCard, entriesMap, isSaving, initialReviewData?.lessonId, onSave]
  );

  const resetSession = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  return {
    sessionCards,
    currentIndex,
    setCurrentIndex,
    currentCard,
    dueCount,
    newCount,
    sessionComplete,
    isSaving,
    rateCard,
    resetSession,
  };
}
