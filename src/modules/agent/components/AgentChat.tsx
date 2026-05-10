import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentMessageState, AgentTool } from "../types";
import { AgentMessage } from "./AgentMessage";

const SCROLL_BOTTOM_THRESHOLD = 40;

interface AgentChatProps {
  messages: AgentMessageState[];
  tools: AgentTool[];
  onToolSubmit: (toolCallId: string, result: unknown) => void;
  onToolDismiss: (toolCallId: string) => void;
  promptSlot: ReactNode;
  welcomeMessage?: string;
  context?: Record<string, unknown>;
  className?: string;
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
  className,
}: AgentChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setIsAtBottom(distance <= SCROLL_BOTTOM_THRESHOLD);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [messages, isAtBottom, scrollToBottom]);

  const activeAbovePromptCall = [...messages]
    .reverse()
    .find(
      (msg): msg is ToolCallMessage =>
        msg.role === "tool_call" &&
        (msg.status === "pending" || msg.status === "streaming") &&
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
    <div className={cn("flex flex-col flex-1 overflow-hidden", className)}>
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto p-4 space-y-6"
        >
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

        {!isAtBottom && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => scrollToBottom()}
            className="absolute bottom-2 cursor-pointer left-1/2 -translate-x-1/2 rounded-full shadow-md"
            aria-label="Scroll to bottom"
          >
            <ArrowDown />
          </Button>
        )}
      </div>

      {activeAbovePromptCall && abovePromptTool?.client && (
        <div className="px-4 pt-2">
          <div className="rounded-2xl bg-muted p-4">
            {activeAbovePromptCall.status === "streaming" ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground text-sm">
                  Preparing questions…
                </span>
              </div>
            ) : (
              <abovePromptTool.client.Widget
                params={activeAbovePromptCall.params}
                onSubmit={(result) =>
                  onToolSubmit(activeAbovePromptCall.toolCallId, result)
                }
                onDismiss={() =>
                  onToolDismiss(activeAbovePromptCall.toolCallId)
                }
                context={context}
              />
            )}
          </div>
        </div>
      )}

      <div className="p-4">{promptSlot}</div>
    </div>
  );
}
