import { useCallback, useMemo, useReducer } from "react";

type CardLike = {
  id: string;
  knownCount?: number;
};

export interface KnownCardsState<Id extends string = string> {
  knownCards: Record<Id, { status: boolean; knownCount: number }>;
  trackProgress: boolean;
  autoScroll: boolean;
  hideKnownCards: boolean;
}

export type KnownCardsAction<Id extends string = string> =
  | {
      type: "TOGGLE_KNOWN_CARD";
      id: Id;
      status: boolean;
      knownCount?: number;
    }
  | { type: "TOGGLE_TRACK_PROGRESS"; trackProgress: boolean }
  | { type: "TOGGLE_AUTO_SCROLL"; autoScroll: boolean }
  | { type: "TOGGLE_HIDE_KNOWN_CARDS"; hideKnownCards: boolean }
  | { type: "RESET_KNOWN_CARDS_STATE" };

export const knownCardsInitialState: KnownCardsState = {
  knownCards: {},
  trackProgress: true,
  autoScroll: false,
  hideKnownCards: true,
};

export function knownCardsReducer(
  state: KnownCardsState,
  action: KnownCardsAction,
): KnownCardsState {
  switch (action.type) {
    case "TOGGLE_KNOWN_CARD": {
      const { id, status, knownCount } = action;
      const currentStatus = state.knownCards[id]?.status;
      const currentKnownCards = { ...state.knownCards };

      if (currentStatus === status) {
        delete currentKnownCards[id];
        return { ...state, knownCards: currentKnownCards };
      }

      return {
        ...state,
        knownCards: {
          ...state.knownCards,
          [id]: {
            status,
            knownCount: status
              ? (knownCount ?? 0) + 1
              : Math.max(0, (knownCount ?? 0) - 1),
          },
        },
      };
    }
    case "TOGGLE_TRACK_PROGRESS":
      return { ...state, trackProgress: action.trackProgress };
    case "TOGGLE_AUTO_SCROLL":
      return { ...state, autoScroll: action.autoScroll };
    case "TOGGLE_HIDE_KNOWN_CARDS":
      return { ...state, hideKnownCards: action.hideKnownCards };
    case "RESET_KNOWN_CARDS_STATE":
      return {
        ...state,
        knownCards: knownCardsInitialState.knownCards,
        hideKnownCards: knownCardsInitialState.hideKnownCards,
      };
    default:
      return state;
  }
}

export function useKnownCards<TCard extends CardLike>() {
  const [state, dispatch] = useReducer(
    knownCardsReducer,
    knownCardsInitialState,
  );

  const toggleKnownCard = useCallback(
    (card: TCard | undefined, status: boolean) => {
      if (card === undefined) return;
      const { id, knownCount } = card;
      dispatch({ type: "TOGGLE_KNOWN_CARD", id, status, knownCount });
    },
    [],
  );

  const toggleTrackProgress = useCallback((trackProgress: boolean) => {
    dispatch({ type: "TOGGLE_TRACK_PROGRESS", trackProgress });
  }, []);

  const toggleAutoScroll = useCallback((autoScroll: boolean) => {
    dispatch({ type: "TOGGLE_AUTO_SCROLL", autoScroll });
  }, []);

  const toggleHideKnownCards = useCallback((hideKnownCards: boolean) => {
    dispatch({ type: "TOGGLE_HIDE_KNOWN_CARDS", hideKnownCards });
  }, []);

  const resetKnownCardsState = useCallback(() => {
    dispatch({ type: "RESET_KNOWN_CARDS_STATE" });
  }, []);

  const canFinishStudy = Object.keys(state.knownCards).length > 0;

  const getIsCardKnown = useCallback(
    (cardId: string | undefined) =>
      cardId !== undefined
        ? state.knownCards[cardId]?.status === true
        : undefined,
    [state.knownCards],
  );

  const getIsCardUnknown = useCallback(
    (cardId: string | undefined) =>
      cardId !== undefined
        ? state.knownCards[cardId]?.status === false
        : undefined,
    [state.knownCards],
  );

  const getStatuses = useCallback(
    (cards: TCard[]) =>
      cards.map((card) => state.knownCards[card.id]?.status),
    [state.knownCards],
  );

  const handleToggleKnownCard = useCallback(
    (
      card: TCard | undefined,
      cardId: string | undefined,
      status: boolean,
      options?: {
        canAutoScrollNext?: boolean;
        onAutoScrollNext?: () => void;
      },
    ) => {
      toggleKnownCard(card, status);

      const currentStatus = cardId && state.knownCards[cardId]?.status;
      const isStatusChanged = currentStatus !== status;

      if (
        state.autoScroll &&
        isStatusChanged &&
        (options?.canAutoScrollNext ?? true)
      ) {
        setTimeout(() => options?.onAutoScrollNext?.(), 250);
      }
    },
    [state.autoScroll, state.knownCards, toggleKnownCard],
  );

  const cardFilter = useMemo(
    () => (card: TCard) =>
      state.hideKnownCards ? (card.knownCount ?? 0) < 3 : true,
    [state.hideKnownCards],
  );

  return {
    ...state,
    canFinishStudy,
    cardFilter,
    toggleKnownCard,
    toggleTrackProgress,
    toggleAutoScroll,
    toggleHideKnownCards,
    resetKnownCardsState,
    getIsCardKnown,
    getIsCardUnknown,
    getStatuses,
    handleToggleKnownCard,
  };
}
