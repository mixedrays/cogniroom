import { Bot, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PromptTextarea } from "@/components/PromptTextarea";
import { AgentChat } from "@/modules/agent/components/AgentChat";
import { useWizardAgent } from "../hooks/useWizardAgent";

export interface WizardAgentContext {
  contentType: "roadmap" | "lesson" | "quiz" | "flashcards" | "exercise";
  courseId?: string;
  lessonId?: string;
  topic?: string;
  lessonTitle?: string;
  courseTitle?: string;
}

interface WizardAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: WizardAgentContext;
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

export function WizardAgentDialog({
  open,
  onOpenChange,
  context,
}: WizardAgentDialogProps) {
  const agent = useWizardAgent({ context, active: open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] max-h-160 flex flex-col gap-0 p-0">
        <DialogHeader className="p-4 pr-12 shrink-0 flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="size-4" />
            {context.contentType === "roadmap"
              ? "Create Course"
              : `Create ${context.contentType.charAt(0).toUpperCase()}${context.contentType.slice(1)}`}
          </DialogTitle>

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
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
