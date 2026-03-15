import { z } from "zod";

export const AskUserQuestionSchema = z.object({
  header: z.string(),
  question: z.string(),
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

export const AskUserParamsSchema = z.object({
  questions: z.array(AskUserQuestionSchema),
});

export type AskUserQuestion = z.infer<typeof AskUserQuestionSchema>;
export type AskUserParams = z.infer<typeof AskUserParamsSchema>;
