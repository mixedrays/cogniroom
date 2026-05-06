import { z } from "zod";
import { ContentBubble } from "@/modules/agent/components/ContentBubble";
import { QuizContentOutputSchema } from "@/modules/agent/lib/contentOutputSchemas";
import type { AgentTool } from "@/modules/agent/types";

export const PresentLessonQuizParamsSchema = z.object({
  content: QuizContentOutputSchema,
  summary: z
    .string()
    .max(120)
    .optional()
    .describe(
      "Optional one-line caption shown next to the type badge. Never place substantive content here."
    ),
});

export type PresentLessonQuizParams = z.infer<
  typeof PresentLessonQuizParamsSchema
>;

function QuizBubble(props: {
  params: unknown;
  streamingInput?: string;
  isStreaming?: boolean;
  onSubmit: (result: unknown) => void;
  onDismiss: () => void;
  context?: Record<string, unknown>;
  superseded?: boolean;
}) {
  return <ContentBubble type="quiz" {...props} />;
}

export const presentLessonQuizTool: AgentTool = {
  server: {
    name: "presentLessonQuiz",
    description:
      "Generate and present a structured quiz (mix of choice and true/false questions) to the user as a preview bubble. The user can save or request revisions.",
    parameters: PresentLessonQuizParamsSchema,
  },
  client: {
    name: "presentLessonQuiz",
    Widget: QuizBubble,
  },
};
