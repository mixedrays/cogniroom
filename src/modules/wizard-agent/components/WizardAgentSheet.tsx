import { Bot, RotateCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PromptTextarea } from "@/components/PromptTextarea";
import { AgentChat } from "@/modules/agent/components/AgentChat";
import { useWizardAgent } from "../hooks/useWizardAgent";
import type { WizardAgentContext } from "./WizardAgentDialog";

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full p-0 gap-0 flex flex-col"
      >
        <SheetHeader className="p-4 pr-12 shrink-0 flex-row items-center justify-between border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="size-4" />
            {TITLE[context.contentType]}
          </SheetTitle>

          {agent.hasMessages && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={agent.handleClear}
              className="absolute right-12 top-4"
              aria-label="Clear conversation"
            >
              <RotateCcw />
            </Button>
          )}
        </SheetHeader>

        <AgentChat
          messages={agent.messages}
          tools={agent.tools}
          onToolSubmit={agent.submitToolResult}
          onToolDismiss={agent.dismissToolCall}
          welcomeMessage={WELCOME[context.contentType]}
          context={{ courseId: context.courseId, lessonId: context.lessonId }}
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
      </SheetContent>
    </Sheet>
  );
}
