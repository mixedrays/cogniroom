import { useState } from "react";
import { Bot, History, Plus, XIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { PromptTextarea } from "@/components/PromptTextarea";
import { AgentChat } from "@/modules/agent/components/AgentChat";
import { cn } from "@/lib/utils";
import { useWizardAgent } from "../hooks/useWizardAgent";
import type { WizardAgentContext } from "./WizardAgentDialog";
import { SessionHistoryPanel } from "./SessionHistoryPanel";

interface WizardAgentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: WizardAgentContext;
  contextPrompt?: string;
}

const WELCOME: Record<WizardAgentContext["contentType"], string> = {
  roadmap:
    "Tell me about the course you want to create and I'll build a roadmap.",
  lesson: "Describe what you'd like this lesson to cover.",
  quiz: "I'll generate a quiz for this lesson. Add any specific instructions, or just click Generate.",
  flashcards:
    "I'll generate flashcards for this lesson. Add any focus areas, or just click Generate.",
  exercise:
    "I'll generate exercises for this lesson. Add any specific requirements, or just click Generate.",
};

const TITLE: Record<WizardAgentContext["contentType"], string> = {
  roadmap: "Ask AI — Course",
  lesson: "Ask AI — Lesson",
  quiz: "Ask AI — Quiz",
  flashcards: "Ask AI — Flashcards",
  exercise: "Ask AI — Exercises",
};

export function WizardAgentSheet({
  open,
  onOpenChange,
  context,
  contextPrompt,
}: WizardAgentSheetProps) {
  const agent = useWizardAgent({ context, contextPrompt, active: open });
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="max-w-3/4! md:max-w-1/2! p-0"
      >
        <div className="flex h-full min-h-0">
          <div className="flex flex-col flex-1 min-w-0">
            <SheetHeader className="pr-12 border-b h-14 relative">
              <SheetTitle className="flex items-center gap-2">
                <Bot className="size-4" />
                {TITLE[context.contentType]}
              </SheetTitle>

              <div className="absolute right-3 top-3 flex items-center">
                <Tooltip content={historyOpen ? "Hide history" : "Show history"}>
                  <Button
                    size="icon-sm"
                    variant={historyOpen ? "secondary" : "ghost"}
                    onClick={() => setHistoryOpen((v) => !v)}
                    aria-label="Toggle history"
                    aria-pressed={historyOpen}
                  >
                    <History />
                  </Button>
                </Tooltip>

                {agent.hasMessages && (
                  <Tooltip content="New session">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={agent.newSession}
                      aria-label="New session"
                    >
                      <Plus />
                    </Button>
                  </Tooltip>
                )}

                <Tooltip content="Close">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={onOpenChange.bind(null, false)}
                    aria-label="Close"
                  >
                    <span className="sr-only">Close</span>
                    <XIcon />
                  </Button>
                </Tooltip>
              </div>
            </SheetHeader>

            <AgentChat
              messages={agent.messages}
              tools={agent.tools}
              onToolSubmit={agent.submitToolResult}
              onToolDismiss={agent.dismissToolCall}
              welcomeMessage={WELCOME[context.contentType]}
              context={{
                courseId: context.courseId,
                lessonId: context.lessonId,
              }}
              className={cn("flex-1 min-h-0")}
              promptSlot={
                <PromptTextarea
                  value={agent.input}
                  onChange={agent.setInput}
                  onSubmit={agent.handleSubmit}
                  isStreaming={agent.isStreaming}
                  onStop={agent.stopStreaming}
                  placeholder="Type a message…"
                />
              }
            />
          </div>

          {historyOpen && (
            <SessionHistoryPanel
              sessions={agent.sessions}
              currentSessionId={agent.currentSessionId}
              onSelect={agent.selectSession}
              onNew={agent.newSession}
              onDelete={agent.deleteSession}
              className="w-64 border-r shrink-0"
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
