import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { useKnownCards } from "../useKnownCards";

type Card = { id: string; knownCount: number };

const cards: Card[] = [
  { id: "a", knownCount: 0 },
  { id: "b", knownCount: 2 },
  { id: "c", knownCount: 3 },
];

describe("useKnownCards", () => {
  it("has correct initial state", () => {
    const { result } = renderHook(() => useKnownCards<Card>());

    expect(result.current.knownCards).toEqual({});
    expect(result.current.trackProgress).toBe(true);
    expect(result.current.autoScroll).toBe(false);
    expect(result.current.hideKnownCards).toBe(true);
    expect(result.current.canFinishStudy).toBe(false);
  });

  it("toggles known card and updates knownCount", () => {
    const { result } = renderHook(() => useKnownCards<Card>());

    act(() => {
      result.current.toggleKnownCard(cards[0], true);
    });

    expect(result.current.knownCards.a?.status).toBe(true);
    expect(result.current.knownCards.a?.knownCount).toBe(1);
    expect(result.current.canFinishStudy).toBe(true);
    expect(result.current.getIsCardKnownStatus("a")).toBe(true);
    expect(result.current.getIsCardKnownStatus("b")).toBeUndefined();
  });

  it("untoggling same status removes the card entry", () => {
    const { result } = renderHook(() => useKnownCards<Card>());

    act(() => {
      result.current.toggleKnownCard(cards[0], true);
    });

    act(() => {
      result.current.toggleKnownCard(cards[0], true);
    });

    expect(result.current.knownCards.a).toBeUndefined();
    expect(result.current.canFinishStudy).toBe(false);
  });

  it("cardFilter hides cards with knownCount >= 3 when hideKnownCards is true", () => {
    const { result } = renderHook(() => useKnownCards<Card>());

    expect(result.current.cardFilter(cards[0])).toBe(true);
    expect(result.current.cardFilter(cards[1])).toBe(true);
    expect(result.current.cardFilter(cards[2])).toBe(false);
  });

  it("cardFilter shows all cards when hideKnownCards is false", () => {
    const { result } = renderHook(() => useKnownCards<Card>());

    act(() => {
      result.current.toggleHideKnownCards(false);
    });

    expect(result.current.cardFilter(cards[2])).toBe(true);
  });

  it("toggles settings", () => {
    const { result } = renderHook(() => useKnownCards<Card>());

    act(() => {
      result.current.toggleTrackProgress(false);
    });
    expect(result.current.trackProgress).toBe(false);

    act(() => {
      result.current.toggleAutoScroll(true);
    });
    expect(result.current.autoScroll).toBe(true);

    act(() => {
      result.current.toggleHideKnownCards(false);
    });
    expect(result.current.hideKnownCards).toBe(false);
  });

  it("resets state", () => {
    const { result } = renderHook(() => useKnownCards<Card>());

    act(() => {
      result.current.toggleKnownCard(cards[0], true);
      result.current.toggleAutoScroll(true);
    });

    expect(result.current.canFinishStudy).toBe(true);

    act(() => {
      result.current.resetKnownCardsState();
    });

    expect(result.current.knownCards).toEqual({});
    expect(result.current.canFinishStudy).toBe(false);
    expect(result.current.hideKnownCards).toBe(true);
  });

  it("getStatuses returns status for each card", () => {
    const { result } = renderHook(() => useKnownCards<Card>());

    act(() => {
      result.current.toggleKnownCard(cards[0], true);
      result.current.toggleKnownCard(cards[1], false);
    });

    const statuses = result.current.getStatuses(cards);
    expect(statuses).toEqual(["bg-green-500!", "bg-red-500!", undefined]);
  });
});
