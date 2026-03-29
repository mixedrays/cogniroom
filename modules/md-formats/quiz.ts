/**
 * Quiz MD format serializer / deserializer.
 *
 * Choice question:
 * ---
 * id: <uuid>
 * type: choice
 * difficulty: easy|medium|hard
 * explanation: <optional>
 * ---
 *
 * ## <question text>
 *
 * - [ ] <wrong option>
 * - [x] <correct option>
 *
 * ---
 *
 * True-false question:
 * ---
 * id: <uuid>
 * type: true-false
 * difficulty: easy|medium|hard
 * answer: true|false
 * explanation: <optional>
 * ---
 *
 * ## <question statement>
 *
 * ---
 *
 * Multi choice questions:
 * ---
 * id: <uuid>
 * type: multi-choice
 * difficulty: easy|medium|hard
 * explanation: <optional>
 * ---
 *
 * ## <question statement>
 *
 * ---
 * - [ ] <wrong option>
 * - [x] <correct option>
 * - [x] <correct option>
 *
 * ---
 */

import type {
  ChoiceQuizQuestion,
  QuizContent,
  QuizQuestion,
  TrueFalseQuizQuestion,
} from "../../src/lib/types";
import { parseFrontmatter, splitOnBoundaries } from "./parser";

export function quizToMd(content: QuizContent): string {
  const lines: string[] = [];

  for (const q of content.quizQuestions) {
    lines.push("---");
    lines.push(`id: ${q.id}`);
    lines.push(`type: ${q.type}`);
    lines.push(`difficulty: ${q.difficulty}`);
    if (q.type === "true-false") lines.push(`answer: ${q.answer}`);
    if (q.explanation) lines.push(`explanation: ${q.explanation}`);
    lines.push("---");
    lines.push("");
    const questionLines = q.question.split("\n");
    lines.push(`## ${questionLines[0]}`);
    if (questionLines.length > 1) {
      lines.push("");
      lines.push(...questionLines.slice(1));
    }
    lines.push("");

    if (q.type === "choice") {
      for (const opt of q.options) {
        lines.push(opt.isCorrect ? `- [x] ${opt.text}` : `- [ ] ${opt.text}`);
      }
      lines.push("");
    }
  }

  lines.push("---");
  return lines.join("\n");
}

export function mdToQuiz(text: string): QuizContent {
  // parts: ['', fm1, body1, fm2, body2, ..., '']
  const parts = splitOnBoundaries(text.trim());
  const quizQuestions: QuizQuestion[] = [];

  for (let i = 1; i < parts.length - 1; i += 2) {
    const fm = parseFrontmatter(parts[i]);
    const body = (parts[i + 1] ?? "").trim();

    if (!fm.id || !fm.type) continue;

    const { question, options } = parseQuizBody(body);

    if (!question) continue;

    const base = {
      id: fm.id as string,
      question,
      difficulty: (fm.difficulty as "easy" | "medium" | "hard") ?? "medium",
      ...(fm.explanation ? { explanation: fm.explanation as string } : {}),
    };

    if (fm.type === "choice" && options.length > 0) {
      quizQuestions.push({
        ...base,
        type: "choice",
        options,
      } as ChoiceQuizQuestion);
    } else if (fm.type === "true-false") {
      quizQuestions.push({
        ...base,
        type: "true-false",
        answer: fm.answer as boolean,
      } as TrueFalseQuizQuestion);
    }
  }

  return { version: 2, quizQuestions };
}

function parseQuizBody(body: string): {
  question: string;
  options: { text: string; isCorrect: boolean }[];
} {
  const lines = body.split("\n");
  const questionLines: string[] = [];
  const options: { text: string; isCorrect: boolean }[] = [];
  let inQuestion = false;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      inQuestion = true;
      questionLines.push(line.slice(3));
    } else if (line.startsWith("- [x] ")) {
      inQuestion = false;
      options.push({ text: line.slice(6).trim(), isCorrect: true });
    } else if (line.startsWith("- [ ] ")) {
      inQuestion = false;
      options.push({ text: line.slice(6).trim(), isCorrect: false });
    } else if (inQuestion) {
      questionLines.push(line);
    }
  }

  while (
    questionLines.length > 0 &&
    questionLines[questionLines.length - 1].trim() === ""
  ) {
    questionLines.pop();
  }

  return { question: questionLines.join("\n"), options };
}
