import type { AgentTool } from "../../types";
import { AskUserV2ParamsSchema } from "./schema";
import { AskUserV2Widget } from "./Widget";

export const askUserV2Tool: AgentTool<typeof AskUserV2ParamsSchema> = {
  server: {
    name: "askUserV2",
    description: `
      Ask the user a batch of clarifying questions rendered inline in the chat as a single card.
      Send 2–8 questions in a single call. All questions appear together on screen so the user can
      scan and answer them in one pass — prefer this over asking questions sequentially.
      Each question has:
        - header: stable answer key (used in the result map)
        - question: the question text shown to the user
        - description: optional one-line explanation shown under the question
        - options: array of { label, recommended? } — picks render as pill-style buttons
        - multiSelect: true when multiple answers are valid (otherwise single-select)
        - allowFreeformInput: true to render an inline "Other…" input alongside the options
      Mark the most likely default option with recommended: true so it is preselected.
      Provide an optional top-level title (e.g. "Quick questions about <product>").
      Every question automatically includes a "Decide for me" affordance — the user does not
      need it spelled out as an option. When an answer comes back as the string "Decide for me"
      (or contains it in a multiSelect array), the user is deferring that choice: pick a
      sensible default yourself based on the surrounding context.
    `,
    parameters: AskUserV2ParamsSchema,
  },
  client: {
    name: "askUserV2",
    Widget: AskUserV2Widget,
  },
};

export type { AskUserV2Params, AskUserV2Question } from "./schema";
