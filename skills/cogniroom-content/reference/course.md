# Whole course (roadmap + per-lesson content)

This is the "generate everything at once" and "step by step" flow. Read
`conventions.md`, `roadmap.md`, `flashcards.md`, and `quiz.md` first — this file
only adds the orchestration on top of those formats.

## Layout

```
<data>/courses/<course-id>/
  course.md                       # the roadmap (see roadmap.md)
  lessons/
    1-<lesson-slug>/
      lesson.md                   # theory (optional, free-form markdown)
      flashcards.md               # per-lesson flashcards (see flashcards.md)
      quiz.md                     # per-lesson quiz (see quiz.md)
      exercise.md                 # exercises (optional, free-form markdown)
    2-<lesson-slug>/
      ...
```

- The `lessons/<lesson-id>/` folder name MUST equal the lesson `id` in `course.md`.
- Per-lesson flashcards/quiz use the SAME markdown format as decks but have **no
  `deck.json`** — they live only as `flashcards.md` / `quiz.md` files.
- `lesson.md` (theory) and `exercise.md` are free-form markdown; the only
  requirement is that they are non-empty. They are optional.
- The app shows a section as available purely because its file exists and is
  non-empty — nothing else to toggle.

## All-at-once workflow

1. Generate and write `course.md` (the roadmap).
2. For each lesson, create its `lessons/<lesson-id>/` folder and write:
   - `lesson.md` — theory for the lesson (concise but complete).
   - `flashcards.md` — ≥ 8 cards covering the lesson.
   - `quiz.md` — ≥ 5 questions covering the lesson.
   - `exercise.md` — optional practice tasks.
3. Validate the whole tree at once and fix any errors:
   ```bash
   node skills/bin/validate-content.mjs <data>/courses/<course-id>
   ```

For large courses, write a few lessons, validate, then continue — so a format
mistake is caught early rather than after generating everything.

## Step-by-step workflow

1. Write and validate `course.md` only. Show the user the roadmap.
2. Then, one lesson (or one section: theory / flashcards / quiz / exercise) at a
   time: generate that file, validate just that path, and pause for the user
   before moving on.
   ```bash
   node skills/bin/validate-content.mjs <data>/courses/<course-id>/lessons/<lesson-id>
   ```
3. Continue until the user is satisfied. The user can stop after the roadmap, or
   after only flashcards, or only quizzes — generate just what they ask for.

## Done criterion

`node skills/bin/validate-content.mjs <data>/courses/<course-id>` reports **no errors**.
Warnings about low item counts are acceptable if the user wanted a smaller set.
