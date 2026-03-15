import { z } from "zod";

export const ReadyToGenerateParamsSchema = z.object({
  prompt: z.string(),
  contentType: z.enum(["lesson", "flashcards", "quiz", "exercise", "roadmap"]),
  summary: z.string().optional(),
});

export type ReadyToGenerateParams = z.infer<typeof ReadyToGenerateParamsSchema>;
