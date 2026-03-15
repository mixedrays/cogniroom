import { useState } from "react";
import { Bot } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PromptTextarea } from "@/components/PromptTextarea";
import { useAgent } from "../hooks/useAgent";
import { AgentChat } from "./AgentChat";
import { askUserTool } from "../tools/ask-user";
import { memoryTool } from "../tools/memory";
import type { AgentTool } from "../types";

const DEFAULT_TOOLS: AgentTool[] = [askUserTool, memoryTool];

interface AgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  endpoint?: string;
  tools?: AgentTool[];
  context?: Record<string, unknown>;
  placeholder?: string;
}

export function AgentDialog({
  open,
  onOpenChange,
  title = "AI Agent",
  endpoint = "/api/agent/chat",
  tools = DEFAULT_TOOLS,
  context,
  placeholder,
}: AgentDialogProps) {
  const [input, setInput] = useState("");
  const { messages, isStreaming, sendMessage, stopStreaming, submitToolResult, dismissToolCall } =
    useAgent({ endpoint, context });

  const handleSubmit = (text: string, model: string) => {
    setInput("");
    sendMessage(text, model);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] max-h-160 flex flex-col gap-0 p-0">
        <DialogHeader className="p-4 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="size-4" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <AgentChat
          messages={messages}
          tools={tools}
          isStreaming={isStreaming}
          onToolSubmit={submitToolResult}
          onToolDismiss={dismissToolCall}
          onStop={stopStreaming}
          promptSlot={
            <PromptTextarea
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              disabled={isStreaming}
              placeholder={placeholder ?? "Type a message…"}
            />
          }
        />
      </DialogContent>
    </Dialog>
  );
}
