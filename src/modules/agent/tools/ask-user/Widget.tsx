import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AskUserParamsSchema, type AskUserQuestion } from "./schema";

type Answers = Record<string, string | string[]>;

interface QuestionsBatchWidgetProps {
  params: unknown;
  onSubmit: (result: unknown) => void;
  onDismiss: () => void;
}

export function QuestionsBatchWidget({
  params,
  onSubmit,
  onDismiss,
}: QuestionsBatchWidgetProps) {
  const parsed = AskUserParamsSchema.safeParse(params);
  const questions: AskUserQuestion[] = parsed.success
    ? parsed.data.questions
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [freeformValues, setFreeformValues] = useState<Record<string, string>>(
    {}
  );
  const [showDismissDialog, setShowDismissDialog] = useState(false);

  const total = questions.length;
  const current = questions[currentIndex] ?? null;
  const isFirst = currentIndex === 0;
  const isLast = total > 0 && currentIndex === total - 1;
  const currentAnswer = current ? answers[current.header] : undefined;
  const currentFreeform = current ? (freeformValues[current.header] ?? "") : "";

  useEffect(() => {
    if (!parsed.success) return;
    const initial: Answers = {};
    for (const q of parsed.data.questions) {
      const recommended =
        q.options?.filter((o) => o.recommended).map((o) => o.label) ?? [];
      if (recommended.length > 0) {
        initial[q.header] = q.multiSelect ? recommended : recommended[0];
      }
    }
    setAnswers(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleOption = useCallback(
    (label: string) => {
      if (!current) return;
      if (current.multiSelect) {
        const prev = Array.isArray(currentAnswer) ? currentAnswer : [];
        const next = prev.includes(label)
          ? prev.filter((o) => o !== label)
          : [...prev, label];
        setAnswers((a) => ({ ...a, [current.header]: next }));
      } else {
        setAnswers((a) => ({ ...a, [current.header]: label }));
        setFreeformValues((f) => ({ ...f, [current.header]: "" }));
      }
    },
    [current, currentAnswer]
  );

  const handleSubmit = useCallback(() => {
    onSubmit(answers);
  }, [onSubmit, answers]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement).tagName === "INPUT";

      if (isLast && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }

      if (!isInput) {
        if (e.key === "ArrowLeft" && !isFirst) {
          e.preventDefault();
          setCurrentIndex((i) => i - 1);
          return;
        }
        if (e.key === "ArrowRight" && !isLast) {
          e.preventDefault();
          setCurrentIndex((i) => i + 1);
          return;
        }

        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1 && current?.options) {
          const idx = num - 1;
          if (idx < current.options.length) {
            e.preventDefault();
            toggleOption(current.options[idx].label);
          }
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFirst, isLast, current, handleSubmit, toggleOption]);

  if (!parsed.success || !current) return null;

  const isOptionSelected = (label: string): boolean => {
    if (current.multiSelect) {
      return Array.isArray(currentAnswer) && currentAnswer.includes(label);
    }
    return currentAnswer === label;
  };

  const handleFreeformChange = (value: string) => {
    setFreeformValues((f) => ({ ...f, [current.header]: value }));
    if (!current.multiSelect) {
      if (value) {
        setAnswers((a) => ({ ...a, [current.header]: value }));
      } else {
        setAnswers((a) => {
          const next = { ...a };
          delete next[current.header];
          return next;
        });
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{current.question}</p>
        <button
          type="button"
          onClick={() => setShowDismissDialog(true)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {current.options && (
        <div className="flex flex-col gap-1">
          {current.options.map((opt, idx) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => toggleOption(opt.label)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors cursor-pointer",
                isOptionSelected(opt.label)
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              )}
            >
              <span className="text-muted-foreground text-xs w-4 shrink-0">
                {idx + 1}
              </span>
              <span className="flex-1">{opt.label}</span>
              {current.multiSelect ? (
                <Checkbox
                  checked={isOptionSelected(opt.label)}
                  tabIndex={-1}
                  className="pointer-events-none shrink-0"
                />
              ) : (
                isOptionSelected(opt.label) && (
                  <span className="text-primary text-xs">✓</span>
                )
              )}
            </button>
          ))}
        </div>
      )}

      {current.allowFreeformInput && (
        <div
          className={cn(
            "flex -mt-2 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm",
            "border-border focus-within:border-primary/50 transition-colors"
          )}
        >
          {current.options && (
            <span className="text-muted-foreground text-xs w-4 shrink-0">
              {(current.options?.length ?? 0) + 1}
            </span>
          )}
          <input
            type="text"
            value={currentFreeform}
            onChange={(e) => handleFreeformChange(e.target.value)}
            placeholder={
              current.options ? "Or enter custom answer…" : "Enter your answer…"
            }
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={isFirst}
                  onClick={() => setCurrentIndex((i) => i - 1)}
                >
                  <ChevronLeft />
                </Button>
              }
            />
            <TooltipContent>
              Previous question <Kbd>←</Kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={isLast}
                  onClick={() => setCurrentIndex((i) => i + 1)}
                >
                  <ChevronRight />
                </Button>
              }
            />
            <TooltipContent>
              Next question <Kbd>→</Kbd>
            </TooltipContent>
          </Tooltip>
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

      <AlertDialog open={showDismissDialog} onOpenChange={setShowDismissDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard questions?</AlertDialogTitle>
            <AlertDialogDescription>
              Your answers will be lost and no message will be sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDismiss}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
