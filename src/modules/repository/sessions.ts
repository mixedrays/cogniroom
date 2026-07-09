/**
 * Isomorphic wizard-agent chat session storage over a `StorageApi`. Mirrors the
 * on-disk layout used by `server/lib/historyService.ts`
 * (`history/wizard-agent/<scope>/<sessionId>.json`) so the browser local
 * repository and the server filesystem stay interchangeable.
 */

import type { StorageApi } from "@modules/storage/client";
import type { AgentMessageState } from "@/modules/agent/types";

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

const ROOT = "history/wizard-agent";

function safeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function scopeDir(scope: SessionScope): string {
  if (scope.contentType === "roadmap") {
    return `${ROOT}/roadmap`;
  }
  if (
    (scope.contentType === "flashcards" || scope.contentType === "quiz") &&
    !scope.courseId &&
    !scope.lessonId
  ) {
    return `${ROOT}/decks/${scope.contentType}`;
  }
  if (!scope.courseId || !scope.lessonId) {
    throw new Error(
      `Scope for contentType "${scope.contentType}" requires courseId and lessonId`
    );
  }
  return `${ROOT}/courses/${safeSegment(scope.courseId)}/lessons/${safeSegment(
    scope.lessonId
  )}/${scope.contentType}`;
}

function sessionPath(scope: SessionScope, sessionId: string): string {
  return `${scopeDir(scope)}/${safeSegment(sessionId)}.json`;
}

/** First-user-message-derived title, matching the server's session naming. */
export function deriveTitle(messages: AgentMessageState[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser && firstUser.role === "user") {
    const text = firstUser.text.trim();
    if (text.length === 0) return "New session";
    return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  }
  return "New session";
}

export async function listSessions(
  api: StorageApi,
  scope: SessionScope
): Promise<SessionMeta[]> {
  let entries;
  try {
    entries = await api.list(scopeDir(scope), {
      files: true,
      directories: false,
    });
  } catch {
    return [];
  }

  const metas: SessionMeta[] = [];
  for (const entry of entries) {
    if (!entry.name.endsWith(".json")) continue;
    try {
      const res = await api.get<string>(entry.path);
      if (!res.ok) continue;
      const data = JSON.parse(await res.text()) as Session;
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
  api: StorageApi,
  scope: SessionScope,
  sessionId: string
): Promise<Session | null> {
  try {
    const res = await api.get<string>(sessionPath(scope, sessionId));
    if (!res.ok) return null;
    return JSON.parse(await res.text()) as Session;
  } catch {
    return null;
  }
}

export async function writeSession(
  api: StorageApi,
  scope: SessionScope,
  sessionId: string,
  messages: AgentMessageState[],
  title?: string
): Promise<Session> {
  const existing = await readSession(api, scope, sessionId);
  const now = Date.now();
  const session: Session = {
    id: sessionId,
    title: title ?? deriveTitle(messages),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    scope,
    messages,
  };
  await api.put(sessionPath(scope, sessionId), JSON.stringify(session));
  return session;
}

export async function deleteSession(
  api: StorageApi,
  scope: SessionScope,
  sessionId: string
): Promise<void> {
  await api.delete(sessionPath(scope, sessionId));
}
