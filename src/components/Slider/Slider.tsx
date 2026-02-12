import React from "react";
import { ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cn } from "@/lib/utils";

interface Slider {
  max: number;
  value: number;
  className?: string;
  onChange?: (index: number) => void;
  stepsStatuses?: (boolean | undefined)[];
  tooltipLabel?: string;
}

function Progress({
  className,
  children,
  value,
  ...props
}: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <ProgressTrack className="h-full">
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

const Slider: React.FC<Slider> = ({
  max,
  value = 0,
  className,
  stepsStatuses,
  onChange,
  tooltipLabel,
}) => {
  return (
    <div className={cn("group relative h-6 cursor-pointer", className)}>
      <Progress
        value={value + 1}
        max={max || 1}
        className="relative top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full transition-[height] group-hover:h-2.5"
      />

      {Array.from({ length: max }).map((_, index) => {
        const status = stepsStatuses?.[index];
        const isCurrent = index === value;
        const tooltipContent = tooltipLabel
          ? `${tooltipLabel} ${index + 1}`
          : `${index + 1}`;

        return (
          <Tooltip key={index} content={tooltipContent}>
            <div
              className="group/point absolute top-1/2 h-full -translate-y-1/2"
              onClick={() => onChange?.(index)}
              style={{
                left: `${(index / max) * 100}%`,
                width: `${100 / max}%`,
              }}
            >
              <div
                className={cn(
                  "absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all",
                  index >= value ? "bg-primary" : "bg-secondary",
                  status !== undefined && "border-background h-3 w-3 border-2",
                  status === true && "bg-green-500!",
                  status === false && "bg-red-500!",
                  "border-background group-hover/point:bg-primary group-hover/point:h-5 group-hover/point:w-2 group-hover/point:border-2",
                  isCurrent && "border-background h-4 w-2 border-2"
                )}
              />
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default Slider;
