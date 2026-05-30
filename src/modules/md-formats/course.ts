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

import type {
  Course,
  Lesson,
  LessonSection,
  LessonSectionProgress,
  Topic,
} from "@modules/core";
import { LESSON_SECTIONS } from "@modules/core";
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
      for (const section of LESSON_SECTIONS) {
        const sectionProgress = lesson.progress?.[section];
        if (!sectionProgress) continue;
        lines.push(`${section}Completed: ${sectionProgress.completed}`);
        if (sectionProgress.completedAt)
          lines.push(`${section}CompletedAt: ${sectionProgress.completedAt}`);
      }
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
    const fm = i + 1 < parts.length ? parseFrontmatter(parts[i + 1]) : {};

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

      const progress: Partial<Record<LessonSection, LessonSectionProgress>> =
        {};
      for (const section of LESSON_SECTIONS) {
        const completed = fm[`${section}Completed`];
        if (completed === undefined) continue;
        const completedAt = fm[`${section}CompletedAt`];
        progress[section] = {
          completed: completed as boolean,
          ...(completedAt ? { completedAt: completedAt as string } : {}),
        };
      }
      // Legacy theory completion (pre-section migration) maps to the theory key.
      if (progress.theory === undefined && fm.completed !== undefined) {
        progress.theory = {
          completed: fm.completed as boolean,
          ...(fm.completedAt
            ? { completedAt: fm.completedAt as string }
            : {}),
        };
      }
      if (Object.keys(progress).length > 0) lesson.progress = progress;

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
