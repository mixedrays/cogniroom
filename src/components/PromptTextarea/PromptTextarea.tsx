import { useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { useSettings } from "@/modules/settings/context/SettingsContext";
import {
  AVAILABLE_MODELS,
  getModelPriceLabel,
  getValidModel,
} from "@/lib/llmModels";
import { cn } from "@/lib/utils";

type PromptTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string, model: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function PromptTextarea({
  value,
  onChange,
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSendDisabled = disabled || !value.trim();

  return (
    <div
      className={cn(
        "border rounded-md transition-[border-color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
      )}
    >
      <textarea
        className="w-full resize-none bg-transparent px-3 pt-3 text-sm outline-none placeholder:text-muted-foreground field-sizing-content focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
      <div className="flex items-center justify-between px-2 pb-2">
        <Select
          value={selectedModel}
          onValueChange={(value) => {
            if (value) setSelectedModel(value);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="border-0 shadow-none hover:bg-accent transition-colors">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectGroup>
              {Object.entries(AVAILABLE_MODELS).map(([key, model]) => (
                <SelectItem key={key} value={key} className="justify-between">
                  {model.label}
                  <span className="text-muted-foreground">
                    {getModelPriceLabel(model)}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

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
      </div>
    </div>
  );
}
