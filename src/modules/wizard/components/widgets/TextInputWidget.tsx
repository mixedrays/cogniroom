import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AgentMessage } from "../../schema";

interface TextInputWidgetProps {
  data: Extract<AgentMessage, { type: "text_input" }>;
  onAnswer: (text: string, raw: unknown) => void;
  disabled?: boolean;
}

export function TextInputWidget({ data, onAnswer, disabled }: TextInputWidgetProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAnswer(trimmed, trimmed);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{data.question}</p>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={data.placeholder ?? "Type your answer..."}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        {!disabled && (
          <Button size="sm" onClick={handleSubmit} disabled={!value.trim()}>
            Send
          </Button>
        )}
      </div>
    </div>
  );
}
