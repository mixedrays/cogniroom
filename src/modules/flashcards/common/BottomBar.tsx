import React from "react";
import { ArrowLeft as IconPrev, ArrowRight as IconNext } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
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
            Previous card <Kbd>J</Kbd>
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
            Next card <Kbd>K</Kbd>
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
