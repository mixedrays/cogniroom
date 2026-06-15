import { z } from "zod";
import { ContentBubble } from "@/modules/wizard-agent/components/ContentBubble";
import { RoadmapOutputSchema } from "@/modules/wizard-agent/lib/contentOutputSchemas";
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
      "Present a complete course roadmap to the user as a preview bubble they can save. Use this for BOTH newly generated roadmaps AND updates to an existing roadmap — pass the FULL updated roadmap (not a diff or the changed portion) so the saved file is self-contained. The user can save the previewed content or request further revisions.",
    parameters: PresentRoadmapParamsSchema,
  },
  client: {
    name: "presentRoadmap",
    Widget: RoadmapBubble,
    hideWhenSubmitted: true,
    supersedable: true,
  },
};
