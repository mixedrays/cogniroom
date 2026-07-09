import { randomUUID } from "node:crypto";
import { defineEventHandler, readBody } from "h3";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getLanguageModel, resolveModelId } from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { composeAdditionalInstructions } from "@root/server/lib/composeAdditionalInstructions";
import { withErrorGuard } from "@root/server/lib/withErrorGuard";
import type { FlashcardsContent } from "@modules/core";

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
 * Stateless: returns generated flashcards without creating a deck. The client
 * persists the deck via the mode-dispatched `createDeck`.
 */
export default defineEventHandler(
  withErrorGuard("Failed to generate flashcards deck", async (event) => {
    const body = await readBody<{
      additionalInstructions?: string;
      model?: string;
      generationOptions?: string;
    }>(event);
    const model = resolveModelId(body?.model);

    const additionalInstructions = await composeAdditionalInstructions(
      body?.generationOptions,
      body?.additionalInstructions
    );

    const prompt = await getRenderedPrompt("deck-flashcards-generation", {
      additionalInstructions,
    });

    const result = await generateText({
      model: getLanguageModel(model),
      prompt,
      output: Output.object({
        schema: FlashcardsDraftSchema,
        name: "flashcards",
        description: "Flashcards for a standalone study deck.",
      }),
    });

    const draft = result.output as z.infer<typeof FlashcardsDraftSchema>;

    const content: FlashcardsContent = {
      version: 2,
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
