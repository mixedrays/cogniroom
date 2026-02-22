import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { useFlashCards } from "../useFlashCards";

type Card = { id: string; knownCount: number };

const cards: Card[] = [
  { id: "a", knownCount: 0 },
  { id: "b", knownCount: 2 },
  { id: "c", knownCount: 3 },
];

describe("useFlashCards", () => {
  it("sets initial state and derived values", () => {
    const { result } = renderHook(() => useFlashCards(cards));

    expect(result.current.cardsCount).toBe(3);
    expect(result.current.currentCardId).toBe("a");
    expect(result.current.areCardsShuffled).toBe(false);
  });

  it("filters cards via cardFilter option", () => {
    const cardFilter = (card: Card) => (card.knownCount ?? 0) < 3;
    const { result } = renderHook(() =>
      useFlashCards(cards, { cardFilter }),
    );

    expect(result.current.cardsCount).toBe(2);
    expect(result.current.cardsToDisplay.map((c) => c.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("toggles shuffle on and off", () => {
    const { result } = renderHook(() => useFlashCards(cards));

    act(() => {
      result.current.handleToggleShuffleCards();
    });

    expect(result.current.areCardsShuffled).toBe(true);
    expect(result.current.shuffledCards?.length).toBe(cards.length);

    act(() => {
      result.current.handleToggleShuffleCards();
    });

    expect(result.current.areCardsShuffled).toBe(false);
    expect(result.current.shuffledCards).toBeUndefined();
  });

  it("toggles flip cards", () => {
    const { result } = renderHook(() => useFlashCards(cards));

    expect(result.current.flipCards).toBe(false);

    act(() => {
      result.current.handleToggleFlipCards();
    });

    expect(result.current.flipCards).toBe(true);
  });
});
