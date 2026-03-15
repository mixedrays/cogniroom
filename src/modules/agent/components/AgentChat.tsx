import { useRef, useEffect, type ReactNode } from "react";
import type { AgentMessageState, AgentTool } from "../types";
import { AgentMessage } from "./AgentMessage";

interface AgentChatProps {
  messages: AgentMessageState[];
  tools: AgentTool[];
  onToolSubmit: (toolCallId: string, result: unknown) => void;
  onToolDismiss: (toolCallId: string) => void;
  promptSlot: ReactNode;
}

export function AgentChat({
  messages,
  tools,
  onToolSubmit,
  onToolDismiss,
  promptSlot,
}: AgentChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
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
      <div className="p-4">{promptSlot}</div>
    </div>
  );
}
