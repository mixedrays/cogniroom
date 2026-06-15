import type { ReactNode } from "react";
import { PromptTextarea } from "@/components/PromptTextarea";
import { AgentChat } from "@/modules/agent/components/AgentChat";
import {
  ContentSaveProvider,
  type ContentSaveOverride,
} from "./ContentSaveContext";
import { useWizardAgent } from "../hooks/useWizardAgent";
import type { WizardAgentContext, SessionMeta } from "../types";

interface InlineRenderState {
  hasMessages: boolean;
  onClear: () => void;
  sessions: SessionMeta[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

interface WizardAgentInlineProps {
  context: WizardAgentContext;
  contextPrompt?: string;
  welcomeTitle?: string;
  welcomeDescription?: string;
  welcomeMessage?: string;
  placeholder?: string;
  promptExtra?: ReactNode;
  promptBefore?: ReactNode;
  className?: string;
  initialSessionId?: string;
  startNewSession?: boolean;
  onSessionPersisted?: (sessionId: string) => void;
  promptTextareaId?: string;
  saveOverride?: ContentSaveOverride;
  children?: (state: InlineRenderState) => ReactNode;
}

export function WizardAgentInline({
  context,
  contextPrompt,
  welcomeTitle,
  welcomeDescription,
  welcomeMessage,
  placeholder = "Type a message…",
  promptExtra,
  promptBefore,
  className,
  initialSessionId,
  startNewSession,
  onSessionPersisted,
  promptTextareaId,
  saveOverride,
  children,
}: WizardAgentInlineProps) {
  const agent = useWizardAgent({
    context,
    contextPrompt,
    initialSessionId,
    startNewSession,
    onSessionPersisted,
  });

  const promptSlot = (
    <div className="flex flex-col gap-3 w-full mx-auto">
      {promptBefore}

      <PromptTextarea
        value={agent.input}
        onChange={agent.setInput}
        onSubmit={agent.handleSubmit}
        isStreaming={agent.isStreaming}
        onStop={agent.stopStreaming}
        placeholder={placeholder}
        autoFocus={!agent.hasMessages}
        textareaId={promptTextareaId}
      />

      {promptExtra && (
        <div className="flex items-center justify-center">{promptExtra}</div>
      )}
    </div>
  );

  const content = (
    <>
      {children?.({
        hasMessages: agent.hasMessages,
        onClear: agent.handleClear,
        sessions: agent.sessions,
        currentSessionId: agent.currentSessionId,
        onSelectSession: agent.selectSession,
        onNewSession: agent.newSession,
        onDeleteSession: agent.deleteSession,
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
        <div
          key={agent.currentSessionId}
          className="flex-1 flex flex-col items-center justify-center px-4 pb-16 max-w-3xl mx-auto w-full"
        >
          {(welcomeTitle || welcomeDescription) && (
            <div className="text-center space-y-2 mb-8">
              {welcomeTitle && (
                <h1 className="text-2xl font-semibold">{welcomeTitle}</h1>
              )}
              {welcomeDescription && (
                <p className="text-muted-foreground">{welcomeDescription}</p>
              )}
            </div>
          )}
          {promptSlot}
        </div>
      )}
    </>
  );

  if (saveOverride) {
    return (
      <ContentSaveProvider override={saveOverride}>
        {content}
      </ContentSaveProvider>
    );
  }
  return content;
}
