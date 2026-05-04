import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  getLesson,
  getLessonFlashcards,
  getLessonQuiz,
  getLessonExercises,
} from "@/lib/courses";
import type {
  Flashcard,
  FlashcardsContent,
  QuizContent,
  QuizQuestion,
} from "@/modules/core";
import type { WizardAgentAttachment } from "../types";

export type LessonAttachmentKind =
  | "theory"
  | "flashcards"
  | "quiz"
  | "exercises";

const ATTACHMENT_LABELS: Record<LessonAttachmentKind, string> = {
  theory: "Theory",
  flashcards: "Flashcards",
  quiz: "Quiz",
  exercises: "Exercises",
};

function formatFlashcards(cards: Flashcard[]): string {
  return cards
    .map(
      (c, i) =>
        `${i + 1}. Q: ${c.question}\n   A: ${c.answer}${
          c.hint ? `\n   Hint: ${c.hint}` : ""
        }`
    )
    .join("\n");
}

function formatQuiz(questions: QuizQuestion[]): string {
  return questions
    .map((q, i) => {
      const head = `${i + 1}. ${q.question}`;
      if (q.type === "choice") {
        const opts = q.options
          .map(
            (o, idx) =>
              `   ${String.fromCharCode(65 + idx)}. ${o.text}${
                o.isCorrect ? " (correct)" : ""
              }`
          )
          .join("\n");
        return `${head}\n${opts}`;
      }
      return `${head}\n   Answer: ${q.answer ? "True" : "False"}`;
    })
    .join("\n\n");
}

interface UseLessonAttachmentsOptions {
  courseId: string;
  lessonId: string;
  enabled?: boolean;
}

export function useLessonAttachments({
  courseId,
  lessonId,
  enabled = true,
}: UseLessonAttachmentsOptions): WizardAgentAttachment[] {
  const results = useQueries({
    queries: [
      {
        queryKey: ["lesson", courseId, lessonId],
        queryFn: () => getLesson(courseId, lessonId),
        enabled,
      },
      {
        queryKey: ["lesson-flashcards", courseId, lessonId],
        queryFn: () => getLessonFlashcards(courseId, lessonId),
        enabled,
      },
      {
        queryKey: ["lesson-quiz", courseId, lessonId],
        queryFn: () => getLessonQuiz(courseId, lessonId),
        enabled,
      },
      {
        queryKey: ["lesson-exercises", courseId, lessonId],
        queryFn: () => getLessonExercises(courseId, lessonId),
        enabled,
      },
    ],
  });

  const [theoryQ, flashcardsQ, quizQ, exercisesQ] = results;
  const theoryContent = (theoryQ.data as { content: string } | null)?.content;
  const flashcardsContent = (
    flashcardsQ.data as { content: FlashcardsContent } | null
  )?.content;
  const quizContent = (quizQ.data as { content: QuizContent } | null)?.content;
  const exercisesContent = (exercisesQ.data as { content: string } | null)
    ?.content;

  return useMemo<WizardAgentAttachment[]>(() => {
    const list: WizardAgentAttachment[] = [];
    if (theoryContent) {
      list.push({
        id: "theory",
        label: ATTACHMENT_LABELS.theory,
        content: theoryContent,
      });
    }
    if (flashcardsContent?.flashcards?.length) {
      list.push({
        id: "flashcards",
        label: ATTACHMENT_LABELS.flashcards,
        content: formatFlashcards(flashcardsContent.flashcards),
      });
    }
    if (quizContent?.quizQuestions?.length) {
      list.push({
        id: "quiz",
        label: ATTACHMENT_LABELS.quiz,
        content: formatQuiz(quizContent.quizQuestions),
      });
    }
    if (exercisesContent) {
      list.push({
        id: "exercises",
        label: ATTACHMENT_LABELS.exercises,
        content: exercisesContent,
      });
    }
    return list;
  }, [theoryContent, flashcardsContent, quizContent, exercisesContent]);
}
