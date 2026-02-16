# Tests Data Format — Brainstorming

## Requirements

- Easy to store in filesystem or database
- Easy to generate via LLM API (structured output) or CLI skill (freeform generation)
- Must allow markdown formatting in content (code blocks, tables, bold, etc.)

## Core Tension

| Requirement                          | Favors structured (JSON/YAML) | Favors freeform (Markdown) |
| ------------------------------------ | ----------------------------- | -------------------------- |
| Database storage                     | ++                            | --                         |
| Filesystem storage                   | +                             | ++                         |
| LLM API generation (structured output) | ++                         | --                         |
| LLM CLI/skill generation             | -                             | ++                         |
| Markdown in content                  | - (escaping)                  | ++ (native)                |
| Programmatic access (UI rendering)   | ++                            | - (parsing)                |

## Options

### 1. JSON (current)

Structured, Zod-validated, markdown in string fields.

- Pro: API structured output, type-safe, easy DB storage (JSONB column)
- Con: Awful for CLI/manual generation, markdown escaping is fragile, not human-readable

### 2. YAML

Structured but human-friendly.

- Pro: Multiline strings (`|` block scalar) handle markdown natively, readable, easy to parse, LLMs produce it well
- Con: Indentation-sensitive (LLM can mess up), no native Zod structured output (needs post-parse validation), whitespace gotchas

### 3. Markdown with conventions

Heading levels encode structure.

```md
## Flashcard
**Q:** What is X?
**A:** X is... with **bold** and `code`

## Quiz: single-choice
**Q:** Which one?
- [x] Correct answer
- [ ] Wrong answer
> Explanation here
```

- Pro: Most natural for LLMs (both API and CLI), native markdown, human-editable, great for skills
- Con: Fragile parsing, hard to validate, ambiguity at edges, DB storage requires either blob or parse-to-JSON

### 4. MDC / Markdown Components (Nuxt Content style)

```md
::flashcard{difficulty="medium"}
What is X?
#answer
X is **something** with formatting
::

::quiz{type="single-choice"}
Which one is correct?
#options
- [x] This one
- [ ] Not this
#explanation
Because...
::
```

- Pro: Structured + markdown native, parseable with existing libraries, LLM-friendly
- Con: Non-standard syntax, needs custom parser or MDC dependency, learning curve

### 5. Frontmatter Markdown (per-file or concatenated)

```md
---
type: flashcard
id: f-1
difficulty: medium
---
## What is X?
X is **something** with full markdown
---
type: quiz
id: q-1
options: ["A", "B", "C", "D"]
answer: "A"
---
## Which one?
Explanation with **markdown**
```

- Pro: Standard pattern (blog posts, docs), good tooling support, metadata + content separated
- Con: Multiple items in one file is non-standard, single-item-per-file creates many files

### 6. Dual format (hybrid) — JSON canonical, markdown import/export ★

Store as JSON (for UI, DB, API). Accept markdown input from CLI/skill, convert to JSON on ingest. Export to markdown for review/editing.

- Pro: Best of both worlds, each path uses its optimal format
- Con: Maintaining two parsers, conversion bugs, drift between formats

### 7. JSON within Markdown

`.md` file with fenced JSON blocks.

- Pro: File is valid markdown, structured data is extractable, GitHub renders it nicely
- Con: Weird hybrid, still has JSON escaping issues for markdown content

## Ranking

| Rank | Option                           | Why                                                                                              |
| ---- | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1    | **Dual format (6)**              | JSON for API/DB/UI, markdown for CLI/skill generation. Conversion layer is a one-time cost       |
| 2    | **Markdown with conventions (3)** | If you commit to a solid parser, this is the most LLM-native format for both API and CLI        |
| 3    | **YAML (2)**                     | Good middle ground if you don't want dual formats. Multiline strings solve markdown-in-content   |

## Dual Format — Markdown Examples

Flashcards and quiz questions are stored in separate `.md` files.

### `flashcards.md`

```md
# Flashcards: JavaScript Closures

## What is a closure in JavaScript?

A closure is a function that **retains access** to its lexical scope even when executed outside that scope.

```js
function outer() {
  const x = 10;
  return function inner() {
    console.log(x); // closure over x
  };
}
```

---

## How does the `this` keyword behave inside an arrow function?

Arrow functions **do not have their own `this`** — they inherit `this` from the enclosing lexical scope.

This means `bind()`, `call()`, and `apply()` cannot override `this` in arrow functions.

---

## What is the difference between `var`, `let`, and `const`?

| Feature | `var` | `let` | `const` |
|---------|-------|-------|---------|
| Scope | Function | Block | Block |
| Hoisting | Yes (undefined) | Yes (TDZ) | Yes (TDZ) |
| Reassign | Yes | Yes | No |

> **TDZ** = Temporal Dead Zone — accessing before declaration throws `ReferenceError`.

---

## What does `Array.prototype.reduce()` do?

Executes a **reducer function** on each element, accumulating a single result:

```js
const sum = [1, 2, 3].reduce((acc, val) => acc + val, 0);
// sum === 6
```
```

### `quiz.md`

```md
# Quiz: JavaScript Closures

## What will this code output?

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```

- [ ] 0, 1, 2
- [x] 3, 3, 3
- [ ] undefined, undefined, undefined
- [ ] ReferenceError

> `var` is function-scoped, so all callbacks share the same `i` which is `3` after the loop ends.

---

## Which statement about closures is **false**?

- [ ] Closures can access variables from their outer function
- [ ] Closures retain references, not copies of values
- [x] Closures cannot outlive their outer function's execution
- [ ] Closures can lead to memory leaks if not handled properly

> Closures **can and do** outlive their outer function — that's the whole point.
```

### Conversion Rules

| Markdown element                    | Maps to                                    |
| ----------------------------------- | ------------------------------------------ |
| `# Flashcards: ...` / `# Quiz: ...` | File-level metadata (lesson title)        |
| `## ...`                            | `question` field                           |
| Content below `##` until next `---` | `answer` (flashcard) or explanation (quiz) |
| `- [x]`                            | Correct option                             |
| `- [ ]`                            | Incorrect option                           |
| `> blockquote` after options        | `explanation` field                        |
| `---`                              | Item separator                             |

### JSON Canonical Side (after conversion)

```json
{
  "version": 2,
  "flashcards": [
    {
      "id": "f-1",
      "question": "What is a closure in JavaScript?",
      "answer": "A closure is a function that **retains access** to its lexical scope..."
    }
  ]
}
```

The `answer` and `explanation` fields store raw markdown strings — the UI renders them with a markdown renderer. The `id` and `version` fields are added during conversion (not present in the `.md` source).

## Key Decision Point

What is the **primary generation path** going forward — API with structured output, or CLI skill generating files? That should drive the canonical format. The secondary path gets an adapter.
