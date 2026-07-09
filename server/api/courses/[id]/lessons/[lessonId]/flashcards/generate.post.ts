import { randomUUID } from "node:crypto";
import { defineEventHandler, readBody, HTTPError } from "h3";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getLanguageModel, resolveModelId } from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { composeAdditionalInstructions } from "@root/server/lib/composeAdditionalInstructions";
import { buildLessonPromptVarsFromContext } from "@root/server/lib/lessonContext";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";
import { lessonGenerationContextSchema } from "@modules/core";

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

/**
 * Stateless: returns generated flashcards without persisting. The client saves
 * via the mode-dispatched `saveLessonFlashcards`. The optional "include lesson
 * theory" is supplied by the client in `context.lessonContent`.
 */
export default defineEventHandler(
  withErrorGuard("Failed to generate flashcards", async (event) => {
    const body = await readBody<{
      context?: unknown;
      additionalInstructions?: string;
      model?: string;
      generationOptions?: string;
    }>(event);

    const parsedContext = lessonGenerationContextSchema.safeParse(body?.context);
    if (!parsedContext.success) {
      throw new HTTPError({
        status: 400,
        message: `Invalid lesson context: ${parsedContext.error.issues[0]?.message ?? "validation failed"}`,
      });
    }

    const model = resolveModelId(body?.model);

    const additionalInstructions = await composeAdditionalInstructions(
      body?.generationOptions,
      body?.additionalInstructions
    );

    const prompt = await getRenderedPrompt(
      "flashcards-generation",
      buildLessonPromptVarsFromContext(parsedContext.data, additionalInstructions)
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

    return { success: true, content };
  })
);
