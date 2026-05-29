import { z } from "zod";

/**
 * Runtime validation schemas for core business entities. These are the
 * source-of-truth shapes for inbound API payloads at the write boundary and
 * are kept aligned with the TypeScript interfaces in `./types`.
 */

export const lessonSectionSchema = z.enum([
  "theory",
  "flashcards",
  "quiz",
  "exercises",
]);

export const courseSourceSchema = z.enum(["llm", "import", "extract"]);

/**
 * Inbound lesson shape for course writes. `id` is optional because generated
 * roadmap previews omit it; the server derives a stable id from the title.
 */
export const lessonInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().optional(),
  hasContent: z.boolean().optional(),
  hasFlashcards: z.boolean().optional(),
  hasQuiz: z.boolean().optional(),
  hasExercises: z.boolean().optional(),
  theoryCompleted: z.boolean().optional(),
  theoryCompletedAt: z.string().optional(),
  flashcardsCompleted: z.boolean().optional(),
  flashcardsCompletedAt: z.string().optional(),
  quizCompleted: z.boolean().optional(),
  quizCompletedAt: z.string().optional(),
  exercisesCompleted: z.boolean().optional(),
  exercisesCompletedAt: z.string().optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().optional(),
});

export const topicInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  lessons: z.array(lessonInputSchema).optional(),
});

/**
 * Inbound payload accepted by `POST /api/courses`. The server regenerates
 * `id`/`updatedAt` and defaults `source`/`createdAt`, so they stay optional.
 */
export const courseCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  source: courseSourceSchema.optional(),
  sourceUrl: z.string().optional(),
  createdAt: z.string().optional(),
  topics: z.array(topicInputSchema).optional(),
});

/**
 * Inbound payload for `POST /api/courses/:id/lessons/:lessonId` (completion
 * toggle). When `completed` is omitted the server flips the current value.
 */
export const lessonCompletionUpdateSchema = z.object({
  completed: z.boolean().optional(),
  section: lessonSectionSchema.optional(),
});

/** Non-empty content body for theory/exercise text saves. */
export const lessonContentSchema = z.object({
  content: z.string().refine((value) => value.trim().length > 0, {
    message: "content must be a non-empty string",
  }),
});

export const reviewEntrySchema = z.object({
  itemId: z.string().min(1),
  repetitions: z.number(),
  easeFactor: z.number(),
  interval: z.number(),
  lastReviewedAt: z.string(),
  nextReviewAt: z.string(),
});

export const reviewDataSchema = z.object({
  lessonId: z.string(),
  entries: z.array(reviewEntrySchema),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type LessonCompletionUpdate = z.infer<
  typeof lessonCompletionUpdateSchema
>;
export type LessonContentInput = z.infer<typeof lessonContentSchema>;
