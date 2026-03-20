import { z } from "zod";

export const PresentContentParamsSchema = z.object({
  type: z.enum(["roadmap", "lesson", "quiz", "flashcards", "exercise"]),
  content: z.unknown(),
  summary: z.string().optional(),
});

export type PresentContentParams = z.infer<typeof PresentContentParamsSchema>;
