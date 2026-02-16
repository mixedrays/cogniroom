import { defineEventHandler, readBody } from "h3";
import { generateText, Output } from "ai";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { getOpenAIClient, type AvailableModelsId } from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";

const RoadmapDraftSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  topics: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string(),
        lessons: z
          .array(
            z.object({
              title: z.string().min(1),
              description: z.string(),
            })
          )
          .min(1)
          .max(12),
      })
    )
    .min(3)
    .max(12),
});

type SkillLevel = "beginner" | "intermediate" | "advanced";

type GenerateRoadmapRequest = {
  topic: string;
  level?: SkillLevel;
  model?: string;
  instructions?: string;
};

function toSafeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  // Defensive scrubbing just in case a provider includes auth headers.
  return raw
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]")
    .replace(/OPENAI_API_KEY\s*=\s*[^\s]+/gi, "OPENAI_API_KEY=[redacted]")
    .slice(0, 500);
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<GenerateRoadmapRequest>(event);

    const topic = body?.topic?.trim();
    const level = (body?.level ?? "beginner") as SkillLevel;
    const model = (body?.model ?? "gpt-4o-mini").trim();
    const additionalInstructions = body?.instructions?.trim()
      ? `\nAdditional Instructions from user: ${body.instructions.trim()}`
      : "";

    if (!topic) {
      return { success: false, error: "Missing topic" };
    }

    const prompt = await getRenderedPrompt("course-generation", { topic, level, additionalInstructions });

    const result = await generateText({
      model: getOpenAIClient(model as AvailableModelsId),
      prompt,
      output: Output.object({
        schema: RoadmapDraftSchema,
        name: "roadmap",
        description:
          "A learning roadmap with a title, description, topics, and lessons.",
      }),
    });

    const object = (await result.output) as z.infer<typeof RoadmapDraftSchema>;

    const now = new Date().toISOString();

    const roadmap = {
      id: uuidv4(),
      title: object.title,
      description: object.description ?? "",
      createdAt: now,
      updatedAt: now,
      source: "llm" as const,
      topics: object.topics.map((topicDraft) => ({
        id: uuidv4(),
        title: topicDraft.title,
        description: topicDraft.description ?? "",
        lessons: topicDraft.lessons.map((lessonDraft) => ({
          id: uuidv4(),
          title: lessonDraft.title,
          description: lessonDraft.description ?? "",
          completed: false,
        })),
      })),
    };

    return { success: true, roadmap };
  } catch (error) {
    console.error("Error generating roadmap:", error);

    const message = toSafeErrorMessage(error);

    return {
      success: false,
      error: message.includes("OPENAI_API_KEY")
        ? "OPENAI_API_KEY is not set. Add it to .env and restart the dev server."
        : message || "Failed to generate roadmap",
    };
  }
});
