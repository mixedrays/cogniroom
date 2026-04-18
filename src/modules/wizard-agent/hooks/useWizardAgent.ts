import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useAgent } from "@/modules/agent/hooks/useAgent";
import { useChatBackend } from "@/modules/agent/hooks/useChatBackend";
import { askUserTool } from "@/modules/agent/tools/ask-user";
import { memoryTool } from "@/modules/agent/tools/memory";
import { presentContentTool } from "@/modules/agent/tools/present-content";
import type { AgentMessageState } from "@/modules/agent/types";
import type { WizardAgentContext } from "../components/WizardAgentDialog";

const TOOLS = [askUserTool, memoryTool, presentContentTool];

function contextId(context: WizardAgentContext): string {
  if (context.contentType === "roadmap") return "home";
  return [context.courseId, context.lessonId, context.contentType]
    .filter(Boolean)
    .join("_");
}

async function fetchHistory(ctxId: string): Promise<AgentMessageState[]> {
  try {
    const res = await fetch(`/api/wizard-agent/history/${ctxId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.messages) ? data.messages : [];
  } catch {
    return [];
  }
}

async function saveHistory(
  ctxId: string,
  messages: AgentMessageState[]
): Promise<void> {
  try {
    await fetch(`/api/wizard-agent/history/${ctxId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch {
    // non-critical
  }
}

async function clearHistory(ctxId: string): Promise<void> {
  try {
    await fetch(`/api/wizard-agent/history/${ctxId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear: true }),
    });
  } catch {
    // non-critical
  }
}

interface UseWizardAgentOptions {
  context: WizardAgentContext;
  contextPrompt?: string;
  active?: boolean;
}

export function useWizardAgent({
  context,
  contextPrompt,
  active = true,
}: UseWizardAgentOptions) {
  const [input, setInput] = useState("");
  const ctxId = contextId(context);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!active) return;
    fetchHistory(ctxId).then((saved) => {
      if (saved.length > 0) loadMessages(saved);
    });
  }, [active, ctxId, loadMessages]);

  useEffect(() => {
    if (!active || messages.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveHistory(ctxId, messages);
    }, 1000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages, active, ctxId]);

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

  const handleClear = useCallback(async () => {
    await clearHistory(ctxId);
    loadMessages([]);
  }, [ctxId, loadMessages]);

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
  };
}
