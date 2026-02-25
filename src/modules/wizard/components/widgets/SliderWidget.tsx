import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AgentMessage } from "../../schema";

interface SliderWidgetProps {
  data: Extract<AgentMessage, { type: "slider" }>;
  onAnswer: (text: string, raw: unknown) => void;
  disabled?: boolean;
}

export function SliderWidget({ data, onAnswer, disabled }: SliderWidgetProps) {
  const [value, setValue] = useState(
    Math.round((data.min + data.max) / 2)
  );

  const handleSubmit = () => {
    onAnswer(`${value}${data.unit}`, value);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{data.question}</p>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{data.min}{data.unit}</span>
          <span className="font-medium text-foreground">
            {value}{data.unit}
          </span>
          <span>{data.max}{data.unit}</span>
        </div>
        <input
          type="range"
          min={data.min}
          max={data.max}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full accent-primary disabled:opacity-50"
        />
      </div>
      {!disabled && (
        <Button size="sm" onClick={handleSubmit}>
          Confirm
        </Button>
      )}
    </div>
  );
}
