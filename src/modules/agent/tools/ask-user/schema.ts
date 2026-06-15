import { z } from "zod";

export const AskUserV2QuestionSchema = z.object({
  header: z.string(),
  question: z.string(),
  description: z.string().optional(),
  multiSelect: z.boolean().optional(),
  allowFreeformInput: z.boolean().optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        recommended: z.boolean().optional(),
      })
    )
    .optional(),
});

export const AskUserV2ParamsSchema = z.object({
  title: z.string().optional(),
  questions: z.array(AskUserV2QuestionSchema),
});

export type AskUserV2Question = z.infer<typeof AskUserV2QuestionSchema>;
export type AskUserV2Params = z.infer<typeof AskUserV2ParamsSchema>;
