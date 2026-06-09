---
name: cogniroom-roadmap
description: |
  Generate a standalone CogniRoom roadmap (course structure: topics + lessons) as
  a course.md file under <data>/courses/, then validate it.
  Use when: (1) User wants only a roadmap/course outline for CogniRoom (no lesson
  content yet), (2) User says "make a roadmap for X", "outline a course on X", or
  "/cogniroom-roadmap". For full courses with content, or to pick among content
  types, use the cogniroom-content skill instead.
---

# CogniRoom Roadmap

Generate a course roadmap and write it to disk; the app picks it up from `data/`.

1. Confirm the **subject**, **level**, and rough **number of lessons** if unclear.
2. Read the format references in the sibling skill:
   - `skills/cogniroom-content/reference/conventions.md`
   - `skills/cogniroom-content/reference/roadmap.md`
3. Write `<data>/courses/<course-id>/course.md` per that spec (`<course-id>` is the
   slug of the title and equals the folder name).
4. Validate and fix any errors before reporting done:
   ```bash
   node skills/bin/validate-content.mjs <data>/courses/<course-id>
   ```
