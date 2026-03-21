import { describe, it, expect } from "vitest";
import { mdToFlashcards, flashcardsToMd } from "../flashcards";

describe("mdToFlashcards", () => {
  it("parses a basic card with plain text question and answer", () => {
    const md = `---
id: card-1
question: What is Python?
difficulty: easy
hint: Think scripting.
---

A high-level, interpreted programming language.

---`;

    const result = mdToFlashcards(md);
    expect(result.flashcards).toHaveLength(1);
    expect(result.flashcards[0]).toEqual({
      id: "card-1",
      question: "What is Python?",
      answer: "A high-level, interpreted programming language.",
      difficulty: "easy",
      hint: "Think scripting.",
    });
  });

  it("parses a card where question includes a code block", () => {
    const md = `---
id: card-1
question: What is the output of this code?

\`\`\`python
print("Hello, world!")
\`\`\`
difficulty: easy
hint: parentheses are required.
---

Output: Hello, world!

---`;

    const result = mdToFlashcards(md);
    expect(result.flashcards).toHaveLength(1);
    const card = result.flashcards[0];
    expect(card.question).toBe(
      'What is the output of this code?\n\n```python\nprint("Hello, world!")\n```'
    );
    expect(card.answer).toBe("Output: Hello, world!");
    expect(card.difficulty).toBe("easy");
  });

  it("parses a card where answer includes a code block", () => {
    const md = `---
id: card-2
question: How do you print in Python?
difficulty: easy
---

Use the built-in print function:

\`\`\`python
print("text")
\`\`\`

---`;

    const result = mdToFlashcards(md);
    expect(result.flashcards).toHaveLength(1);
    const card = result.flashcards[0];
    expect(card.question).toBe("How do you print in Python?");
    expect(card.answer).toBe(
      'Use the built-in print function:\n\n```python\nprint("text")\n```'
    );
  });

  it("parses a card where both question and answer include code blocks", () => {
    const md = `---
id: card-3
question: What does this code print?

\`\`\`python
x = 5
y = x + 2
print(y)
\`\`\`
difficulty: medium
---

\`\`\`
7
\`\`\`

---`;

    const result = mdToFlashcards(md);
    expect(result.flashcards).toHaveLength(1);
    const card = result.flashcards[0];
    expect(card.question).toContain("```python");
    expect(card.question).toContain("print(y)");
    expect(card.answer).toContain("```");
    expect(card.answer).toContain("7");
  });

  it("does not treat --- inside a code block in the answer as a card boundary", () => {
    const md = `---
id: card-4
question: What does --- mean in YAML?
difficulty: easy
---

It is used as a document separator:

\`\`\`yaml
---
key: value
---
\`\`\`

---`;

    const result = mdToFlashcards(md);
    expect(result.flashcards).toHaveLength(1);
    expect(result.flashcards[0].answer).toContain("---");
    expect(result.flashcards[0].answer).toContain("key: value");
  });

  it("does not treat --- inside a code block in the question as a card boundary", () => {
    const md = `---
id: card-5
question: What is wrong with this YAML snippet?

\`\`\`yaml
---
key: value
---
\`\`\`
difficulty: easy
---

The document separators --- are correct; this snippet is valid YAML.

---`;

    const result = mdToFlashcards(md);
    expect(result.flashcards).toHaveLength(1);
    expect(result.flashcards[0].question).toContain("```yaml");
    expect(result.flashcards[0].question).toContain("key: value");
  });

  it("parses multiple cards correctly", () => {
    const md = `---
id: card-1
question: What is 1 + 1?
difficulty: easy
---

2

---
id: card-2
question: What does this print?

\`\`\`python
print(2 ** 8)
\`\`\`
difficulty: medium
---

256

---`;

    const result = mdToFlashcards(md);
    expect(result.flashcards).toHaveLength(2);
    expect(result.flashcards[0].question).toBe("What is 1 + 1?");
    expect(result.flashcards[0].answer).toBe("2");
    expect(result.flashcards[1].question).toContain("print(2 ** 8)");
    expect(result.flashcards[1].answer).toBe("256");
  });

  it("omits hint when not present", () => {
    const md = `---
id: card-1
question: Simple question?
difficulty: easy
---

Simple answer.

---`;

    const result = mdToFlashcards(md);
    expect(result.flashcards[0].hint).toBeUndefined();
  });

  it("defaults difficulty to medium when missing", () => {
    const md = `---
id: card-1
question: Simple question?
---

Simple answer.

---`;

    const result = mdToFlashcards(md);
    expect(result.flashcards[0].difficulty).toBe("medium");
  });

  it("returns version 2", () => {
    const md = `---
id: card-1
question: Q?
difficulty: easy
---

A.

---`;

    const result = mdToFlashcards(md);
    expect(result.version).toBe(2);
  });
});

describe("flashcardsToMd / mdToFlashcards round-trip", () => {
  it("round-trips a plain text card", () => {
    const content = {
      version: 2 as const,
      flashcards: [
        {
          id: "card-1",
          question: "What is Python?",
          answer: "A programming language.",
          difficulty: "easy" as const,
          hint: "Think scripting.",
        },
      ],
    };

    const md = flashcardsToMd(content);
    const parsed = mdToFlashcards(md);
    expect(parsed.flashcards[0]).toEqual(content.flashcards[0]);
  });

  it("round-trips a card with a code block in the answer", () => {
    const content = {
      version: 2 as const,
      flashcards: [
        {
          id: "card-2",
          question: "How do you print in Python?",
          answer: "```python\nprint('hello')\n```",
          difficulty: "easy" as const,
        },
      ],
    };

    const md = flashcardsToMd(content);
    const parsed = mdToFlashcards(md);
    expect(parsed.flashcards[0].question).toBe(content.flashcards[0].question);
    expect(parsed.flashcards[0].answer).toBe(content.flashcards[0].answer);
  });

  it("round-trips a card with a code block in the question", () => {
    const content = {
      version: 2 as const,
      flashcards: [
        {
          id: "card-3",
          question: "What does this print?\n\n```python\nprint(42)\n```",
          answer: "42",
          difficulty: "medium" as const,
        },
      ],
    };

    const md = flashcardsToMd(content);
    const parsed = mdToFlashcards(md);
    expect(parsed.flashcards[0].question).toBe(content.flashcards[0].question);
    expect(parsed.flashcards[0].answer).toBe(content.flashcards[0].answer);
  });
});
