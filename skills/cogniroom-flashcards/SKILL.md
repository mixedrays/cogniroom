---
name: cogniroom-flashcards
description: |
  Generate a standalone CogniRoom flashcard deck (deck.json + flashcards.md) under
  <data>/decks/, then validate it.
  Use when: (1) User wants a standalone set of flashcards for CogniRoom not tied to
  a course, (2) User says "make flashcards on X", "create a flashcard deck for X",
  or "/cogniroom-flashcards". For per-lesson cards or full courses, or to choose
  among content types, use the cogniroom-content skill instead.
---

# CogniRoom Flashcards

Generate a standalone flashcard deck and write it to disk.

1. Confirm the **subject**, **level**, and desired **number of cards** (aim ≥ 8).
2. Read the format references in the sibling skill:
   - `skills/cogniroom-content/reference/conventions.md`
   - `skills/cogniroom-content/reference/flashcards.md` (section A,
     "Standalone flashcard deck")
3. Write both files:
   - `<data>/decks/<deck-id>/deck.json` (`kind: "flashcards"`)
   - `<data>/decks/<deck-id>/flashcards.md`
   `<deck-id>` is the slug of the title and equals the folder name.
4. Validate and fix any errors before reporting done:
   ```bash
   node skills/bin/validate-content.mjs <data>/decks/<deck-id>
   ```
