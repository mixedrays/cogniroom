import { z } from "zod";

const difficulty = z.enum(["easy", "medium", "hard"]);

const LessonOutputSchema = z.object({
  title: z.string().min(1).describe("Concrete, action-oriented lesson title."),
  description: z
    .string()
    .min(1)
    .describe("One-sentence description of what the lesson covers."),
});

const TopicOutputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  lessons: z.array(LessonOutputSchema).min(1),
});

export const RoadmapOutputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  topics: z.array(TopicOutputSchema).min(1),
});

export const FlashcardsContentOutputSchema = z.object({
  version: z
    .literal(2)
    .describe("Schema version. Must be exactly the number 2."),
  flashcards: z
    .array(
      z.object({
        id: z.string().min(1).describe("Stable unique id for this card."),
        question: z
          .string()
          .min(1)
          .describe("Concise question focused on a single concept."),
        answer: z
          .string()
          .min(1)
          .describe("Short, accurate answer (1-3 sentences)."),
        hint: z.string().optional(),
        difficulty,
      })
    )
    .min(8)
    .describe(
      "At least 8 flashcards covering the lesson's key concepts, with mixed difficulty."
    ),
});

const ChoiceQuestionOutputSchema = z
  .object({
    type: z.literal("choice"),
    id: z.string().min(1),
    question: z.string().min(1),
    options: z
      .array(
        z.object({
          text: z.string().min(1),
          isCorrect: z.boolean(),
        })
      )
      .min(2)
      .max(6)
      .describe("Between 2 and 6 options, typically 3-4."),
    explanation: z.string().optional(),
    difficulty,
  })
  .refine((q) => q.options.some((o) => o.isCorrect), {
    message: "Choice question must have at least one correct option",
    path: ["options"],
  });

const TrueFalseQuestionOutputSchema = z.object({
  type: z.literal("true-false"),
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.boolean(),
  explanation: z.string().optional(),
  difficulty,
});

export const QuizContentOutputSchema = z.object({
  version: z
    .literal(2)
    .describe("Schema version. Must be exactly the number 2."),
  quizQuestions: z
    .array(
      z.discriminatedUnion("type", [
        ChoiceQuestionOutputSchema,
        TrueFalseQuestionOutputSchema,
      ])
    )
    .min(5)
    .describe(
      "At least 5 questions, mixing 'choice' and 'true-false' across difficulties."
    ),
});
