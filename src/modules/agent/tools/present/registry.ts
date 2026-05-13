import type { AgentTool } from "@/modules/agent/types";
import { presentRoadmapTool } from "../present-roadmap";
import { presentLessonContentTool } from "../present-lesson-content";
import { presentLessonQuizTool } from "../present-lesson-quiz";
import { presentLessonFlashcardsTool } from "../present-lesson-flashcards";
import { presentLessonExercisesTool } from "../present-lesson-exercises";

export type PresentContentType =
  | "roadmap"
  | "lesson"
  | "quiz"
  | "flashcards"
  | "exercise";

export const PRESENT_TOOL_BY_CONTENT_TYPE: Record<
  PresentContentType,
  AgentTool
> = {
  roadmap: presentRoadmapTool,
  lesson: presentLessonContentTool,
  quiz: presentLessonQuizTool,
  flashcards: presentLessonFlashcardsTool,
  exercise: presentLessonExercisesTool,
};

export const PRESENT_TOOL_NAMES = new Set<string>(
  Object.values(PRESENT_TOOL_BY_CONTENT_TYPE).map((tool) => tool.server.name)
);

export function getPresentToolForContentType(
  contentType: PresentContentType
): AgentTool {
  return PRESENT_TOOL_BY_CONTENT_TYPE[contentType];
}
