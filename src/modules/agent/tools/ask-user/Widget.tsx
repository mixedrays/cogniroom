import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AskUserParamsSchema } from "./schema";

interface AskUserWidgetProps {
  params: unknown;
  onSubmit: (result: unknown) => void;
  onDismiss: () => void;
}

export function AskUserWidget({
  params,
  onSubmit,
  onDismiss,
}: AskUserWidgetProps) {
  const parsed = AskUserParamsSchema.safeParse(params);
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");

  if (!parsed.success) return null;

  const data = parsed.data;

  const handleSubmit = () => {
    if (data.type === "radio") {
      if (selected.length === 0) return;
      onSubmit(selected[0]);
    } else if (data.type === "checkbox") {
      if (selected.length === 0) return;
      onSubmit(selected);
    } else {
      if (!text.trim()) return;
      onSubmit(text.trim());
    }
  };

  const toggleOption = (option: string) => {
    if (data.type === "radio") {
      setSelected([option]);
    } else {
      setSelected((prev) =>
        prev.includes(option)
          ? prev.filter((o) => o !== option)
          : [...prev, option]
      );
    }
  };

  const canSubmit =
    data.type === "text" ? text.trim().length > 0 : selected.length > 0;

  return (
    <div className="space-y-3">
      <p className="font-medium text-sm">{data.question}</p>

      {(data.type === "radio" || data.type === "checkbox") &&
        data.options && (
          <div className="flex flex-col gap-2">
            {data.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors cursor-pointer",
                  selected.includes(option)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                )}
              >
                <span>{option}</span>
              </button>
            ))}
          </div>
        )}

      {data.type === "text" && (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={data.placeholder ?? ""}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Skip
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
          Submit
        </Button>
      </div>
    </div>
  );
}
