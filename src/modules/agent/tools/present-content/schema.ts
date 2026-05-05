import { z } from "zod";
import {
  RoadmapOutputSchema,
  FlashcardsContentOutputSchema,
  QuizContentOutputSchema,
} from "@/modules/agent/lib/contentOutputSchemas";

export const PresentContentParamsSchema = z.object({
  type: z.enum(["roadmap", "lesson", "quiz", "flashcards", "exercise"]),
  content: z
    .union([
      RoadmapOutputSchema,
      QuizContentOutputSchema,
      FlashcardsContentOutputSchema,
      z.string().min(200),
    ])
    .describe(
      "The full generated artifact. For lesson/exercise this MUST be the complete Markdown body (multi-paragraph, several hundred characters minimum) — never a summary or list of objectives."
    ),
  summary: z
    .string()
    .max(120)
    .optional()
    .describe(
      "Optional one-line caption shown next to the type badge (e.g. 'Intro, intuition-heavy'). Never place the lesson body, objectives, or any substantive content here."
    ),
});

export type PresentContentParams = z.infer<typeof PresentContentParamsSchema>;
