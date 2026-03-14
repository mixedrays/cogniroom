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
  getModelLabelWithPrice,
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
        <SelectValue>{(v) => getModelLabel(v)}</SelectValue>
      </SelectTrigger>
      <SelectContent className={cn("w-auto", className)}>
        <SelectGroup>
          {Object.entries(AVAILABLE_MODELS).map(([key, model]) => (
            <SelectItem key={key} value={key}>
              <div className="flex flex-col gap-1">
                {getModelLabelWithPrice(model)}
                {showDefault && key === DEFAULT_MODEL && " (default)"}
                {model.hint && (
                  <div className="text-xs text-muted-foreground block">
                    {model.hint}
                  </div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
