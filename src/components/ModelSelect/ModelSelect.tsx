import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  getModelPriceLabel,
  getModelLabel,
} from "@/lib/llmModels";
import { cn } from "@/lib/utils";

type ModelSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  showDefault?: boolean;
  triggerClassName?: string;
};

export function ModelSelect({
  value,
  onValueChange,
  disabled,
  className,
  showDefault = false,
  triggerClassName,
}: ModelSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => v && onValueChange(v)}
      disabled={disabled}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue>{getModelLabel}</SelectValue>
      </SelectTrigger>

      <SelectContent className={cn("w-auto", className)}>
        <SelectGroup>
          {Object.entries(AVAILABLE_MODELS).map(([key, model]) => (
            <SelectItem key={key} value={key}>
              <div className="flex flex-col gap-1">
                <span>
                  {model.label}{" "}
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {getModelPriceLabel(model)}
                  </span>
                  {showDefault && key === DEFAULT_MODEL && (
                    <span> (default)</span>
                  )}
                </span>

                {model.hint && (
                  <span className="text-xs text-muted-foreground block">
                    {model.hint}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
