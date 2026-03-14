import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AgentMessage } from "../../schema";

type QuestionsData = Extract<AgentMessage, { type: "questions" }>;
type Question = QuestionsData["questions"][number];

interface QuestionsBatchWidgetProps {
  data: QuestionsData;
  widgetId: string;
  onSubmit: (answers: Record<string, string | string[]>) => void;
  onDismiss: () => void;
}

function buildInitialAnswers(
  questions: Question[]
): Record<string, string | string[]> {
  return Object.fromEntries(
    questions.map((q) => {
      if (!q.options?.length) return [q.header, ""];
      const recommended = q.options
        .filter((o) => o.recommended)
        .map((o) => o.label);
      if (q.multiSelect) return [q.header, recommended];
      return [q.header, recommended[0] ?? ""];
    })
  );
}

export function QuestionsBatchWidget({
  data,
  onSubmit,
  onDismiss,
}: QuestionsBatchWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    () => buildInitialAnswers(data.questions)
  );
  const [confirmingDismiss, setConfirmingDismiss] = useState(false);

  const current = data.questions[currentIndex];
  const isLast = currentIndex === data.questions.length - 1;
  const isFirst = currentIndex === 0;
  const total = data.questions.length;

  const handleSubmit = useCallback(() => {
    onSubmit(answers);
  }, [answers, onSubmit]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && isLast) {
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLast, handleSubmit]);

  const toggleOption = (header: string, label: string, multi: boolean) => {
    setAnswers((prev) => {
      if (multi) {
        const cur = (prev[header] as string[]) ?? [];
        return {
          ...prev,
          [header]: cur.includes(label)
            ? cur.filter((v) => v !== label)
            : [...cur, label],
        };
      }
      return { ...prev, [header]: prev[header] === label ? "" : label };
    });
  };

  const isOptionSelected = (header: string, label: string, multi: boolean) => {
    if (multi) return ((answers[header] as string[]) ?? []).includes(label);
    return answers[header] === label;
  };

  if (confirmingDismiss) {
    return (
      <div className="space-y-4">
        <p className="text-sm">Discard these questions?</p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmingDismiss(false)}
          >
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onDismiss}>
            Discard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="flex items-start justify-between gap-2 pb-3">
        <p className="font-medium text-sm">{current.question}</p>
        <button
          type="button"
          aria-label="Dismiss questions"
          onClick={() => setConfirmingDismiss(true)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1 pb-3">
        {current.options?.map((option, i) => {
          const selected = isOptionSelected(
            current.header,
            option.label,
            !!current.multiSelect
          );
          return (
            <button
              key={option.label}
              type="button"
              data-selected={selected}
              onClick={() =>
                toggleOption(
                  current.header,
                  option.label,
                  !!current.multiSelect
                )
              }
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                selected
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/30 hover:bg-accent/50"
              )}
            >
              <span className="w-4 shrink-0 text-xs text-muted-foreground">
                {i + 1}
              </span>
              <span className="flex-1">{option.label}</span>
              {selected && <Check className="size-3.5 shrink-0 text-primary" />}
            </button>
          );
        })}

        {current.allowFreeformInput && (
          <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-1.5">
            <span className="w-4 shrink-0 text-xs text-muted-foreground">
              {(current.options?.length ?? 0) + 1}
            </span>
            <Input
              value={
                Array.isArray(answers[current.header])
                  ? ""
                  : current.options?.some((o) =>
                        isOptionSelected(current.header, o.label, false)
                      )
                    ? ""
                    : ((answers[current.header] as string) ?? "")
              }
              onChange={(e) => {
                setAnswers((prev) => ({
                  ...prev,
                  [current.header]: e.target.value,
                }));
              }}
              placeholder="Enter custom answer"
              className="border-0 p-0 h-auto text-sm focus-visible:ring-0 shadow-none"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-0.5">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Previous question"
            disabled={isFirst}
            onClick={() => setCurrentIndex((i) => i - 1)}
          >
            <ChevronLeft />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            aria-label="Next question"
            disabled={isLast}
            onClick={() => setCurrentIndex((i) => i + 1)}
          >
            <ChevronRight />
          </Button>

          <span className="text-xs text-muted-foreground ml-1">
            {currentIndex + 1}/{total}
          </span>
        </div>

        {isLast && (
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button onClick={handleSubmit}>Submit</Button>
            </TooltipTrigger>
            <TooltipContent>
              Submit answers <Kbd>⌘ + Enter</Kbd>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
