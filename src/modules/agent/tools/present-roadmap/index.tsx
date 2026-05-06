import { z } from "zod";
import { ContentBubble } from "@/modules/agent/components/ContentBubble";
import { RoadmapOutputSchema } from "@/modules/agent/lib/contentOutputSchemas";
import type { AgentTool } from "@/modules/agent/types";

export const PresentRoadmapParamsSchema = z.object({
  content: RoadmapOutputSchema,
  summary: z
    .string()
    .max(120)
    .optional()
    .describe(
      "Optional one-line caption shown next to the type badge. Never place substantive content here."
    ),
});

export type PresentRoadmapParams = z.infer<typeof PresentRoadmapParamsSchema>;

function RoadmapBubble(props: {
  params: unknown;
  streamingInput?: string;
  isStreaming?: boolean;
  onSubmit: (result: unknown) => void;
  onDismiss: () => void;
  context?: Record<string, unknown>;
  superseded?: boolean;
}) {
  return <ContentBubble type="roadmap" {...props} />;
}

export const presentRoadmapTool: AgentTool = {
  server: {
    name: "presentRoadmap",
    description:
      "Generate and present a complete course roadmap to the user as a preview bubble. The user can save or request revisions.",
    parameters: PresentRoadmapParamsSchema,
  },
  client: {
    name: "presentRoadmap",
    Widget: RoadmapBubble,
  },
};
