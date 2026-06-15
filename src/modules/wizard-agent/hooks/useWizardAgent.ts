import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useChatBackend } from "@/modules/agent/hooks/useChatBackend";
import { askUserTool } from "@/modules/agent/tools/ask-user";
import { memoryTool } from "@/modules/agent/tools/memory";
import { getPresentToolForContentType } from "../tools/present/registry";
import type { AgentMessageState } from "@/modules/agent/types";
import {
  messagesReducer,
  initialMessagesState,
  type MessagesAction,
  type MessagesState,
} from "@/modules/agent/lib/messagesReducer";
import { streamAssistantTurn } from "@/modules/agent/lib/streamAssistantTurn";
import type { WizardAgentContext } from "../components/WizardAgentDialog";
import type { SessionMeta } from "../types";

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

async function extractErrorMessage(
  res: Response,
  fallback: string
): Promise<string> {
  const body = await res.json().catch(() => null);
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return `${fallback} (${res.status})`;
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
    if (!res.ok) {
      const message = await extractErrorMessage(res, "Save failed");
      toast.error("Failed to save chat session", { description: message });
      return null;
    }
    const data = await res.json();
    if (!data.session) {
      toast.error("Failed to save chat session", {
        description: "Server returned an unexpected response.",
      });
      return null;
    }
    const session = data.session as SessionMeta & { messages: unknown };
    return {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      scope: session.scope,
    };
  } catch (e) {
    toast.error("Failed to save chat session", {
      description: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

async function removeSession(
  context: WizardAgentContext,
  sessionId: string
): Promise<void> {
  try {
    const res = await fetch(
      `/api/wizard-agent/sessions/${encodeURIComponent(sessionId)}?${scopeQuery(context)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const message = await extractErrorMessage(res, "Delete failed");
      toast.error("Failed to delete chat session", { description: message });
    }
  } catch (e) {
    toast.error("Failed to delete chat session", {
      description: e instanceof Error ? e.message : String(e),
    });
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
  startNewSession?: boolean;
  onSessionPersisted?: (sessionId: string) => void;
}

export function useWizardAgent({
  context,
  contextPrompt,
  active = true,
  initialSessionId,
  startNewSession = false,
  onSessionPersisted,
}: UseWizardAgentOptions) {
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() =>
    generateSessionId()
  );
  const [sessionStates, setSessionStates] = useState<
    Record<string, MessagesState>
  >({});

  const sessionStatesRef = useRef<Record<string, MessagesState>>({});
  useEffect(() => {
    sessionStatesRef.current = sessionStates;
  }, [sessionStates]);

  const streamControllersRef = useRef<Map<string, AbortController>>(new Map());
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const lastSavedMessagesRef = useRef<Map<string, AgentMessageState[]>>(
    new Map()
  );
  const persistedRef = useRef<Set<string>>(new Set());
  const modelRef = useRef<string>("");

  const onSessionPersistedRef = useRef(onSessionPersisted);
  useEffect(() => {
    onSessionPersistedRef.current = onSessionPersisted;
  }, [onSessionPersisted]);

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

  const tools = useMemo(
    () => [
      askUserTool,
      memoryTool,
      getPresentToolForContentType(context.contentType),
    ],
    [context.contentType]
  );

  const backend = useChatBackend(
    "/api/wizard-agent/chat",
    tools,
    getSystemPrompt
  );

  const transportContext = useMemo(
    () =>
      (contextPrompt
        ? { ...context, contextPrompt }
        : context) as unknown as Record<string, unknown>,
    [context, contextPrompt]
  );

  const sessionDispatch = useCallback(
    (sessionId: string, action: MessagesAction) => {
      setSessionStates((prev) => {
        const current = prev[sessionId] ?? initialMessagesState;
        const next = messagesReducer(current, action);
        if (next === current) return prev;
        return { ...prev, [sessionId]: next };
      });
    },
    []
  );

  const sendToAPI = useCallback(
    async (sessionId: string, messages: AgentMessageState[]) => {
      const prior = streamControllersRef.current.get(sessionId);
      if (prior) prior.abort();
      const controller = new AbortController();
      streamControllersRef.current.set(sessionId, controller);

      try {
        await streamAssistantTurn({
          backend,
          messages,
          model: modelRef.current,
          context: transportContext,
          signal: controller.signal,
          dispatch: (action) => sessionDispatch(sessionId, action),
        });
      } finally {
        if (streamControllersRef.current.get(sessionId) === controller) {
          streamControllersRef.current.delete(sessionId);
        }
      }
    },
    [backend, sessionDispatch, transportContext]
  );

  const sendMessage = useCallback(
    (text: string, model: string) => {
      modelRef.current = model;
      const sessionId = currentSessionId;
      const id = crypto.randomUUID();
      sessionDispatch(sessionId, { type: "ADD_USER_MESSAGE", id, text });
      const existing = sessionStatesRef.current[sessionId]?.messages ?? [];
      sendToAPI(sessionId, [...existing, { id, role: "user", text }]);
    },
    [currentSessionId, sendToAPI, sessionDispatch]
  );

  const stopStreaming = useCallback(() => {
    const controller = streamControllersRef.current.get(currentSessionId);
    if (controller) {
      controller.abort();
      streamControllersRef.current.delete(currentSessionId);
    }
  }, [currentSessionId]);

  const submitToolResult = useCallback(
    (toolCallId: string, result: unknown) => {
      const sessionId = currentSessionId;
      sessionDispatch(sessionId, {
        type: "SUBMIT_TOOL_RESULT",
        toolCallId,
        result,
      });
      const existing = sessionStatesRef.current[sessionId]?.messages ?? [];
      const updated = existing.map((m) =>
        m.role === "tool_call" && m.toolCallId === toolCallId
          ? { ...m, status: "submitted" as const, result }
          : m
      );
      sendToAPI(sessionId, updated);
    },
    [currentSessionId, sendToAPI, sessionDispatch]
  );

  const dismissToolCall = useCallback(
    (toolCallId: string) => {
      sessionDispatch(currentSessionId, {
        type: "DISMISS_TOOL_CALL",
        toolCallId,
      });
    },
    [currentSessionId, sessionDispatch]
  );

  const refreshSessions = useCallback(async () => {
    const list = await fetchSessions(context);
    setSessions(list);
    return list;
  }, [context]);

  const populateSessionFromDisk = useCallback(
    async (sessionId: string) => {
      const { messages: msgs } = await fetchSession(context, sessionId);
      setSessionStates((prev) => ({
        ...prev,
        [sessionId]: { messages: msgs, isStreaming: false },
      }));
      lastSavedMessagesRef.current.set(sessionId, msgs);
    },
    [context]
  );

  // Initial load: fetch session list, restore requested or most recent session
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      const list = await fetchSessions(context);
      if (cancelled) return;
      setSessions(list);
      list.forEach((s) => persistedRef.current.add(s.id));

      const requested =
        initialSessionId && list.some((s) => s.id === initialSessionId)
          ? initialSessionId
          : null;
      const target =
        requested ??
        (startNewSession ? null : list.length > 0 ? list[0].id : null);

      if (target) {
        const { messages: msgs } = await fetchSession(context, target);
        if (cancelled) return;
        setSessionStates((prev) => ({
          ...prev,
          [target]: { messages: msgs, isStreaming: false },
        }));
        lastSavedMessagesRef.current.set(target, msgs);
        setCurrentSessionId(target);
      } else {
        const fresh = generateSessionId();
        setSessionStates((prev) => ({
          ...prev,
          [fresh]: initialMessagesState,
        }));
        lastSavedMessagesRef.current.set(fresh, []);
        setCurrentSessionId(fresh);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, context, initialSessionId, startNewSession]);

  // Debounced per-session save: any session whose messages reference changed
  // since last save gets a save scheduled.
  useEffect(() => {
    if (!active) return;
    for (const [sid, state] of Object.entries(sessionStates)) {
      if (state.messages.length === 0) continue;
      if (lastSavedMessagesRef.current.get(sid) === state.messages) continue;
      const existingTimer = saveTimersRef.current.get(sid);
      if (existingTimer) clearTimeout(existingTimer);
      const messagesSnapshot = state.messages;
      const timer = setTimeout(async () => {
        saveTimersRef.current.delete(sid);
        const meta = await saveSession(context, sid, messagesSnapshot);
        lastSavedMessagesRef.current.set(sid, messagesSnapshot);
        if (meta) {
          const isFirstPersist = !persistedRef.current.has(meta.id);
          persistedRef.current.add(meta.id);
          setSessions((prev) => {
            const others = prev.filter((s) => s.id !== meta.id);
            return [meta, ...others].sort((a, b) => b.createdAt - a.createdAt);
          });
          invalidateSessionList();
          if (isFirstPersist) onSessionPersistedRef.current?.(meta.id);
        }
      }, 1000);
      saveTimersRef.current.set(sid, timer);
    }
  }, [sessionStates, active, context, invalidateSessionList]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = saveTimersRef.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);

  const selectSession = useCallback(
    async (sessionId: string) => {
      if (sessionId === currentSessionId) return;
      setCurrentSessionId(sessionId);
      if (!sessionStatesRef.current[sessionId]) {
        await populateSessionFromDisk(sessionId);
      }
    },
    [currentSessionId, populateSessionFromDisk]
  );

  const newSession = useCallback(() => {
    const fresh = generateSessionId();
    setSessionStates((prev) => ({ ...prev, [fresh]: initialMessagesState }));
    lastSavedMessagesRef.current.set(fresh, []);
    setCurrentSessionId(fresh);
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const controller = streamControllersRef.current.get(sessionId);
      if (controller) {
        controller.abort();
        streamControllersRef.current.delete(sessionId);
      }
      const timer = saveTimersRef.current.get(sessionId);
      if (timer) {
        clearTimeout(timer);
        saveTimersRef.current.delete(sessionId);
      }
      lastSavedMessagesRef.current.delete(sessionId);
      setSessionStates((prev) => {
        if (!(sessionId in prev)) return prev;
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });

      await removeSession(context, sessionId);
      invalidateSessionList();
      const list = await refreshSessions();
      if (sessionId === currentSessionId) {
        if (list.length > 0) {
          const next = list[0];
          setCurrentSessionId(next.id);
          if (!sessionStatesRef.current[next.id]) {
            await populateSessionFromDisk(next.id);
          }
        } else {
          const fresh = generateSessionId();
          setSessionStates((prev) => ({
            ...prev,
            [fresh]: initialMessagesState,
          }));
          lastSavedMessagesRef.current.set(fresh, []);
          setCurrentSessionId(fresh);
        }
      }
    },
    [
      context,
      currentSessionId,
      invalidateSessionList,
      populateSessionFromDisk,
      refreshSessions,
    ]
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

  const currentState = sessionStates[currentSessionId] ?? initialMessagesState;
  const messages = currentState.messages;
  const isStreaming = currentState.isStreaming;

  const loadMessages = useCallback(
    (msgs: AgentMessageState[]) => {
      sessionDispatch(currentSessionId, {
        type: "LOAD_MESSAGES",
        messages: msgs,
      });
      lastSavedMessagesRef.current.set(currentSessionId, msgs);
    },
    [currentSessionId, sessionDispatch]
  );

  return {
    tools,
    input,
    setInput,
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    submitToolResult,
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
