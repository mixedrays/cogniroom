/**
 * Shareable-deck MD format serializer / deserializer.
 *
 * Wraps the per-item flashcards/quiz body (see `./flashcards`, `./quiz`) in a
 * document-level frontmatter carrying the deck's title, description and kind, so
 * a single copy/paste is enough to recreate a standalone deck on another device.
 *
 * ---
 * title: <deck title>
 * description: <optional>
 * kind: flashcards|quiz
 * ---
 *
 * <flashcards or quiz item markdown>
 */

import type { DeckKind, FlashcardsContent, QuizContent } from "@modules/core";
import { flashcardsToMd, mdToFlashcards } from "./flashcards";
import { quizToMd, mdToQuiz } from "./quiz";
import { parseFrontmatter } from "./parser";

export interface ShareableDeck {
  title: string;
  description?: string;
  kind: DeckKind;
  content: FlashcardsContent | QuizContent;
}

export function deckToShareMd(deck: ShareableDeck): string {
  const lines: string[] = ["---", `title: ${deck.title}`];
  if (deck.description) lines.push(`description: ${deck.description}`);
  lines.push(`kind: ${deck.kind}`, "---", "");
  lines.push(
    deck.kind === "flashcards"
      ? flashcardsToMd(deck.content as FlashcardsContent)
      : quizToMd(deck.content as QuizContent)
  );
  return lines.join("\n");
}

export function shareMdToDeck(text: string): ShareableDeck {
  const { frontmatter, body } = extractLeadingFrontmatter(text.trim());

  const kind = frontmatter.kind;
  if (kind !== "flashcards" && kind !== "quiz") {
    throw new Error(
      "Missing or invalid `kind` header — paste content exported from a deck."
    );
  }

  const title = typeof frontmatter.title === "string" ? frontmatter.title : "";
  const description =
    typeof frontmatter.description === "string"
      ? frontmatter.description
      : undefined;

  return {
    title,
    kind,
    ...(description ? { description } : {}),
    content: kind === "flashcards" ? mdToFlashcards(body) : mdToQuiz(body),
  };
}

/**
 * Extract the leading `---` … `---` document frontmatter, returning the parsed
 * key/value pairs and the remaining body. The body itself may start with `---`
 * (the first item), so only the first fenced block at the very top is consumed.
 */
function extractLeadingFrontmatter(text: string): {
  frontmatter: Record<string, string | boolean>;
  body: string;
} {
  const lines = text.split("\n");
  if (lines[0]?.trim() !== "---") return { frontmatter: {}, body: text };

  const end = lines.findIndex((line, i) => i > 0 && line.trim() === "---");
  if (end === -1) return { frontmatter: {}, body: text };

  return {
    frontmatter: parseFrontmatter(lines.slice(1, end).join("\n")),
    body: lines.slice(end + 1).join("\n").trim(),
  };
}
