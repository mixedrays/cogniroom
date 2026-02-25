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
    contentType: z.enum(["lesson", "flashcards", "quiz", "exercise", "roadmap"]),
  }),
]);

export type AgentMessage = z.infer<typeof AgentMessageSchema>;
