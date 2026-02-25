import type { AgentMessage } from "../../schema";

interface RadioWidgetProps {
  data: Extract<AgentMessage, { type: "radio" }>;
  onAnswer: (text: string, raw: unknown) => void;
  disabled?: boolean;
}

export function RadioWidget({ data, onAnswer, disabled }: RadioWidgetProps) {
  return (
    <div className="space-y-2">
      <p className="mb-4 font-medium">{data.question}</p>
      <div className="flex flex-col gap-2">
        {data.options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onAnswer(option, option)}
            className="flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors border-border hover:border-primary/50 hover:bg-accent cursor-pointer disabled:cursor-default disabled:opacity-50"
          >
            <div className="flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/40" />
            <span>{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
