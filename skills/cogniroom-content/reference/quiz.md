# Quiz

Read `conventions.md` first. The quiz markdown format below is identical whether
the quiz is a **standalone deck** or **per-lesson** content — only the location and
the extra `deck.json` differ.

## A) Standalone quiz deck

`<data>/decks/<deck-id>/deck.json`

```json
{
  "id": "<deck-id>",
  "title": "<Deck Title>",
  "description": "<optional one-line description>",
  "kind": "quiz",
  "source": "llm",
  "createdAt": "2026-06-03T10:00:00.000Z",
  "updatedAt": "2026-06-03T10:00:00.000Z"
}
```

- `id` must equal the folder name. `kind` must be `"quiz"`.

`<data>/decks/<deck-id>/quiz.md` — see the format below.

## B) Per-lesson quiz (inside a course)

`<data>/courses/<course-id>/lessons/<lesson-id>/quiz.md` (no `deck.json`).
`<lesson-id>` must match a lesson id from `course.md`.

## quiz.md format

Two question types. Each block is frontmatter + a `## ` question line.

**Choice** (one or more correct options):

```markdown
---
id: <q-id-1>
type: choice
difficulty: easy
explanation: <optional one-line explanation>
---

## Which keyword declares a constant in JavaScript?

- [ ] var
- [x] const
- [ ] let

---
```

**True / false**:

```markdown
---
id: <q-id-2>
type: true-false
difficulty: medium
answer: true
explanation: <optional one-line explanation>
---

## TypeScript compiles to JavaScript.

---
```

## Rules

- The file ends with a trailing `---` after the last question.
- Frontmatter: `id` (unique), `type` ∈ `choice|true-false`, `difficulty` ∈
  `easy|medium|hard`, optional one-line `explanation`. For `true-false`, also
  `answer: true` or `answer: false`.
- The question text starts on a `## ` line right after the frontmatter. It may
  continue on following lines — e.g. a fenced code block under the heading —
  everything up to the options list (or the closing `---`) is the question.
- Choice options are `- [ ] wrong` and `- [x] correct`. A choice question needs
  **2–6 options and at least one `[x]` correct** option.
- True/false questions have no option list — just the `## ` statement.
- Never put a bare `---` inside a question or explanation.
- Aim for **≥ 5 questions**, mixing both types and difficulties (fewer warns).

## Validate

```bash
node skills/bin/validate-content.mjs <data>/decks/<deck-id>
# or per-lesson:
node skills/bin/validate-content.mjs <data>/courses/<course-id>/lessons/<lesson-id>/quiz.md
```
