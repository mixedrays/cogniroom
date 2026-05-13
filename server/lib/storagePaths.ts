import { getFormatAdapter } from "@modules/content-formats";

export const storagePaths = {
  courseDir(courseId: string): string {
    return `courses/${courseId}`;
  },

  course(courseId: string): string {
    return `courses/${courseId}/course${getFormatAdapter("course").extension}`;
  },

  lesson(courseId: string, lessonId: string): string {
    return `courses/${courseId}/lessons/${lessonId}/lesson.md`;
  },

  flashcards(courseId: string, lessonId: string): string {
    return `courses/${courseId}/lessons/${lessonId}/flashcards${getFormatAdapter("flashcards").extension}`;
  },

  quiz(courseId: string, lessonId: string): string {
    return `courses/${courseId}/lessons/${lessonId}/quiz${getFormatAdapter("quiz").extension}`;
  },

  exercise(courseId: string, lessonId: string): string {
    return `courses/${courseId}/lessons/${lessonId}/exercise.md`;
  },

  reviews(courseId: string, lessonId: string): string {
    return `courses/${courseId}/lessons/${lessonId}/reviews.json`;
  },

  deckDir(deckId: string): string {
    return `decks/${deckId}`;
  },

  deck(deckId: string): string {
    return `decks/${deckId}/deck.json`;
  },

  deckFlashcards(deckId: string): string {
    return `decks/${deckId}/flashcards${getFormatAdapter("flashcards").extension}`;
  },

  deckQuiz(deckId: string): string {
    return `decks/${deckId}/quiz${getFormatAdapter("quiz").extension}`;
  },

  deckReviews(deckId: string): string {
    return `decks/${deckId}/reviews.json`;
  },
};
