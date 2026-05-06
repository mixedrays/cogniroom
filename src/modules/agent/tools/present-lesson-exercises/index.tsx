import { z } from "zod";
import { ContentBubble } from "@/modules/agent/components/ContentBubble";
import type { AgentTool } from "@/modules/agent/types";

export const PresentLessonExercisesParamsSchema = z.object({
  content: z
    .string()
    .min(200)
    .describe(
      "The complete exercises body in Markdown containing 3-5 exercises. Each exercise needs an objective, step-by-step instructions, success criteria, and hints — never a summary or list of objectives."
    ),
  summary: z
    .string()
    .max(120)
    .optional()
    .describe(
      "Optional one-line caption shown next to the type badge. Never place substantive content here."
    ),
});

export type PresentLessonExercisesParams = z.infer<
  typeof PresentLessonExercisesParamsSchema
>;

function ExercisesBubble(props: {
  params: unknown;
  streamingInput?: string;
  isStreaming?: boolean;
  onSubmit: (result: unknown) => void;
  onDismiss: () => void;
  context?: Record<string, unknown>;
  superseded?: boolean;
}) {
  return <ContentBubble type="exercise" {...props} />;
}

export const presentLessonExercisesTool: AgentTool = {
  server: {
    name: "presentLessonExercises",
    description:
      "Generate and present a complete exercises body (Markdown, 3-5 exercises) to the user as a preview bubble. The user can save or request revisions.",
    parameters: PresentLessonExercisesParamsSchema,
  },
  client: {
    name: "presentLessonExercises",
    Widget: ExercisesBubble,
  },
};
