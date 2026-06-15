import { defineEventHandler, readBody, HTTPError } from "h3";
import { readdirSync } from "node:fs";
import { storageApi } from "@modules/storage";
import { DECKS_DIR } from "@root/server/env";
import { getFormatAdapter } from "@modules/content-formats";
import { storagePaths } from "@root/server/lib/storagePaths";
import { generateUniqueDeckId } from "@modules/core";
import {
  FlashcardsContentOutputSchema,
  QuizContentOutputSchema,
} from "@/modules/wizard-agent/lib/contentOutputSchemas";
import { toErrorMessage } from "@root/server/lib/errors";
import type {
  Deck,
  DeckKind,
  DeckSource,
  FlashcardsContent,
  QuizContent,
} from "@modules/core";

interface CreateDeckBody {
  title?: string;
  description?: string;
  kind?: DeckKind;
  source?: DeckSource;
  content?: unknown;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CreateDeckBody>(event);

    if (!body || typeof body.title !== "string" || body.title.trim() === "") {
      throw new HTTPError({ status: 400, message: "Missing deck title" });
    }
    if (body.kind !== "flashcards" && body.kind !== "quiz") {
      throw new HTTPError({
        status: 400,
        message: "Deck kind must be 'flashcards' or 'quiz'",
      });
    }

    let flashcards: FlashcardsContent | null = null;
    let quiz: QuizContent | null = null;
    if (body.content !== undefined && body.content !== null) {
      if (body.kind === "flashcards") {
        const parsed = FlashcardsContentOutputSchema.safeParse(body.content);
        if (!parsed.success) {
          throw new HTTPError({
            status: 400,
            message: `Invalid flashcards content: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
          });
        }
        flashcards = { version: 2, ...parsed.data };
      } else {
        const parsed = QuizContentOutputSchema.safeParse(body.content);
        if (!parsed.success) {
          throw new HTTPError({
            status: 400,
            message: `Invalid quiz content: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
          });
        }
        quiz = { version: 2, ...parsed.data };
      }
    }

    let existingIds: string[] = [];
    try {
      existingIds = readdirSync(DECKS_DIR);
    } catch {}
    const id = generateUniqueDeckId(body.title, existingIds);

    const now = new Date().toISOString();
    const deck: Deck = {
      id,
      title: body.title.trim(),
      description: body.description?.trim() || undefined,
      kind: body.kind,
      source: body.source ?? "manual",
      createdAt: now,
      updatedAt: now,
    };

    await storageApi.post(storagePaths.deck(id), JSON.stringify(deck, null, 2));

    if (flashcards) {
      const adapter = getFormatAdapter("flashcards");
      await storageApi.post(
        storagePaths.deckFlashcards(id),
        adapter.serialize(flashcards)
      );
    }
    if (quiz) {
      const adapter = getFormatAdapter("quiz");
      await storageApi.post(storagePaths.deckQuiz(id), adapter.serialize(quiz));
    }

    return { success: true, id };
  } catch (error) {
    if (error instanceof HTTPError) throw error;
    console.error("Error creating deck:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
