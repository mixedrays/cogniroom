import { z } from "zod";
import { ContentBubble } from "@/modules/agent/components/ContentBubble";
import type { AgentTool } from "@/modules/agent/types";

export const PresentLessonContentParamsSchema = z.object({
  content: z
    .string()
    .min(200)
    .describe(
      "The complete lesson body in Markdown (multi-paragraph, several hundred characters minimum) — never a summary or list of objectives."
    ),
  summary: z
    .string()
    .max(120)
    .optional()
    .describe(
      "Optional one-line caption shown next to the type badge. Never place the lesson body here."
    ),
});

export type PresentLessonContentParams = z.infer<
  typeof PresentLessonContentParamsSchema
>;

function LessonBubble(props: {
  params: unknown;
  streamingInput?: string;
  isStreaming?: boolean;
  onSubmit: (result: unknown) => void;
  onDismiss: () => void;
  context?: Record<string, unknown>;
  superseded?: boolean;
}) {
  return <ContentBubble type="lesson" {...props} />;
}

export const presentLessonContentTool: AgentTool = {
  server: {
    name: "presentLessonContent",
    description:
      "Generate and present a complete lesson body (Markdown) to the user as a preview bubble. The user can save or request revisions.",
    parameters: PresentLessonContentParamsSchema,
  },
  client: {
    name: "presentLessonContent",
    Widget: LessonBubble,
  },
};
