import { PresentContentParamsSchema } from "./schema";
import { ContentBubble } from "./Widget";
import type { AgentTool } from "@/modules/agent/types";

export const presentContentTool: AgentTool = {
  server: {
    name: "presentContent",
    description:
      "Generate and present content to the user as a preview bubble. The user can then save or request revisions. Use this instead of readyToGenerate — generate the full content directly here.",
    parameters: PresentContentParamsSchema,
  },
  client: {
    name: "presentContent",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Widget: ContentBubble as any,
  },
};

export { ContentBubble } from "./Widget";
export type { PresentContentParams } from "./schema";
