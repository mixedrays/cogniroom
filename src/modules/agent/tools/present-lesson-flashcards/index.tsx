import { z } from "zod";
import { ContentBubble } from "@/modules/agent/components/ContentBubble";
import { FlashcardsContentOutputSchema } from "@/modules/agent/lib/contentOutputSchemas";
import type { AgentTool } from "@/modules/agent/types";

export const PresentLessonFlashcardsParamsSchema = z.object({
  content: FlashcardsContentOutputSchema,
  summary: z
    .string()
    .max(120)
    .optional()
    .describe(
      "Optional one-line caption shown next to the type badge. Never place substantive content here."
    ),
});

export type PresentLessonFlashcardsParams = z.infer<
  typeof PresentLessonFlashcardsParamsSchema
>;

function FlashcardsBubble(props: {
  params: unknown;
  streamingInput?: string;
  isStreaming?: boolean;
  onSubmit: (result: unknown) => void;
  onDismiss: () => void;
  context?: Record<string, unknown>;
  superseded?: boolean;
}) {
  return <ContentBubble type="flashcards" {...props} />;
}

export const presentLessonFlashcardsTool: AgentTool = {
  server: {
    name: "presentLessonFlashcards",
    description:
      "Generate and present a structured flashcards set (at least 8 cards) to the user as a preview bubble. The user can save or request revisions.",
    parameters: PresentLessonFlashcardsParamsSchema,
  },
  client: {
    name: "presentLessonFlashcards",
    Widget: FlashcardsBubble,
  },
};
