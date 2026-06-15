import { z } from "zod";

export const AskUserQuestionSchema = z.object({
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

export const AskUserParamsSchema = z.object({
  title: z.string().optional(),
  questions: z.array(AskUserQuestionSchema),
});

export type AskUserQuestion = z.infer<typeof AskUserQuestionSchema>;
export type AskUserParams = z.infer<typeof AskUserParamsSchema>;
