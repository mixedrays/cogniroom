import { useState, useCallback } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  AskUserV2ParamsSchema,
  type AskUserV2Params,
  type AskUserV2Question,
} from "./schema";

type Answers = Record<string, string | string[]>;

const DECIDE_FOR_ME = "Decide for me";

interface AskUserV2WidgetProps {
  params: unknown;
  isStreaming?: boolean;
  onSubmit: (result: unknown) => void;
  onDismiss: () => void;
}

function computeInitialAnswers(questions: AskUserV2Question[]): Answers {
  const initial: Answers = {};
  for (const q of questions) {
    const recommended =
      q.options?.filter((o) => o.recommended).map((o) => o.label) ?? [];
    if (recommended.length > 0) {
      initial[q.header] = q.multiSelect ? recommended : recommended[0];
    }
  }
  return initial;
}

interface AskUserV2FormProps {
  data: AskUserV2Params;
  onSubmit: (result: unknown) => void;
  onDismiss: () => void;
}

function AskUserV2Form({ data, onSubmit, onDismiss }: AskUserV2FormProps) {
  const [answers, setAnswers] = useState<Answers>(() =>
    computeInitialAnswers(data.questions)
  );
  const [freeformValues, setFreeformValues] = useState<Record<string, string>>(
    {}
  );
  const [showDismissDialog, setShowDismissDialog] = useState(false);

  const handleToggle = useCallback((q: AskUserV2Question, label: string) => {
    if (q.multiSelect) {
      setAnswers((a) => {
        const prev = Array.isArray(a[q.header])
          ? (a[q.header] as string[])
          : [];
        const filtered = prev.filter((o) => o !== DECIDE_FOR_ME);
        const next = filtered.includes(label)
          ? filtered.filter((o) => o !== label)
          : [...filtered, label];
        return { ...a, [q.header]: next };
      });
    } else {
      setAnswers((a) => ({ ...a, [q.header]: label }));
      setFreeformValues((f) => ({ ...f, [q.header]: "" }));
    }
  }, []);

  const handleDecideForMe = useCallback((q: AskUserV2Question) => {
    setFreeformValues((f) => ({ ...f, [q.header]: "" }));
    setAnswers((a) => ({
      ...a,
      [q.header]: q.multiSelect ? [DECIDE_FOR_ME] : DECIDE_FOR_ME,
    }));
  }, []);

  const isDecideForMeSelected = (q: AskUserV2Question): boolean => {
    const ans = answers[q.header];
    if (q.multiSelect) {
      return Array.isArray(ans) && ans.includes(DECIDE_FOR_ME);
    }
    return ans === DECIDE_FOR_ME;
  };

  const handleFreeformChange = useCallback(
    (q: AskUserV2Question, value: string) => {
      setFreeformValues((f) => ({ ...f, [q.header]: value }));
      if (q.multiSelect) {
        if (!value) return;
        setAnswers((a) => {
          const prev = Array.isArray(a[q.header])
            ? (a[q.header] as string[])
            : [];
          if (!prev.includes(DECIDE_FOR_ME)) return a;
          return {
            ...a,
            [q.header]: prev.filter((o) => o !== DECIDE_FOR_ME),
          };
        });
        return;
      }
      setAnswers((a) => {
        const next = { ...a };
        if (value) {
          next[q.header] = value;
        } else {
          delete next[q.header];
        }
        return next;
      });
    },
    []
  );

  const isOptionSelected = (q: AskUserV2Question, label: string): boolean => {
    const ans = answers[q.header];
    if (q.multiSelect) {
      return Array.isArray(ans) && ans.includes(label);
    }
    return ans === label;
  };

  const handleSubmit = () => {
    const result: Answers = { ...answers };
    for (const q of data.questions) {
      const freeform = freeformValues[q.header]?.trim();
      if (!freeform) continue;
      if (q.multiSelect) {
        const existing = Array.isArray(result[q.header])
          ? (result[q.header] as string[])
          : [];
        result[q.header] = [...existing, freeform];
      }
    }
    onSubmit(result);
  };

  return (
    <div className="rounded-2xl border bg-card px-5 py-4">
      <div className="flex items-start justify-between gap-2 mb-4">
        {data.title ? (
          <h3 className="text-lg font-semibold leading-tight">{data.title}</h3>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setShowDismissDialog(true)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-6">
        {data.questions.map((q) => {
          const freeform = freeformValues[q.header] ?? "";
          return (
            <div key={q.header} className="space-y-2">
              <div>
                <p className="text-sm font-semibold">{q.question}</p>
                {q.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {q.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {q.options?.map((opt) => {
                  const selected = isOptionSelected(q, opt.label);
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleToggle(q, opt.label)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm transition-colors cursor-pointer",
                        selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}

                {q.allowFreeformInput && (
                  <div
                    className={cn(
                      "flex items-center rounded-full border px-3.5 py-1.5 text-sm bg-background",
                      "focus-within:border-primary/50 transition-colors"
                    )}
                  >
                    <input
                      type="text"
                      value={freeform}
                      onChange={(e) => handleFreeformChange(q, e.target.value)}
                      placeholder="Other…"
                      className="bg-transparent outline-none placeholder:text-muted-foreground text-sm w-28"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleDecideForMe(q)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border border-dashed px-3.5 py-1.5 text-sm transition-colors cursor-pointer",
                    isDecideForMeSelected(q)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Sparkles className="size-3.5" />
                  Decide for me
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-5">
        <Button onClick={handleSubmit}>Submit</Button>
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

export function AskUserV2Widget({
  params,
  isStreaming,
  onSubmit,
  onDismiss,
}: AskUserV2WidgetProps) {
  const parsed = AskUserV2ParamsSchema.safeParse(params);
  if (!parsed.success) {
    if (isStreaming) {
      return (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground text-xs">
              Preparing questions…
            </span>
          </div>
        </div>
      );
    }
    return null;
  }
  return (
    <AskUserV2Form
      data={parsed.data}
      onSubmit={onSubmit}
      onDismiss={onDismiss}
    />
  );
}
