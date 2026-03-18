import { useState } from "react";
import { ArrowUp, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/modules/settings/context/SettingsContext";
import { getValidModel } from "@/lib/llmModels";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import { cn } from "@/lib/utils";

type PromptTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string, model: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
};

export function PromptTextarea({
  value,
  onChange,
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
  isStreaming = false,
  onStop,
}: PromptTextareaProps) {
  const { settings } = useSettings();
  const [selectedModel, setSelectedModel] = useState(() =>
    getValidModel(settings.llm.defaultModel)
  );

  const handleSubmit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSubmit(text, selectedModel);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isStreaming) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSendDisabled = disabled || !value.trim();
  const isInputDisabled = disabled || isStreaming;

  return (
    <div
      className={cn(
        "border rounded-md transition-[border-color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
      )}
    >
      <textarea
        className="w-full resize-none bg-transparent px-3 pt-3 pb-2 text-sm outline-none placeholder:text-muted-foreground field-sizing-content focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isInputDisabled}
      />
      <div className="flex items-center justify-between px-2 pb-2">
        <ModelSelect
          value={selectedModel}
          onValueChange={setSelectedModel}
          disabled={isInputDisabled}
          triggerClassName="border-0 shadow-none hover:bg-accent transition-colors"
        />

        {isStreaming ? (
          <Button
            size="icon"
            onClick={onStop}
            aria-label="Stop"
            variant="secondary"
          >
            <Square className="size-3 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={isSendDisabled}
            aria-label={disabled ? "Sending..." : "Send"}
          >
            {disabled ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
