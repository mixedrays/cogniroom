import type { ReactNode } from "react";
import { PromptTextarea } from "@/components/PromptTextarea";
import { AgentChat } from "@/modules/agent/components/AgentChat";
import { useWizardAgent } from "../hooks/useWizardAgent";
import type { WizardAgentContext } from "./WizardAgentDialog";

interface WizardAgentInlineProps {
  context: WizardAgentContext;
  welcomeTitle?: string;
  welcomeMessage?: string;
  placeholder?: string;
  promptExtra?: ReactNode;
  className?: string;
  children?: (state: {
    hasMessages: boolean;
    onClear: () => void;
  }) => ReactNode;
}

export function WizardAgentInline({
  context,
  welcomeTitle,
  welcomeMessage,
  placeholder = "Type a message…",
  promptExtra,
  className,
  children,
}: WizardAgentInlineProps) {
  const agent = useWizardAgent({ context });

  const promptSlot = (
    <div className="flex flex-col gap-2 w-full mx-auto">
      <PromptTextarea
        value={agent.input}
        onChange={agent.setInput}
        onSubmit={agent.handleSubmit}
        isStreaming={agent.isStreaming}
        onStop={agent.stopStreaming}
        placeholder={placeholder}
      />
      {promptExtra && (
        <div className="flex items-center justify-center">{promptExtra}</div>
      )}
    </div>
  );

  return (
    <>
      {children?.({
        hasMessages: agent.hasMessages,
        onClear: agent.handleClear,
      })}

      {agent.hasMessages ? (
        <AgentChat
          messages={agent.messages}
          tools={agent.tools}
          onToolSubmit={agent.submitToolResult}
          onToolDismiss={agent.dismissToolCall}
          welcomeMessage={welcomeMessage}
          context={{
            courseId: context.courseId,
            lessonId: context.lessonId,
          }}
          promptSlot={promptSlot}
          className={className}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16 max-w-3xl mx-auto w-full">
          {welcomeTitle && (
            <h1 className="text-2xl font-semibold mb-8">{welcomeTitle}</h1>
          )}
          {promptSlot}
        </div>
      )}
    </>
  );
}
