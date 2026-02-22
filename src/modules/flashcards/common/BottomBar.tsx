import React from "react";
import {
  ArrowUp as IconPrev,
  ArrowDown as IconNext,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSharedContext } from "./context";

interface BottomBarProps {
  children?: React.ReactNode;
  className?: string;
}

export function BottomBar({ children, className }: BottomBarProps) {
  const { slidesApi } = useSharedContext();

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
            onClick={slidesApi.scrollToPrev}
            disabled={slidesApi.isFirstSlide}
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
            onClick={slidesApi.scrollToNext}
            disabled={slidesApi.isLastSlide}
          >
            <IconNext />
          </Button>
        </span>
      </Tooltip>
    </div>
  );
}
