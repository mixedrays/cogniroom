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
  getModelPriceFullLabel,
  formatPricePerMillion,
  getModelLabel,
} from "@/lib/llmModels";
import { Tooltip } from "@/components/ui/tooltip.adapter";
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
                  {model.priceRating && (
                    <Tooltip
                      content={
                        <div className="space-y-1">
                          <div className="font-medium text-green-500">
                            {getModelPriceFullLabel(model)}
                          </div>
                          {model.price && (
                            <>
                              <div>
                                Input:{" "}
                                {formatPricePerMillion(model.price.input)} / 1M
                                tokens
                              </div>
                              <div>
                                Output:{" "}
                                {formatPricePerMillion(model.price.output)} / 1M
                                tokens
                              </div>
                            </>
                          )}
                        </div>
                      }
                    >
                      <span className="text-xs text-green-600 dark:text-green-400 cursor-help underline decoration-dotted underline-offset-2">
                        {getModelPriceLabel(model)}
                      </span>
                    </Tooltip>
                  )}
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
