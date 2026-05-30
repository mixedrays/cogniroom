import { randomUUID } from "node:crypto";
import { readdirSync } from "node:fs";
import { defineEventHandler, readBody, HTTPError } from "h3";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getLanguageModel, resolveModelId } from "@root/server/lib/llm";
import { getRenderedPrompt } from "@root/server/lib/promptService";
import { toErrorMessage } from "@root/server/lib/errors";
import { storageApi } from "@modules/storage";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import { composeAdditionalInstructions } from "@root/server/lib/composeAdditionalInstructions";
import { DECKS_DIR } from "@root/server/env";
import { generateUniqueDeckId } from "@modules/core";
import type { Deck, FlashcardsContent } from "@modules/core";

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

function timestampTitle(): string {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

export default defineEventHandler(async (event) => {
  try {
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

    const title = timestampTitle();
    let existingIds: string[] = [];
    try {
      existingIds = readdirSync(DECKS_DIR);
    } catch {}
    const id = generateUniqueDeckId(title, existingIds);

    const now = new Date().toISOString();
    const deck: Deck = {
      id,
      title,
      kind: "flashcards",
      source: "llm",
      createdAt: now,
      updatedAt: now,
    };

    await storageApi.post(storagePaths.deck(id), JSON.stringify(deck, null, 2));
    const adapter = getFormatAdapter("flashcards");
    await storageApi.post(
      storagePaths.deckFlashcards(id),
      adapter.serialize(content)
    );

    return { success: true, id, content };
  } catch (error: unknown) {
    if (error instanceof HTTPError) throw error;
    console.error("Error generating flashcards deck:", error);
    throw new HTTPError({
      status: 500,
      message: `Failed to generate flashcards deck: ${toErrorMessage(error)}`,
    });
  }
});
