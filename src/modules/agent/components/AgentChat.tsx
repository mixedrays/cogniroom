import { useRef, useEffect, type ReactNode } from "react";
import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentMessageState, AgentTool } from "../types";
import { AgentMessage } from "./AgentMessage";

interface AgentChatProps {
  messages: AgentMessageState[];
  tools: AgentTool[];
  isStreaming: boolean;
  onToolSubmit: (toolCallId: string, result: unknown) => void;
  onToolDismiss: (toolCallId: string) => void;
  onStop: () => void;
  promptSlot: ReactNode;
}

type ToolCallMessage = Extract<AgentMessageState, { role: "tool_call" }>;

export function AgentChat({
  messages,
  tools,
  isStreaming,
  onToolSubmit,
  onToolDismiss,
  onStop,
  promptSlot,
}: AgentChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

  console.log("chatMessages", chatMessages);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.map((msg) => (
          <AgentMessage
            key={msg.id}
            message={msg}
            tools={tools}
            onToolSubmit={onToolSubmit}
            onToolDismiss={onToolDismiss}
          />
        ))}
        <div ref={bottomRef} />
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
            />
          </div>
        </div>
      )}

      <div className="p-4 space-y-2">
        {isStreaming && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onStop}
              className="gap-2"
            >
              <Square className="size-3 fill-current" />
              Stop
            </Button>
          </div>
        )}
        {promptSlot}
      </div>
    </div>
  );
}
