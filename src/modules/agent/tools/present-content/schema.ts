import { z } from "zod";
import {
  RoadmapOutputSchema,
  FlashcardsContentOutputSchema,
  QuizContentOutputSchema,
} from "@/modules/agent/lib/contentOutputSchemas";

export const PresentContentParamsSchema = z.object({
  type: z.enum(["roadmap", "lesson", "quiz", "flashcards", "exercise"]),
  content: z.union([
    RoadmapOutputSchema,
    QuizContentOutputSchema,
    FlashcardsContentOutputSchema,
    z.string(),
  ]),
  summary: z.string().optional(),
});

export type PresentContentParams = z.infer<typeof PresentContentParamsSchema>;
