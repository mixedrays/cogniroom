import { z } from "zod";

export const MemoryParamsSchema = z.object({
  action: z.enum(["read", "write"]),
  key: z
    .string()
    .describe("Memory file name without extension (e.g. 'user_preferences')"),
  content: z
    .string()
    .optional()
    .describe("Content to write. Required for write action."),
});

export type MemoryParams = z.infer<typeof MemoryParamsSchema>;
