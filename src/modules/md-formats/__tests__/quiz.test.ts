import { describe, it, expect } from "vitest";
import { mdToQuiz, quizToMd } from "../quiz";

describe("mdToQuiz", () => {
  it("parses a choice question with options", () => {
    const md = `---
id: q-1
type: choice
difficulty: easy
explanation: const declares a constant.
---

## Which keyword declares a constant in JavaScript?

- [ ] var
- [x] const
- [ ] let

---`;

    const result = mdToQuiz(md);
    expect(result.quizQuestions).toHaveLength(1);
    expect(result.quizQuestions[0]).toEqual({
      id: "q-1",
      type: "choice",
      question: "Which keyword declares a constant in JavaScript?",
      difficulty: "easy",
      explanation: "const declares a constant.",
      options: [
        { text: "var", isCorrect: false },
        { text: "const", isCorrect: true },
        { text: "let", isCorrect: false },
      ],
    });
  });

  it("parses a true-false question", () => {
    const md = `---
id: q-2
type: true-false
difficulty: medium
answer: true
---

## TypeScript compiles to JavaScript.

---`;

    const result = mdToQuiz(md);
    expect(result.quizQuestions).toHaveLength(1);
    expect(result.quizQuestions[0]).toEqual({
      id: "q-2",
      type: "true-false",
      question: "TypeScript compiles to JavaScript.",
      difficulty: "medium",
      answer: true,
    });
  });

  it("parses a question that continues with a fenced code block", () => {
    const md = `---
id: q-3
type: choice
difficulty: easy
---

## What will this code display?

\`\`\`python
print("Hello, Python!")
\`\`\`

- [ ] An error
- [x] Hello, Python!

---`;

    const result = mdToQuiz(md);
    expect(result.quizQuestions).toHaveLength(1);
    expect(result.quizQuestions[0].question).toBe(
      'What will this code display?\n\n```python\nprint("Hello, Python!")\n```'
    );
  });

  it("skips blocks without id or type and choice questions without options", () => {
    const md = `---
id: q-1
type: choice
difficulty: easy
---

## A choice question with no options is dropped.

---
type: true-false
difficulty: easy
answer: true
---

## A block without an id is dropped.

---`;

    const result = mdToQuiz(md);
    expect(result.quizQuestions).toHaveLength(0);
  });
});

describe("quizToMd round-trip", () => {
  it("is parse-stable for single-line questions", () => {
    const content = mdToQuiz(`---
id: q-1
type: true-false
difficulty: easy
answer: false
explanation: Python uses indentation.
---

## Python uses curly braces for blocks.

---`);

    expect(mdToQuiz(quizToMd(content))).toEqual(content);
  });

  it("is parse-stable for multi-line questions with code blocks", () => {
    const content = mdToQuiz(`---
id: q-1
type: choice
difficulty: medium
---

## What does this print?

\`\`\`js
console.log(typeof null)
\`\`\`

- [x] object
- [ ] null

---`);

    expect(content.quizQuestions).toHaveLength(1);
    const once = quizToMd(content);
    expect(mdToQuiz(once)).toEqual(content);
    // serializing again must not keep adding blank lines into the question
    expect(quizToMd(mdToQuiz(once))).toBe(once);
  });
});
