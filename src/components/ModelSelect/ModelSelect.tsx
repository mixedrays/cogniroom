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
} from "@/lib/llmModels";

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
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={className}>
        <SelectGroup>
          {Object.entries(AVAILABLE_MODELS).map(([key, model]) => (
            <SelectItem key={key} value={key}>
              {getModelLabelWithPrice(model)}
              {showDefault && key === DEFAULT_MODEL && " (default)"}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
