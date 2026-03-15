import type { AgentTool } from "../../types";
import { AskUserParamsSchema } from "./schema";
import { AskUserWidget } from "./Widget";

export const askUserTool: AgentTool<typeof AskUserParamsSchema> = {
  server: {
    name: "askUser",
    description:
      "Ask the user a question and wait for their response. Use type 'radio' for single-choice from a list, 'checkbox' for multi-choice from a list, 'text' for free text input.",
    parameters: AskUserParamsSchema,
  },
  client: {
    name: "askUser",
    Widget: AskUserWidget,
  },
};

export type { AskUserParams } from "./schema";
