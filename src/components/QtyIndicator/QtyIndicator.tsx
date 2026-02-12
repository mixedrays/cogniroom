import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QtyIndicatorProps {
  max: number;
  current: number;
  className?: string;
}

const QtyIndicator = ({ max, current, className }: QtyIndicatorProps) => {
  const circles = Array.from({ length: max });

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className={cn("flex gap-0.5 p-1", className)}>
          {circles.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-2 w-2 shrink-0 rounded",
                idx < current ? "bg-primary" : "bg-gray-300"
              )}
            />
          ))}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        Marked as learned ${current} of ${max} times
      </TooltipContent>
    </Tooltip>
  );
};

QtyIndicator.displayName = "QtyIndicator";

export default QtyIndicator;
