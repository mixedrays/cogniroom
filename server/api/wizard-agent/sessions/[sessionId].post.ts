import { defineEventHandler, getRouterParam, readBody } from "h3";
import {
  readSession,
  writeSession,
  type Session,
} from "@root/server/lib/historyService";
import { parseSessionScope } from "@root/server/lib/sessionScope";
import type { AgentMessageState } from "@/modules/agent/types";

function deriveTitle(messages: AgentMessageState[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser && firstUser.role === "user") {
    const text = firstUser.text.trim();
    if (text.length === 0) return "New session";
    return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  }
  return "New session";
}

export default defineEventHandler(async (event) => {
  const scope = parseSessionScope(event);
  const sessionId = getRouterParam(event, "sessionId") ?? "";
  const body = await readBody<{
    messages: AgentMessageState[];
    title?: string;
  }>(event);

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const existing = await readSession(scope, sessionId);
  const now = Date.now();

  const session: Session = {
    id: sessionId,
    title: body?.title ?? existing?.title ?? deriveTitle(messages),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    scope,
    messages,
  };

  // Refresh title from first user message if it changed and no explicit title was provided
  if (!body?.title && existing) {
    session.title = deriveTitle(messages);
  }

  await writeSession(scope, session);
  return { session };
});
