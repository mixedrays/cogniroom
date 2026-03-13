import { z } from "zod";

export const AgentMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), value: z.string() }),
  z.object({
    type: z.literal("radio"),
    question: z.string(),
    options: z.array(z.string()),
  }),
  z.object({
    type: z.literal("checkbox"),
    question: z.string(),
    options: z.array(z.string()),
  }),
  z.object({
    type: z.literal("slider"),
    question: z.string(),
    min: z.number(),
    max: z.number(),
    unit: z.string(),
  }),
  z.object({
    type: z.literal("text_input"),
    question: z.string(),
    placeholder: z.string().optional(),
  }),
  z.object({
    type: z.literal("preview"),
    prompt: z.string(),
    contentType: z.enum([
      "lesson",
      "flashcards",
      "quiz",
      "exercise",
      "roadmap",
    ]),
  }),
  z.object({
    type: z.literal("questions"),
    questions: z.array(
      z.object({
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
      })
    ),
  }),
]);

export type AgentMessage = z.infer<typeof AgentMessageSchema>;
