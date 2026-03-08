/**
 * Flashcards MD format serializer / deserializer.
 *
 * Format (one item):
 * ---
 * id: <uuid>
 * question: <question text>
 * difficulty: easy|medium|hard
 * hint: <optional hint>      ← omitted when absent
 * ---
 *
 * <answer markdown content>
 *
 * ---   ← item separator / start of next item
 */

import type { Flashcard, FlashcardsContent } from "../../src/lib/types";
import { parseFrontmatter, splitOnBoundaries } from "./parser";

export function flashcardsToMd(content: FlashcardsContent): string {
  const lines: string[] = [];

  for (const card of content.flashcards) {
    lines.push("---");
    lines.push(`id: ${card.id}`);
    lines.push(`question: ${card.question}`);
    lines.push(`difficulty: ${card.difficulty}`);
    if (card.hint) lines.push(`hint: ${card.hint}`);
    lines.push("---");
    lines.push("");
    lines.push(card.answer.trim());
    lines.push("");
  }

  lines.push("---");
  return lines.join("\n");
}

export function mdToFlashcards(text: string): FlashcardsContent {
  // parts: ['', fm1, content1, fm2, content2, ..., '']
  const parts = splitOnBoundaries(text.trim());
  const flashcards: Flashcard[] = [];

  // Skip parts[0] (empty before leading ---) and parts[last] (empty after trailing ---)
  for (let i = 1; i < parts.length - 1; i += 2) {
    const fm = parseFrontmatter(parts[i]);
    const answer = (parts[i + 1] ?? "").trim();

    if (!fm.id || !fm.question) continue;

    flashcards.push({
      id: fm.id as string,
      question: fm.question as string,
      answer,
      difficulty: (fm.difficulty as "easy" | "medium" | "hard") ?? "medium",
      ...(fm.hint ? { hint: fm.hint as string } : {}),
    });
  }

  return { version: 2, flashcards };
}
