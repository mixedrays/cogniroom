import { useState } from "react";
import { Bot } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PromptTextarea } from "@/components/PromptTextarea";
import { useAgent } from "@/modules/agent/hooks/useAgent";
import { AgentChat } from "@/modules/agent/components/AgentChat";
import { askUserTool } from "@/modules/agent/tools/ask-user";
import { memoryTool } from "@/modules/agent/tools/memory";
import { readyToGenerateTool } from "../tools/ready-to-generate";

const TOOLS = [askUserTool, memoryTool, readyToGenerateTool];

interface WizardAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: Record<string, unknown>;
  onGenerate?: (prompt: string, contentType: string) => void;
}

export function WizardAgentDialog({
  open,
  onOpenChange,
  context,
  onGenerate,
}: WizardAgentDialogProps) {
  const [input, setInput] = useState("");
  const {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    submitToolResult,
    dismissToolCall,
  } = useAgent({ endpoint: "/api/wizard-agent/chat", context });

  const handleToolSubmit = (toolCallId: string, result: unknown) => {
    const msg = messages.find(
      (m) => m.role === "tool_call" && m.toolCallId === toolCallId
    );
    if (msg && msg.role === "tool_call" && msg.toolName === "readyToGenerate") {
      const { prompt, contentType } = result as {
        prompt: string;
        contentType: string;
      };
      onGenerate?.(prompt, contentType);
      onOpenChange(false);
      dismissToolCall(toolCallId);
      return;
    }
    submitToolResult(toolCallId, result);
  };

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
            AI Agent Wizard
          </DialogTitle>
        </DialogHeader>
        <AgentChat
          messages={messages}
          tools={TOOLS}
          onToolSubmit={handleToolSubmit}
          onToolDismiss={dismissToolCall}
          welcomeMessage="Describe what content you'd like to generate and I'll help you get started."
          promptSlot={
            <PromptTextarea
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              isStreaming={isStreaming}
              onStop={stopStreaming}
              placeholder="Describe what you want to generate..."
            />
          }
        />
      </DialogContent>
    </Dialog>
  );
}
