import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AgentMessage } from "../../schema";
import { cn } from "@/lib/utils";

interface CheckboxWidgetProps {
  data: Extract<AgentMessage, { type: "checkbox" }>;
  onAnswer: (text: string, raw: unknown) => void;
  disabled?: boolean;
}

export function CheckboxWidget({
  data,
  onAnswer,
  disabled,
}: CheckboxWidgetProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (option: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    const choices = Array.from(selected);
    if (choices.length === 0) return;
    onAnswer(choices.join(", "), choices);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{data.question}</p>
      <div className="flex flex-col gap-2">
        {data.options.map((option) => {
          const isSelected = selected.has(option);
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => toggle(option)}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors disabled:cursor-default disabled:opacity-50",
                {
                  "border-primary bg-primary/10 cursor-pointer": isSelected,
                  "border-border hover:border-primary/50 hover:bg-accent cursor-pointer":
                    !isSelected,
                }
              )}
            >
              <div
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-xs border",
                  {
                    "border-primary bg-primary": isSelected,
                    "border-muted-foreground/40": !isSelected,
                  }
                )}
              >
                {isSelected && (
                  <div className="size-2 rounded-xs bg-primary-foreground" />
                )}
              </div>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      {!disabled && (
        <Button size="sm" onClick={handleSubmit} disabled={selected.size === 0}>
          Confirm
        </Button>
      )}
    </div>
  );
}
