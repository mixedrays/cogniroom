---
name: cogniroom-quiz
description: |
  Generate a standalone CogniRoom quiz deck (deck.json + quiz.md) under
  <data>/decks/, then validate it.
  Use when: (1) User wants a standalone quiz/test for CogniRoom not tied to a
  course, (2) User says "make a quiz on X", "create a test for X", or
  "/cogniroom-quiz". For per-lesson quizzes or full courses, or to choose among
  content types, use the cogniroom-content skill instead.
---

# CogniRoom Quiz

Generate a standalone quiz deck and write it to disk.

1. Confirm the **subject**, **level**, and desired **number of questions** (aim ≥ 5).
2. Read the format references in the sibling skill:
   - `.claude/skills/cogniroom-content/reference/conventions.md`
   - `.claude/skills/cogniroom-content/reference/quiz.md` (section A,
     "Standalone quiz deck")
3. Write both files:
   - `<data>/decks/<deck-id>/deck.json` (`kind: "quiz"`)
   - `<data>/decks/<deck-id>/quiz.md`
   `<deck-id>` is the slug of the title and equals the folder name.
4. Validate and fix any errors before reporting done:
   ```bash
   node skills/bin/validate-content.mjs <data>/decks/<deck-id>
   ```
