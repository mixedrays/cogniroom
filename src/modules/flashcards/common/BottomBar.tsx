import React from "react";
import {
  ArrowUp as IconPrev,
  ArrowDown as IconNext,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomBarProps {
  onScrollToPrev: () => void;
  onScrollToNext: () => void;
  isFirstSlide: boolean;
  isLastSlide: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function BottomBar({
  onScrollToPrev,
  onScrollToNext,
  isFirstSlide,
  isLastSlide,
  children,
  className,
}: BottomBarProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-1 p-4",
        className
      )}
    >
      <Tooltip
        content={
          <>
            Previous card{" "}
            <span className="text-muted-foreground text-xs">(Up Arrow)</span>
          </>
        }
      >
        <span>
          <Button
            variant="secondary"
            size="icon-lg"
            onClick={onScrollToPrev}
            disabled={isFirstSlide}
          >
            <IconPrev />
          </Button>
        </span>
      </Tooltip>

      {children}

      <Tooltip
        content={
          <>
            Next card{" "}
            <span className="text-muted-foreground text-xs">(Down Arrow)</span>
          </>
        }
      >
        <span>
          <Button
            variant="secondary"
            size="icon-lg"
            onClick={onScrollToNext}
            disabled={isLastSlide}
          >
            <IconNext />
          </Button>
        </span>
      </Tooltip>
    </div>
  );
}
