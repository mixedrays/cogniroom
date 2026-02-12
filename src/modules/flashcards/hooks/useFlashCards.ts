import { useCallback, useMemo, useReducer } from "react";

type CardLike = {
  id: string;
  knownCount?: number;
};

export interface StudyState {
  flippedCards: number[];
  currentIndex: number;
  shuffledCards: number[] | undefined;
  flipCards: boolean;
}

export type StudyAction =
  | { type: "SET_CURRENT_INDEX"; index: number }
  | { type: "RESET_STUDY_STATE" }
  | { type: "TOGGLE_SHUFFLE_CARDS"; length: number | undefined }
  | { type: "TOGGLE_CARD_FLIP"; index: number }
  | { type: "TOGGLE_FLIP_CARDS"; flipCards: boolean };

export const initialState: StudyState = {
  flippedCards: [],
  currentIndex: 0,
  shuffledCards: undefined,
  flipCards: false,
};

export function studyReducer(
  state: StudyState,
  action: StudyAction,
): StudyState {
  switch (action.type) {
    case "SET_CURRENT_INDEX":
      return { ...state, currentIndex: action.index };
    case "TOGGLE_CARD_FLIP": {
      const index = action.index;
      return {
        ...state,
        flippedCards: state.flippedCards.includes(index)
          ? state.flippedCards.filter((i) => i !== index)
          : [...state.flippedCards, index],
      };
    }
    case "TOGGLE_SHUFFLE_CARDS": {
      const { length } = action;
      const shuffledCards =
        length === undefined
          ? undefined
          : Array.from({ length }, (_, i) => i).sort(() => Math.random() - 0.5);
      return { ...state, shuffledCards };
    }
    case "TOGGLE_FLIP_CARDS": {
      const { flipCards } = action;
      return { ...state, flipCards };
    }
    case "RESET_STUDY_STATE":
      return {
        ...state,
        flippedCards: initialState.flippedCards,
        currentIndex: initialState.currentIndex,
        shuffledCards: initialState.shuffledCards,
      };
    default:
      return state;
  }
}

export function useFlashCards<TCard extends CardLike>(
  cards: TCard[] = [],
  options?: { cardFilter?: (card: TCard) => boolean },
) {
  const [state, dispatch] = useReducer(studyReducer, initialState);

  const canResetStudyState =
    JSON.stringify({
      flippedCards: state.flippedCards,
      currentIndex: state.currentIndex,
    }) !==
    JSON.stringify({
      flippedCards: initialState.flippedCards,
      currentIndex: initialState.currentIndex,
    });

  const toggleCardFlip = (index: number) => {
    dispatch({ type: "TOGGLE_CARD_FLIP", index });
  };

  const setCurrentIndex = useCallback((index: number) => {
    dispatch({ type: "SET_CURRENT_INDEX", index });
  }, []);

  const resetStudyState = () => {
    dispatch({ type: "RESET_STUDY_STATE" });
  };

  const toggleShuffleCards = (length: number | undefined) => {
    dispatch({ type: "TOGGLE_SHUFFLE_CARDS", length });
  };

  const toggleFlipCards = (flipCards: boolean) => {
    dispatch({ type: "TOGGLE_FLIP_CARDS", flipCards });
  };

  const areCardsShuffled = state.shuffledCards !== undefined;
  const cardsToDisplay = useMemo(() => {
    const orderedCards = areCardsShuffled
      ? (state.shuffledCards
          ?.map((index) => cards[index])
          .filter(Boolean) as TCard[])
      : cards;

    return options?.cardFilter
      ? orderedCards.filter(options.cardFilter)
      : orderedCards;
  }, [areCardsShuffled, cards, options?.cardFilter, state.shuffledCards]);

  const currentCard = cardsToDisplay[state.currentIndex];
  const currentCardId = currentCard?.id;
  const cardsCount = cardsToDisplay.length || 0;

  const handleFlipCard = () => {
    toggleCardFlip(state.currentIndex);
  };

  const handleToggleFlipCards = () => {
    toggleFlipCards(!state.flipCards);
  };

  const handleToggleShuffleCards = () => {
    const length = areCardsShuffled ? undefined : cards.length;
    toggleShuffleCards(length);
  };

  return {
    ...state,
    areCardsShuffled,
    cardsToDisplay,
    currentCard,
    currentCardId,
    cardsCount,
    canResetStudyState,
    dispatch,
    toggleCardFlip,
    resetStudyState,
    setCurrentIndex,
    toggleShuffleCards,
    toggleFlipCards,
    handleFlipCard,
    handleToggleFlipCards,
    handleToggleShuffleCards,
  };
}
