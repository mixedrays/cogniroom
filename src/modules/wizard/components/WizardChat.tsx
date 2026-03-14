import { useRef, useEffect, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptTextarea } from "@/components/PromptTextarea";
import type { UseWizardReturn } from "../hooks/useWizard";
import type { AgentMessage } from "../schema";
import { WizardMessage } from "./WizardMessage";

type WizardChatProps = UseWizardReturn;

export function WizardChat({
  messages,
  isLoading,
  isGenerating,
  hasPreview,
  sendMessage,
  submitWidget,
  submitBatch,
  dismissWidget,
  handleGenerate,
}: WizardChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string) => {
    setInput("");
    sendMessage(text);
  };

  const handleWidgetAnswer = (widget: AgentMessage, answer: unknown) => {
    submitWidget(widget, answer);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => {
          const isAnswered =
            msg.role === "assistant" &&
            msg.status === "complete" &&
            index < messages.length - 1 &&
            messages.slice(index + 1).some((m) => m.role === "user");

          return (
            <WizardMessage
              key={msg.id}
              message={msg}
              isAnswered={isAnswered}
              onWidgetAnswer={handleWidgetAnswer}
              onBatchSubmit={submitBatch}
              onDismissWidget={dismissWidget}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 flex flex-col gap-2">
        <PromptTextarea
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <Button
          onClick={handleGenerate}
          disabled={isLoading || isGenerating}
          className="shrink-0 self-end"
        >
          {isGenerating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Wand2 className="size-4" />
          )}
          {hasPreview ? "Generate Content" : "Generate"}
        </Button>
      </div>
    </div>
  );
}
