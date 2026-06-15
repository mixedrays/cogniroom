import type { AgentTool } from "../../types";
import { AskUserParamsSchema } from "./schema";
import { QuestionsBatchWidget } from "./Widget";
import { AskUserSubmittedView } from "./SubmittedView";

export const askUserTool: AgentTool<typeof AskUserParamsSchema> = {
  server: {
    name: "askUser",
    description: `
      Ask the user a batch of clarifying questions. Send 1–5 questions in a single call.
      Each question has a header (answer key), question text, and optional options array.
      Set multiSelect: true for questions where multiple answers are valid.
      Set allowFreeformInput: true when the user might want to type a custom answer.
      Mark the most likely default option with recommended: true.
    `,
    parameters: AskUserParamsSchema,
  },
  client: {
    name: "askUser",
    Widget: QuestionsBatchWidget,
    SubmittedWidget: AskUserSubmittedView,
    renderAbovePrompt: true,
  },
};

export type { AskUserParams, AskUserQuestion } from "./schema";
