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

export const lessonSectionProgressSchema = z.object({
  completed: z.boolean(),
  completedAt: z.string().optional(),
});

/** Per-section completion state, keyed by `LessonSection`. */
export const lessonProgressSchema = z.object({
  theory: lessonSectionProgressSchema.optional(),
  flashcards: lessonSectionProgressSchema.optional(),
  quiz: lessonSectionProgressSchema.optional(),
  exercises: lessonSectionProgressSchema.optional(),
});

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
  progress: lessonProgressSchema.optional(),
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

export const sourceKindSchema = z.enum([
  "image",
  "pdf",
  "document",
  "text",
  "webpage",
  "youtube",
]);

export const sourceScopeSchema = z.object({
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
});

export const sourceMetaSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  durationSec: z.number().optional(),
  pageCount: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const sourceSchema = z.object({
  id: z.string(),
  kind: sourceKindSchema,
  origin: z.enum(["upload", "link"]),
  delivery: z.enum(["native", "text"]),
  label: z.string(),
  source: z.string(),
  mimeType: z.string().optional(),
  byteSize: z.number().optional(),
  url: z.string().optional(),
  status: z.enum(["processing", "ready", "error"]),
  error: z.string().optional(),
  extractedText: z.string().optional(),
  extractedTokens: z.number().optional(),
  meta: sourceMetaSchema.optional(),
  scopes: z.array(sourceScopeSchema),
  refCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Lesson context supplied by the client to the stateless generation endpoints.
 * Mirrors the inputs of `buildLessonPromptVars`. In browser mode the server has
 * no filesystem to read the course from, so the client sends what the prompt
 * needs; `lessonContent` is the raw saved theory (the server wraps it into the
 * prompt's theory block).
 */
export const lessonGenerationContextSchema = z.object({
  courseTitle: z.string(),
  topicTitle: z.string(),
  topicDescription: z.string().optional(),
  lessonTitle: z.string(),
  lessonDescription: z.string().optional(),
  lessonContent: z.string().optional(),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type LessonCompletionUpdate = z.infer<
  typeof lessonCompletionUpdateSchema
>;
export type LessonContentInput = z.infer<typeof lessonContentSchema>;
export type LessonGenerationContext = z.infer<
  typeof lessonGenerationContextSchema
>;
