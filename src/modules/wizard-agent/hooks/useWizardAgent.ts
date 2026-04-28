import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAgent } from "@/modules/agent/hooks/useAgent";
import { useChatBackend } from "@/modules/agent/hooks/useChatBackend";
import { askUserTool } from "@/modules/agent/tools/ask-user";
import { memoryTool } from "@/modules/agent/tools/memory";
import { presentContentTool } from "@/modules/agent/tools/present-content";
import type { AgentMessageState } from "@/modules/agent/types";
import type { WizardAgentContext } from "../components/WizardAgentDialog";
import type { SessionMeta } from "../types";

const TOOLS = [askUserTool, memoryTool, presentContentTool];

function scopeQuery(context: WizardAgentContext): string {
  const params = new URLSearchParams({ contentType: context.contentType });
  if (context.courseId) params.set("courseId", context.courseId);
  if (context.lessonId) params.set("lessonId", context.lessonId);
  return params.toString();
}

async function fetchSessions(
  context: WizardAgentContext
): Promise<SessionMeta[]> {
  try {
    const res = await fetch(
      `/api/wizard-agent/sessions?${scopeQuery(context)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.sessions) ? data.sessions : [];
  } catch {
    return [];
  }
}

async function fetchSession(
  context: WizardAgentContext,
  sessionId: string
): Promise<{ messages: AgentMessageState[]; meta: SessionMeta | null }> {
  try {
    const res = await fetch(
      `/api/wizard-agent/sessions/${encodeURIComponent(sessionId)}?${scopeQuery(context)}`
    );
    if (!res.ok) return { messages: [], meta: null };
    const data = await res.json();
    if (!data.session) return { messages: [], meta: null };
    const { messages, ...meta } = data.session;
    return {
      messages: Array.isArray(messages) ? messages : [],
      meta,
    };
  } catch {
    return { messages: [], meta: null };
  }
}

async function saveSession(
  context: WizardAgentContext,
  sessionId: string,
  messages: AgentMessageState[]
): Promise<SessionMeta | null> {
  try {
    const res = await fetch(
      `/api/wizard-agent/sessions/${encodeURIComponent(sessionId)}?${scopeQuery(context)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.session) return null;
    const session = data.session as SessionMeta & { messages: unknown };
    return {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      scope: session.scope,
    };
  } catch {
    return null;
  }
}

async function removeSession(
  context: WizardAgentContext,
  sessionId: string
): Promise<void> {
  try {
    await fetch(
      `/api/wizard-agent/sessions/${encodeURIComponent(sessionId)}?${scopeQuery(context)}`,
      { method: "DELETE" }
    );
  } catch {
    // non-critical
  }
}

function generateSessionId(): string {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

interface UseWizardAgentOptions {
  context: WizardAgentContext;
  contextPrompt?: string;
  active?: boolean;
  initialSessionId?: string;
}

export function useWizardAgent({
  context,
  contextPrompt,
  active = true,
  initialSessionId,
}: UseWizardAgentOptions) {
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() =>
    generateSessionId()
  );
  const sessionLoadedRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const invalidateSessionList = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["wizard-agent", "sessions", context.contentType],
    });
  }, [queryClient, context.contentType]);

  const getSystemPrompt = useCallback(async () => {
    const params = new URLSearchParams({
      contentType: context.contentType,
      context: JSON.stringify(context),
      ...(contextPrompt ? { contextPrompt } : {}),
    });
    const res = await fetch(`/api/wizard-agent/prompt?${params}`);
    const data = (await res.json()) as { prompt: string };
    return data.prompt;
  }, [context, contextPrompt]);

  const backend = useChatBackend(
    "/api/wizard-agent/chat",
    TOOLS,
    getSystemPrompt
  );

  const transportContext = useMemo(
    () =>
      (contextPrompt
        ? { ...context, contextPrompt }
        : context) as unknown as Record<string, unknown>,
    [context, contextPrompt]
  );

  const {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    submitToolResult,
    dismissToolCall,
    loadMessages,
  } = useAgent({
    backend,
    context: transportContext,
  });

  const refreshSessions = useCallback(async () => {
    const list = await fetchSessions(context);
    setSessions(list);
    return list;
  }, [context]);

  // Initial load: fetch session list, restore requested or most recent session
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      const list = await fetchSessions(context);
      if (cancelled) return;
      setSessions(list);

      const requested =
        initialSessionId && list.some((s) => s.id === initialSessionId)
          ? initialSessionId
          : null;
      const target = requested ?? (list.length > 0 ? list[0].id : null);

      if (target) {
        const { messages: msgs } = await fetchSession(context, target);
        if (cancelled) return;
        setCurrentSessionId(target);
        sessionLoadedRef.current = target;
        loadMessages(msgs);
      } else {
        const fresh = generateSessionId();
        setCurrentSessionId(fresh);
        sessionLoadedRef.current = fresh;
        loadMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, context, loadMessages, initialSessionId]);

  // Debounced save of current session
  useEffect(() => {
    if (!active) return;
    if (messages.length === 0) return;
    if (sessionLoadedRef.current !== currentSessionId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const meta = await saveSession(context, currentSessionId, messages);
      if (meta) {
        setSessions((prev) => {
          const others = prev.filter((s) => s.id !== meta.id);
          return [meta, ...others].sort((a, b) => b.updatedAt - a.updatedAt);
        });
        invalidateSessionList();
      }
    }, 1000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages, active, context, currentSessionId, invalidateSessionList]);

  const selectSession = useCallback(
    async (sessionId: string) => {
      if (sessionId === currentSessionId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const { messages: msgs } = await fetchSession(context, sessionId);
      setCurrentSessionId(sessionId);
      sessionLoadedRef.current = sessionId;
      loadMessages(msgs);
    },
    [context, currentSessionId, loadMessages]
  );

  const newSession = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const fresh = generateSessionId();
    setCurrentSessionId(fresh);
    sessionLoadedRef.current = fresh;
    loadMessages([]);
  }, [loadMessages]);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      await removeSession(context, sessionId);
      invalidateSessionList();
      const list = await refreshSessions();
      if (sessionId === currentSessionId) {
        if (list.length > 0) {
          const next = list[0];
          const { messages: msgs } = await fetchSession(context, next.id);
          setCurrentSessionId(next.id);
          sessionLoadedRef.current = next.id;
          loadMessages(msgs);
        } else {
          const fresh = generateSessionId();
          setCurrentSessionId(fresh);
          sessionLoadedRef.current = fresh;
          loadMessages([]);
        }
      }
    },
    [
      context,
      currentSessionId,
      loadMessages,
      refreshSessions,
      invalidateSessionList,
    ]
  );

  const handleToolSubmit = useCallback(
    (toolCallId: string, result: unknown) => {
      submitToolResult(toolCallId, result);
    },
    [submitToolResult]
  );

  const handleSubmit = useCallback(
    (text: string, model: string) => {
      setInput("");
      sendMessage(text, model);
    },
    [sendMessage]
  );

  const handleClear = useCallback(() => {
    newSession();
  }, [newSession]);

  return {
    tools: TOOLS,
    input,
    setInput,
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    submitToolResult: handleToolSubmit,
    dismissToolCall,
    loadMessages,
    handleSubmit,
    handleClear,
    hasMessages: messages.length > 0,
    context,
    sessions,
    currentSessionId,
    selectSession,
    newSession,
    deleteSession,
    refreshSessions,
  };
}
