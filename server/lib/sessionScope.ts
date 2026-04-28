import { getQuery } from "h3";
import type { H3Event } from "h3";
import type { ContentType, SessionScope } from "./historyService";

const VALID_TYPES: ContentType[] = [
  "roadmap",
  "lesson",
  "quiz",
  "flashcards",
  "exercise",
];

export function parseSessionScope(event: H3Event): SessionScope {
  const query = getQuery(event);
  const contentType = String(query.contentType ?? "");
  if (!VALID_TYPES.includes(contentType as ContentType)) {
    throw new Error(`Invalid contentType: ${contentType}`);
  }
  const courseId = query.courseId ? String(query.courseId) : undefined;
  const lessonId = query.lessonId ? String(query.lessonId) : undefined;
  return { contentType: contentType as ContentType, courseId, lessonId };
}
