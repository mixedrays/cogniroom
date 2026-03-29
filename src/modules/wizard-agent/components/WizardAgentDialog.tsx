import { useState, useEffect, useCallback, useRef } from "react";
import { Bot, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PromptTextarea } from "@/components/PromptTextarea";
import { useAgent } from "@/modules/agent/hooks/useAgent";
import { useChatBackend } from "@/modules/agent/hooks/useChatBackend";
import { AgentChat } from "@/modules/agent/components/AgentChat";
import { askUserTool } from "@/modules/agent/tools/ask-user";
import { memoryTool } from "@/modules/agent/tools/memory";
import { presentContentTool } from "@/modules/agent/tools/present-content";
import type { AgentMessageState } from "@/modules/agent/types";

const TOOLS = [askUserTool, memoryTool, presentContentTool];

export interface WizardAgentContext {
  contentType: "roadmap" | "lesson" | "quiz" | "flashcards" | "exercise";
  courseId?: string;
  lessonId?: string;
  topic?: string;
  lessonTitle?: string;
  courseTitle?: string;
}

interface WizardAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: WizardAgentContext;
}

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

const WELCOME: Record<WizardAgentContext["contentType"], string> = {
  roadmap:
    "Tell me about the course you want to create and I'll build a roadmap.",
  lesson: "Describe what you'd like this lesson to cover.",
  quiz: "I'll generate a quiz for this lesson. Add any specific instructions, or just click Generate.",
  flashcards:
    "I'll generate flashcards for this lesson. Add any focus areas, or just click Generate.",
  exercise:
    "I'll generate exercises for this lesson. Add any specific requirements, or just click Generate.",
};

export function WizardAgentDialog({
  open,
  onOpenChange,
  context,
}: WizardAgentDialogProps) {
  const [input, setInput] = useState("");
  const ctxId = contextId(context);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getSystemPrompt = useCallback(async () => {
    const params = new URLSearchParams({
      contentType: context.contentType,
      context: JSON.stringify(context),
    });
    const res = await fetch(`/api/wizard-agent/prompt?${params}`);
    const data = (await res.json()) as { prompt: string };
    return data.prompt;
  }, [context]);

  const backend = useChatBackend(
    "/api/wizard-agent/chat",
    TOOLS,
    getSystemPrompt
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
    context: context as unknown as Record<string, unknown>,
  });

  useEffect(() => {
    if (!open) return;
    fetchHistory(ctxId).then((saved) => {
      if (saved.length > 0) loadMessages(saved);
    });
  }, [open, ctxId, loadMessages]);

  useEffect(() => {
    if (!open || messages.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveHistory(ctxId, messages);
    }, 1000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages, open, ctxId]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] max-h-160 flex flex-col gap-0 p-0">
        <DialogHeader className="p-4 pr-12 shrink-0 flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="size-4" />
            {context.contentType === "roadmap"
              ? "Create Course"
              : `Create ${context.contentType.charAt(0).toUpperCase()}${context.contentType.slice(1)}`}
          </DialogTitle>

          {messages.length > 0 && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={handleClear}
              aria-label="Clear conversation"
            >
              <RotateCcw className="size-4" />
            </Button>
          )}
        </DialogHeader>

        <AgentChat
          messages={messages}
          tools={TOOLS}
          onToolSubmit={handleToolSubmit}
          onToolDismiss={dismissToolCall}
          welcomeMessage={WELCOME[context.contentType]}
          context={{ courseId: context.courseId, lessonId: context.lessonId }}
          promptSlot={
            <PromptTextarea
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              isStreaming={isStreaming}
              onStop={stopStreaming}
              placeholder="Type a message…"
            />
          }
        />
      </DialogContent>
    </Dialog>
  );
}
