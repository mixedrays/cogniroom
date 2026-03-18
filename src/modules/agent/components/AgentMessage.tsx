import { Loader2 } from "lucide-react";
import { Markdown } from "@/modules/markdown";
import type { AgentMessageState, AgentTool } from "../types";
import { AskUserParamsSchema } from "../tools/ask-user/schema";

interface AgentMessageProps {
  message: AgentMessageState;
  tools: AgentTool[];
  onToolSubmit: (toolCallId: string, result: unknown) => void;
  onToolDismiss: (toolCallId: string) => void;
}

export function AgentMessage({
  message,
  tools,
  onToolSubmit,
  onToolDismiss,
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
    if (message.status === "dismissed")
      return (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-destructive/10 px-4 py-2.5 text-sm text-balanced-foreground">
            Tool call dismissed
          </div>
        </div>
      );

    if (message.status === "submitted" && message.toolName === "askUser") {
      const parsed = AskUserParamsSchema.safeParse(message.params);
      const answers = message.result as Record<string, string | string[]>;
      if (parsed.success) {
        return (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/20 px-4 py-3 text-sm space-y-2">
              {parsed.data.questions.map((q) => {
                const ans = answers[q.header];
                const ansText = Array.isArray(ans)
                  ? ans.join(", ")
                  : (ans ?? "—");
                return (
                  <div key={q.header}>
                    <p className="text-muted-foreground text-xs">
                      {q.question}
                    </p>
                    <p className="font-medium">{ansText}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }

    if (message.status === "submitted") {
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

    const tool = tools.find((t) => t.client?.name === message.toolName);
    if (!tool?.client) return null;

    if (tool.client.renderAbovePrompt) return null;

    const { Widget } = tool.client;
    return (
      <div className="rounded-2xl bg-muted p-4">
        <Widget
          params={message.params}
          onSubmit={(result) => onToolSubmit(message.toolCallId, result)}
          onDismiss={() => onToolDismiss(message.toolCallId)}
        />
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {message.message}
        </div>
      </div>
    );
  }

  return null;
}
