import { defineEventHandler, readBody, HTTPError } from "h3";
import { storageApi } from "@modules/storage";
import {
  FlashcardsContentOutputSchema,
  QuizContentOutputSchema,
} from "@/modules/wizard-agent/lib/contentOutputSchemas";
import { toErrorMessage } from "@root/server/lib/errors";
import { assertServerStorageEnabled } from "@root/server/lib/assertServerStorageEnabled";
import { deckRepo } from "@modules/repository";
import type {
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
    assertServerStorageEnabled();
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

    return await deckRepo.createDeck(storageApi, {
      title: body.title,
      description: body.description,
      kind: body.kind,
      source: body.source,
      flashcards,
      quiz,
    });
  } catch (error) {
    if (error instanceof HTTPError) throw error;
    console.error("Error creating deck:", error);
    return { success: false, error: toErrorMessage(error) };
  }
});
