---
name: cogniroom-content
description: |
  Generate CogniRoom learning content (roadmaps/courses, flashcard decks, quiz
  decks) by writing files directly into the app's data/ directory, then
  self-validating them with the project validator.
  Use when: (1) User wants to create a course, roadmap, flashcards, or a quiz for
  CogniRoom, (2) User says "generate a course/roadmap/deck on X", "make flashcards
  for X", "build a quiz on X", or "/cogniroom-content", (3) User wants content
  authored outside the app (CLI/agent) that the app will pick up from data/.
  This is the entry point that lets the user pick WHAT to generate; for a single
  fixed type the focused skills cogniroom-roadmap, cogniroom-flashcards, and
  cogniroom-quiz can be used directly.
---

# CogniRoom Content Generator

Author CogniRoom content as files on disk. The app reads everything from `data/`,
so generated files appear in the app with no API call and no app code changes.

## Step 1 — Ask what to generate (unless already specified)

If the user has not already made it clear, ask them to choose ONE:

1. **Whole course** — roadmap + flashcards + quiz for every lesson, in one pass.
2. **Roadmap only** — just the course structure (topics + lessons), no content yet.
3. **Flashcards deck** — a standalone flashcard deck (not tied to a course).
4. **Quiz deck** — a standalone quiz deck (not tied to a course).
5. **Step by step** — start with the roadmap, then generate per-lesson content one
   lesson (or one section) at a time, pausing for the user between steps.

Also confirm the **topic/subject**, the **level** (beginner/intermediate/advanced),
and any size preferences (number of lessons, cards, questions).

## Step 2 — Read the format reference for the chosen type(s)

The exact on-disk formats and conventions live in this skill's `reference/` folder.
Read only what you need:

- Shared rules (ids, slugs, paths, dates, the validation loop): `reference/conventions.md`
- Roadmap (`course.md`): `reference/roadmap.md`
- Flashcards deck: `reference/flashcards.md`
- Quiz deck: `reference/quiz.md`
- Whole course / step-by-step (per-lesson layout): `reference/course.md`

## Step 3 — Generate the files

Write content into `data/` following the reference. Match the requested subject,
level, and counts. Aim for the recommended minimums (≥ 8 flashcards, ≥ 5 quiz
questions) so generation passes without warnings.

## Step 4 — Self-validate (required)

After writing, validate against the app's real parsers and schemas:

The validator is a standalone, dependency-free bundle at
`skills/bin/validate-content.mjs` — run it with bare `node` from any agent, no
install required. The content root is the configured `DATA_PATH` (see `.env`,
default `./data`), referred to as `<data>` here and in the reference docs. The
validator resolves it automatically, so with no path it checks the whole root:

```bash
node skills/bin/validate-content.mjs                       # validate the whole DATA_PATH
node skills/bin/validate-content.mjs <path-you-wrote>      # e.g. <data>/courses/<course-id>
node skills/bin/validate-content.mjs <data>/decks/<deck-id>
```

Inside the app repo, `npm run validate:content [-- <path>]` is an equivalent alias.

- **Errors** mean the app cannot load the content — fix them and re-run until clean.
- **Warnings** mean it loads but is below the recommended count — add items if the
  user wants a fuller set; otherwise they are acceptable.

Do not consider the task done until `validate:content` reports no errors for every
path you wrote. Report the final validator summary to the user.
