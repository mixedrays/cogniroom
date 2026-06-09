# Shared conventions

These rules apply to every CogniRoom content type. The format-specific files
(`roadmap.md`, `flashcards.md`, `quiz.md`, `course.md`) build on them.

## Resolve the data directory first

The content root is **configurable**: it is the `DATA_PATH` env var (see `.env`),
which defaults to `./data` (relative to the repo root). Do not assume `data/`.

Before writing, determine `<data>`:

```bash
# prints the resolved absolute content root
grep -E '^DATA_PATH=' .env 2>/dev/null | cut -d= -f2- || echo ./data
```

Use that value wherever `<data>` appears below. (The validator resolves the same
value automatically — run with no arguments to check the whole configured root.)

## Where things live

All content is under `<data>/` (the resolved content root):

| Content                | Path                                                          |
| ---------------------- | ------------------------------------------------------------ |
| Course / roadmap       | `<data>/courses/<course-id>/course.md`                       |
| Lesson theory          | `<data>/courses/<course-id>/lessons/<lesson-id>/lesson.md`   |
| Lesson flashcards      | `<data>/courses/<course-id>/lessons/<lesson-id>/flashcards.md`|
| Lesson quiz            | `<data>/courses/<course-id>/lessons/<lesson-id>/quiz.md`     |
| Lesson exercise        | `<data>/courses/<course-id>/lessons/<lesson-id>/exercise.md` |
| Standalone deck (meta) | `<data>/decks/<deck-id>/deck.json`                           |
| Standalone flashcards  | `<data>/decks/<deck-id>/flashcards.md`                       |
| Standalone quiz        | `<data>/decks/<deck-id>/quiz.md`                             |

The app detects per-lesson content by **file existence + non-empty size** — there
are no "hasFlashcards"-type flags to set. Just write the file.

## IDs and slugs

The directory name IS the id, and the `id` field inside the file MUST equal it.

Make a slug from a title with this rule (matches the app's `toSlug`):

1. lowercase
2. remove every character that is not `a-z`, `0-9`, or a space
3. collapse runs of spaces into single `-`
4. collapse runs of `-` into one
5. truncate to 50 characters
6. strip a trailing `-`

- **Course id / deck id**: slug of the title. Must be unique among existing
  `<data>/courses/*` (or `<data>/decks/*`) — if it collides, append `-2`, `-3`, …
- **Topic id**: slug of the topic title (unique within the course).
- **Lesson id**: `"<n>-<slug-of-lesson-title>"` where `<n>` is the 1-based lesson
  number across the whole course. Numbering keeps ids unique and ordered. The
  lesson's folder name under `lessons/` must be exactly this id.
- **Card / question id**: any short stable unique string within the file, e.g.
  `<deck-id>-01`, `q-03`. Must be unique within that file.

## Dates and source

- `createdAt` / `updatedAt`: ISO 8601, e.g. `2026-06-03T10:00:00.000Z` (use the
  current time; both may be equal for fresh content).
- `source`: use `llm` for generated content. (Valid course sources: `llm`,
  `import`, `extract`. Valid deck sources: `llm`, `manual`, `import`. Do not
  invent new values — the schema rejects them.)

## Frontmatter format (critical)

Files use repeated blocks delimited by lines that are exactly `---`. Each block is
`key: value` frontmatter, followed (for some types) by a markdown body.

Hard rules that keep the parser happy:

- A boundary is a line that is **exactly** `---`. Never put a bare `---` line
  inside a value, description, question, or answer — it will split the item. Use
  `***` or `___` for a horizontal rule in prose instead.
- Frontmatter keys match `^[\w-]+$` and are followed by `": "` (colon + space).
  Inside a frontmatter block, avoid body lines that start with `word: `, or they
  will be read as a new key. Keep `question:` / `description:` values on one line.
- Inside a fenced code block (```` ``` ```` or `~~~`), `---` lines are safe — the
  parser ignores them. Use fences for code in answers/explanations.

## The validation loop (always finish with this)

After writing files, run the standalone validator bundle with bare `node`
(no install needed — works from any agent):

```bash
node skills/bin/validate-content.mjs                    # validates the whole configured DATA_PATH
node skills/bin/validate-content.mjs <paths you wrote>  # validates just what you changed
```

Inside the app repo, `npm run validate:content [-- <paths>]` is an equivalent alias.

The validator parses your files with the app's real parsers and schemas. Treat
**errors** as blocking (fix and re-run until none remain). **Warnings** (e.g.
fewer than the recommended item count) are advisory.
