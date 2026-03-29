import { useRef, useEffect, type ReactNode } from "react";
import type { AgentMessageState, AgentTool } from "../types";
import { AgentMessage } from "./AgentMessage";

interface AgentChatProps {
  messages: AgentMessageState[];
  tools: AgentTool[];
  onToolSubmit: (toolCallId: string, result: unknown) => void;
  onToolDismiss: (toolCallId: string) => void;
  promptSlot: ReactNode;
  welcomeMessage?: string;
  context?: Record<string, unknown>;
}

type ToolCallMessage = Extract<AgentMessageState, { role: "tool_call" }>;

export function AgentChat({
  messages,
  tools,
  onToolSubmit,
  onToolDismiss,
  promptSlot,
  welcomeMessage,
  context,
}: AgentChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const activeAbovePromptCall = [...messages]
    .reverse()
    .find(
      (msg): msg is ToolCallMessage =>
        msg.role === "tool_call" &&
        msg.status === "pending" &&
        tools.some(
          (t) =>
            t.client?.name === (msg as ToolCallMessage).toolName &&
            t.client?.renderAbovePrompt
        )
    );

  const chatMessages = activeAbovePromptCall
    ? messages.filter((m) => m.id !== activeAbovePromptCall.id)
    : messages;

  const abovePromptTool = activeAbovePromptCall
    ? tools.find((t) => t.client?.name === activeAbovePromptCall.toolName)
    : undefined;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {chatMessages.length === 0 && welcomeMessage && (
          <div className="flex h-full items-center justify-center m-0">
            <p className="text-muted-foreground text-center">
              {welcomeMessage}
            </p>
          </div>
        )}

        {chatMessages.map((msg) => (
          <AgentMessage
            key={msg.id}
            message={msg}
            messages={messages}
            tools={tools}
            onToolSubmit={onToolSubmit}
            onToolDismiss={onToolDismiss}
            context={context}
          />
        ))}
      </div>

      {activeAbovePromptCall && abovePromptTool?.client && (
        <div className="px-4 pt-2">
          <div className="rounded-2xl bg-muted p-4">
            <abovePromptTool.client.Widget
              params={activeAbovePromptCall.params}
              onSubmit={(result) =>
                onToolSubmit(activeAbovePromptCall.toolCallId, result)
              }
              onDismiss={() => onToolDismiss(activeAbovePromptCall.toolCallId)}
              context={context}
            />
          </div>
        </div>
      )}

      <div className="p-4">{promptSlot}</div>
    </div>
  );
}
