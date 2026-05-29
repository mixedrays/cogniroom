import { randomUUID } from "node:crypto";
import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  getLanguageModel,
  type AvailableModelsId,
  DEFAULT_MODEL,
} from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import { composeAdditionalInstructions } from "@root/server/lib/composeAdditionalInstructions";
import {
  loadLessonContext,
  loadLessonTheoryBlock,
  buildLessonPromptVars,
} from "@root/server/lib/lessonContext";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";

const FlashcardsDraftSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      hint: z.string().nullable(),
      difficulty: z.enum(["easy", "medium", "hard"]),
    })
  ),
});

export default defineEventHandler(
  withErrorGuard("Failed to generate flashcards", async (event) => {
    const courseId = getRouterParam(event, "id");
    const lessonId = getRouterParam(event, "lessonId");
    const body = await readBody<{
      additionalInstructions?: string;
      model?: string;
      includeContent?: boolean;
      generationOptions?: string;
    }>(event);
    const model = (body?.model ?? DEFAULT_MODEL).trim() as AvailableModelsId;

    if (!courseId || !lessonId) {
      throw new HTTPError({
        status: 400,
        message: "Missing courseId or lessonId",
      });
    }

    const ctx = await loadLessonContext(courseId, lessonId);

    const additionalInstructions = await composeAdditionalInstructions(
      body?.generationOptions,
      body?.additionalInstructions
    );

    const lessonContent = await loadLessonTheoryBlock(
      courseId,
      lessonId,
      body?.includeContent !== false
    );

    const prompt = await getRenderedPrompt(
      "flashcards-generation",
      buildLessonPromptVars(ctx, additionalInstructions, lessonContent)
    );

    const result = await generateText({
      model: getLanguageModel(model),
      prompt,
      output: Output.object({
        schema: FlashcardsDraftSchema,
        name: "flashcards",
        description: "Flashcards for a lesson.",
      }),
    });

    const draft = result.output as z.infer<typeof FlashcardsDraftSchema>;

    const content = {
      version: 2 as const,
      flashcards: draft.flashcards.map((card) => ({
        id: randomUUID(),
        question: card.question,
        answer: card.answer,
        hint: card.hint ?? undefined,
        difficulty: card.difficulty,
      })),
    };

    const flashcardsAdapter = getFormatAdapter("flashcards");
    await storageApi.post(
      storagePaths.flashcards(courseId, lessonId),
      flashcardsAdapter.serialize(content)
    );

    return { success: true, content };
  })
);
