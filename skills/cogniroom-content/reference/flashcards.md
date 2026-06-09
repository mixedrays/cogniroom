# Flashcards

Read `conventions.md` first. The flashcards markdown format below is identical
whether the cards are a **standalone deck** or **per-lesson** content — only the
location and the extra `deck.json` differ.

## A) Standalone flashcard deck

Two files:

`<data>/decks/<deck-id>/deck.json`

```json
{
  "id": "<deck-id>",
  "title": "<Deck Title>",
  "description": "<optional one-line description>",
  "kind": "flashcards",
  "source": "llm",
  "createdAt": "2026-06-03T10:00:00.000Z",
  "updatedAt": "2026-06-03T10:00:00.000Z"
}
```

- `id` must equal the folder name `<deck-id>` (slug of the title, unique among
  `<data>/decks/*`).
- `kind` must be `"flashcards"`. Omit `description` entirely if there isn't one.

`<data>/decks/<deck-id>/flashcards.md` — see the format below.

## B) Per-lesson flashcards (inside a course)

One file, no `deck.json`:

`<data>/courses/<course-id>/lessons/<lesson-id>/flashcards.md`

`<lesson-id>` must exactly match a lesson id from the course's `course.md`.

## flashcards.md format

```markdown
---
id: <card-id-1>
question: What is X?
difficulty: easy
hint: <optional one-line hint>
---

A concise answer in markdown. 1–3 sentences is ideal. Code is allowed in
fenced blocks.

---
id: <card-id-2>
question: How does Y work?
difficulty: medium
---

The answer to the second card.

---
```

## Rules

- The file starts with `---` and **ends with a trailing `---`** after the last
  answer.
- Per card frontmatter: `id` (unique in file), `question` (one line), `difficulty`
  ∈ `easy|medium|hard`, and optional `hint` (one line). Omit `hint` if absent.
- The answer is the markdown between the closing `---` of the card and the next
  `---`. It must be non-empty.
- Never put a bare `---` line inside a question or answer (use `***` for a rule, or
  a code fence for code).
- Aim for **≥ 8 cards** with mixed difficulty (fewer is allowed but warns).

## Validate

```bash
# standalone deck (validates deck.json + flashcards.md together):
node skills/bin/validate-content.mjs <data>/decks/<deck-id>
# per-lesson:
node skills/bin/validate-content.mjs <data>/courses/<course-id>/lessons/<lesson-id>/flashcards.md
```
