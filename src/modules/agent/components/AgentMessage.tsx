import { Loader2 } from "lucide-react";
import { Markdown } from "@/modules/markdown";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import type { AgentMessageState, AgentTool } from "../types";

interface AgentMessageProps {
  message: AgentMessageState;
  messages: AgentMessageState[];
  tools: AgentTool[];
  onToolSubmit: (toolCallId: string, result: unknown) => void;
  onToolDismiss: (toolCallId: string) => void;
  context?: Record<string, unknown>;
}

export function AgentMessage({
  message,
  messages,
  tools,
  onToolSubmit,
  onToolDismiss,
  context,
}: AgentMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.role === "assistant") {
    if (message.status === "streaming" && !message.text) {
      return (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground text-xs">Thinking…</span>
          </div>
        </div>
      );
    }

    if (message.status === "cancelled" && !message.text) {
      return (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-destructive/10 px-4 py-2.5 text-sm text-muted-foreground">
            Generation stopped
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
          <Markdown content={message.text} className="text-sm" />
        </div>
      </div>
    );
  }

  if (message.role === "tool_call") {
    const tool = tools.find((t) => t.client?.name === message.toolName);

    if (message.status === "dismissed")
      return (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            Tool call dismissed
          </div>
        </div>
      );

    if (message.status === "submitted") {
      if (tool?.client?.hideWhenSubmitted) return null;

      if (tool?.client?.SubmittedWidget) {
        const { SubmittedWidget } = tool.client;
        return (
          <SubmittedWidget params={message.params} result={message.result} />
        );
      }

      const resultText = Array.isArray(message.result)
        ? (message.result as string[]).join(", ")
        : String(message.result ?? "");
      return (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
            {resultText}
          </div>
        </div>
      );
    }

    if (!tool?.client) return null;

    if (tool.client.renderAbovePrompt) return null;

    const { Widget } = tool.client;

    const messageIndex = messages.indexOf(message);
    const isSuperseded =
      Boolean(tool.client.supersedable) &&
      message.status === "pending" &&
      messages.some(
        (m, i) =>
          i > messageIndex &&
          m.role === "tool_call" &&
          m.toolName === message.toolName &&
          m.status === "pending"
      );

    return (
      <Widget
        params={message.params}
        streamingInput={message.streamingInput}
        isStreaming={message.status === "streaming"}
        onSubmit={(result) => onToolSubmit(message.toolCallId, result)}
        onDismiss={() => onToolDismiss(message.toolCallId)}
        context={context}
        superseded={isSuperseded}
      />
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          <ErrorMessage message={message.message} />
        </div>
      </div>
    );
  }

  return null;
}
