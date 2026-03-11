import {
  flashcardsToMd,
  mdToFlashcards,
  quizToMd,
  mdToQuiz,
  courseToMd,
  mdToCourse,
} from "@root/modules/md-formats";
import type { ContentFormatAdapter } from "../types";
import type {
  FlashcardsContent,
  QuizContent,
  Course,
} from "@root/src/lib/types";

export const flashcardsMarkdownAdapter: ContentFormatAdapter<FlashcardsContent> =
  {
    extension: ".md",
    serialize: flashcardsToMd,
    deserialize: mdToFlashcards,
  };

export const quizMarkdownAdapter: ContentFormatAdapter<QuizContent> = {
  extension: ".md",
  serialize: quizToMd,
  deserialize: mdToQuiz,
};

export const courseMarkdownAdapter: ContentFormatAdapter<Course> = {
  extension: ".md",
  serialize: (course) => courseToMd(course),
  deserialize: mdToCourse,
};
