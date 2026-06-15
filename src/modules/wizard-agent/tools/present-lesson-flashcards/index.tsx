import { z } from "zod";
import { ContentBubble } from "@/modules/wizard-agent/components/ContentBubble";
import { FlashcardsContentOutputSchema } from "@/modules/wizard-agent/lib/contentOutputSchemas";
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
      "Present a structured flashcards set (at least 8 cards) to the user as a preview bubble they can save. Use this for BOTH newly generated sets AND updates to an existing set — pass the FULL updated set (not just the changed cards) so the saved file is self-contained. The user can save the previewed content or request further revisions.",
    parameters: PresentLessonFlashcardsParamsSchema,
  },
  client: {
    name: "presentLessonFlashcards",
    Widget: FlashcardsBubble,
    hideWhenSubmitted: true,
    supersedable: true,
  },
};
