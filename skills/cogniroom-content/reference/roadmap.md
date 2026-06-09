# Roadmap (`course.md`)

A roadmap is the course structure: a course with topics, each topic with lessons.
It carries no lesson content — content (theory/flashcards/quiz/exercise) is added
per lesson later (see `course.md` reference for the whole-course flow).

Read `conventions.md` first for ids, slugs, dates, and the frontmatter rules.

## File

`<data>/courses/<course-id>/course.md`, where `<course-id>` is the slug of the course
title and equals the folder name.

## Structure

```markdown
---
id: <course-id>
title: <Course Title>
description: <one-line description of the course>
createdAt: 2026-06-03T10:00:00.000Z
updatedAt: 2026-06-03T10:00:00.000Z
source: llm
---

## <Topic 1 Title>

---
id: <topic-1-slug>
description: <one-line topic description>
---

### <Lesson 1 Title>

---
id: 1-<lesson-1-slug>
description: <one-line lesson description>
---

### <Lesson 2 Title>

---
id: 2-<lesson-2-slug>
description: <one-line lesson description>
---

## <Topic 2 Title>

---
id: <topic-2-slug>
description: <one-line topic description>
---

### <Lesson 3 Title>

---
id: 3-<lesson-3-slug>
description: <one-line lesson description>
---
```

## Rules

- Topic titles use `## `, lesson titles use `### `. Each is immediately followed by
  a `---` frontmatter block.
- Every topic has ≥ 1 lesson; the course has ≥ 1 topic.
- `id`, `title`, and `description` are required and must be non-empty.
- Do NOT add completion/progress fields (`theoryCompleted`, etc.) — those are
  runtime state the app manages.
- Keep each `description` on a single line with no bare `---`.
- Lesson ids are numbered across the whole course (`1-…`, `2-…`, `3-…`) and unique.

## Validate

```bash
node skills/bin/validate-content.mjs <data>/courses/<course-id>
```
