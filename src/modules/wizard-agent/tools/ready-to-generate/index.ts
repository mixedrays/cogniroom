import { ReadyToGenerateParamsSchema } from "./schema";
import { ReadyToGenerateWidget } from "./Widget";
import type { AgentTool } from "@/modules/agent/types";

export const readyToGenerateTool: AgentTool = {
  server: {
    name: "readyToGenerate",
    description:
      "Call this when you have gathered enough information to generate content. Provide the refined prompt and the content type.",
    parameters: ReadyToGenerateParamsSchema,
  },
  client: {
    name: "readyToGenerate",
    Widget: ReadyToGenerateWidget,
  },
};
