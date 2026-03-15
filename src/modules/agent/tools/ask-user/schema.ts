import { z } from "zod";

export const AskUserParamsSchema = z.object({
  question: z.string(),
  type: z.enum(["radio", "checkbox", "text"]),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
});

export type AskUserParams = z.infer<typeof AskUserParamsSchema>;
