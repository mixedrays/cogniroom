import { promises as fs } from "fs";
import path from "path";
import type { AgentMessageState } from "@/modules/agent/types";
import { HISTORY_DIR } from "@root/server/env";

export type ContentType =
  | "roadmap"
  | "lesson"
  | "quiz"
  | "flashcards"
  | "exercise";

export interface SessionScope {
  contentType: ContentType;
  courseId?: string;
  lessonId?: string;
}

export interface SessionMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  scope: SessionScope;
}

export interface Session extends SessionMeta {
  messages: AgentMessageState[];
}

function getRootDir(): string {
  return path.join(HISTORY_DIR, "wizard-agent");
}

function safeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getScopeDir(scope: SessionScope): string {
  const root = getRootDir();
  if (scope.contentType === "roadmap") {
    return path.join(root, "roadmap");
  }
  // Standalone deck creation: flashcards/quiz with no course/lesson context.
  if (
    (scope.contentType === "flashcards" || scope.contentType === "quiz") &&
    !scope.courseId &&
    !scope.lessonId
  ) {
    return path.join(root, "decks", scope.contentType);
  }
  if (!scope.courseId || !scope.lessonId) {
    throw new Error(
      `Scope for contentType "${scope.contentType}" requires courseId and lessonId`
    );
  }
  return path.join(
    root,
    "courses",
    safeSegment(scope.courseId),
    "lessons",
    safeSegment(scope.lessonId),
    scope.contentType
  );
}

function getSessionPath(scope: SessionScope, sessionId: string): string {
  return path.join(getScopeDir(scope), `${safeSegment(sessionId)}.json`);
}

export async function listSessions(
  scope: SessionScope
): Promise<SessionMeta[]> {
  const dir = getScopeDir(scope);
  let files: string[] = [];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }

  const metas: SessionMeta[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const text = await fs.readFile(path.join(dir, file), "utf-8");
      const data = JSON.parse(text) as Session;
      metas.push({
        id: data.id,
        title: data.title,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        scope: data.scope ?? scope,
      });
    } catch {
      // skip corrupt files
    }
  }
  return metas.sort((a, b) => b.createdAt - a.createdAt);
}

export async function readSession(
  scope: SessionScope,
  sessionId: string
): Promise<Session | null> {
  try {
    const text = await fs.readFile(getSessionPath(scope, sessionId), "utf-8");
    return JSON.parse(text) as Session;
  } catch {
    return null;
  }
}

export async function writeSession(
  scope: SessionScope,
  session: Session
): Promise<void> {
  const dir = getScopeDir(scope);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    getSessionPath(scope, session.id),
    JSON.stringify(session),
    "utf-8"
  );
}

export async function deleteSession(
  scope: SessionScope,
  sessionId: string
): Promise<void> {
  try {
    await fs.unlink(getSessionPath(scope, sessionId));
  } catch {
    // already gone
  }
}
