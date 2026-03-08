/**
 * Course MD format serializer / deserializer.
 *
 * Structure:
 * ---
 * id: <course-id>
 * title: <title>
 * description: <description>
 * createdAt: <ISO date>
 * updatedAt: <ISO date>
 * source: llm|import|extract
 * sourceUrl: <optional>
 * ---
 *
 * ## <Topic Title>
 *
 * ---
 * id: <topic-id>
 * description: <topic description>
 * ---
 *
 * ### <Lesson Title>
 *
 * ---
 * id: <lesson-id>
 * description: <lesson description>
 * [completion fields...]
 * ---
 */

import type { Course, Lesson, Topic } from "../../src/lib/types";
import { parseFrontmatter, splitOnBoundaries } from "./parser";

export function courseToMd(course: Course): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push(`id: ${course.id}`);
  lines.push(`title: ${course.title}`);
  if (course.description) lines.push(`description: ${course.description}`);
  lines.push(`createdAt: ${course.createdAt}`);
  lines.push(`updatedAt: ${course.updatedAt}`);
  lines.push(`source: ${course.source}`);
  if (course.sourceUrl) lines.push(`sourceUrl: ${course.sourceUrl}`);
  lines.push("---");

  for (const topic of course.topics) {
    lines.push("");
    lines.push(`## ${topic.title}`);
    lines.push("");
    lines.push("---");
    lines.push(`id: ${topic.id}`);
    if (topic.description) lines.push(`description: ${topic.description}`);
    lines.push("---");

    for (const lesson of topic.lessons) {
      lines.push("");
      lines.push(`### ${lesson.title}`);
      lines.push("");
      lines.push("---");
      lines.push(`id: ${lesson.id}`);
      if (lesson.description) lines.push(`description: ${lesson.description}`);
      if (lesson.theoryCompleted !== undefined)
        lines.push(`theoryCompleted: ${lesson.theoryCompleted}`);
      if (lesson.theoryCompletedAt)
        lines.push(`theoryCompletedAt: ${lesson.theoryCompletedAt}`);
      if (lesson.flashcardsCompleted !== undefined)
        lines.push(`flashcardsCompleted: ${lesson.flashcardsCompleted}`);
      if (lesson.flashcardsCompletedAt)
        lines.push(`flashcardsCompletedAt: ${lesson.flashcardsCompletedAt}`);
      if (lesson.quizCompleted !== undefined)
        lines.push(`quizCompleted: ${lesson.quizCompleted}`);
      if (lesson.quizCompletedAt)
        lines.push(`quizCompletedAt: ${lesson.quizCompletedAt}`);
      if (lesson.exercisesCompleted !== undefined)
        lines.push(`exercisesCompleted: ${lesson.exercisesCompleted}`);
      if (lesson.exercisesCompletedAt)
        lines.push(`exercisesCompletedAt: ${lesson.exercisesCompletedAt}`);
      if (lesson.completed !== undefined)
        lines.push(`completed: ${lesson.completed}`);
      if (lesson.completedAt) lines.push(`completedAt: ${lesson.completedAt}`);
      lines.push("---");
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function mdToCourse(text: string): Course {
  // parts: ['', courseFM, body1, fm1, body2, fm2, ..., '']
  // Even indices (2,4,...): body segments containing ## or ### headings
  // Odd indices (1,3,...): frontmatter segments
  const parts = splitOnBoundaries(text.trim());

  if (parts.length < 2) {
    throw new Error("Invalid course.md: missing frontmatter");
  }

  const courseFm = parseFrontmatter(parts[1]);
  const topics: Topic[] = [];
  let currentTopic: Topic | null = null;

  for (let i = 2; i < parts.length - 1; i += 2) {
    const body = parts[i];
    const fm =
      i + 1 < parts.length ? parseFrontmatter(parts[i + 1]) : {};

    const topicMatch = body.match(/^## (.+)$/m);
    if (topicMatch) {
      currentTopic = {
        id: (fm.id as string) ?? "",
        title: topicMatch[1].trim(),
        ...(fm.description ? { description: fm.description as string } : {}),
        lessons: [],
      };
      topics.push(currentTopic);
      continue;
    }

    const lessonMatch = body.match(/^### (.+)$/m);
    if (lessonMatch && currentTopic) {
      const lesson: Lesson = {
        id: (fm.id as string) ?? "",
        title: lessonMatch[1].trim(),
        ...(fm.description ? { description: fm.description as string } : {}),
      };

      if (fm.theoryCompleted !== undefined)
        lesson.theoryCompleted = fm.theoryCompleted as boolean;
      if (fm.theoryCompletedAt)
        lesson.theoryCompletedAt = fm.theoryCompletedAt as string;
      if (fm.flashcardsCompleted !== undefined)
        lesson.flashcardsCompleted = fm.flashcardsCompleted as boolean;
      if (fm.flashcardsCompletedAt)
        lesson.flashcardsCompletedAt = fm.flashcardsCompletedAt as string;
      if (fm.quizCompleted !== undefined)
        lesson.quizCompleted = fm.quizCompleted as boolean;
      if (fm.quizCompletedAt)
        lesson.quizCompletedAt = fm.quizCompletedAt as string;
      if (fm.exercisesCompleted !== undefined)
        lesson.exercisesCompleted = fm.exercisesCompleted as boolean;
      if (fm.exercisesCompletedAt)
        lesson.exercisesCompletedAt = fm.exercisesCompletedAt as string;
      if (fm.completed !== undefined) lesson.completed = fm.completed as boolean;
      if (fm.completedAt) lesson.completedAt = fm.completedAt as string;

      currentTopic.lessons.push(lesson);
    }
  }

  return {
    id: (courseFm.id as string) ?? "",
    title: (courseFm.title as string) ?? "",
    ...(courseFm.description
      ? { description: courseFm.description as string }
      : {}),
    createdAt: (courseFm.createdAt as string) ?? "",
    updatedAt: (courseFm.updatedAt as string) ?? "",
    source: (courseFm.source as "llm" | "import" | "extract") ?? "llm",
    ...(courseFm.sourceUrl ? { sourceUrl: courseFm.sourceUrl as string } : {}),
    topics,
  };
}
