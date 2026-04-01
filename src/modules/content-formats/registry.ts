import type {
  FlashcardsContent,
  QuizContent,
  Course,
} from "@modules/core";
import type { ContentFormatAdapter } from "./types";
import {
  flashcardsMarkdownAdapter,
  quizMarkdownAdapter,
  courseMarkdownAdapter,
} from "./adapters/markdown";

export interface FormatRegistry {
  flashcards: ContentFormatAdapter<FlashcardsContent>;
  quiz: ContentFormatAdapter<QuizContent>;
  course: ContentFormatAdapter<Course>;
}

let registry: FormatRegistry = {
  flashcards: flashcardsMarkdownAdapter,
  quiz: quizMarkdownAdapter,
  course: courseMarkdownAdapter,
};

export function getFormatAdapter<K extends keyof FormatRegistry>(
  key: K
): FormatRegistry[K] {
  return registry[key];
}

export function configureFormats(config: Partial<FormatRegistry>): void {
  registry = { ...registry, ...config };
}
