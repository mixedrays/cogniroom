import { z } from "zod";

const difficulty = z.enum(["easy", "medium", "hard"]);

const LessonOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const TopicOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  lessons: z.array(LessonOutputSchema),
});

export const RoadmapOutputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  topics: z.array(TopicOutputSchema),
});

export const FlashcardsContentOutputSchema = z.object({
  version: z.literal(2),
  flashcards: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      answer: z.string(),
      hint: z.string().optional(),
      difficulty,
    })
  ),
});

const ChoiceQuestionOutputSchema = z.object({
  type: z.literal("choice"),
  id: z.string(),
  question: z.string(),
  options: z.array(z.object({ text: z.string(), isCorrect: z.boolean() })),
  explanation: z.string().optional(),
  difficulty,
});

const TrueFalseQuestionOutputSchema = z.object({
  type: z.literal("true-false"),
  id: z.string(),
  question: z.string(),
  answer: z.boolean(),
  explanation: z.string().optional(),
  difficulty,
});

export const QuizContentOutputSchema = z.object({
  version: z.literal(2),
  quizQuestions: z.array(
    z.discriminatedUnion("type", [
      ChoiceQuestionOutputSchema,
      TrueFalseQuestionOutputSchema,
    ])
  ),
});
