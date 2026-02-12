import * as React from "react";
import {
  Tooltip as TooltipBase,
  TooltipTrigger,
  TooltipContent,
} from "./tooltip";

type TooltipContentProps = React.ComponentProps<typeof TooltipContent>;

type TooltipAdapterProps = {
  side?: TooltipContentProps["side"];
  sideOffset?: TooltipContentProps["sideOffset"];
  align?: TooltipContentProps["align"];
  content: React.ReactNode;
  children: React.ReactElement;
}

/**
 * Tooltip adapter component that provides a legacy-style API
 * with a `content` prop instead of requiring explicit TooltipTrigger
 * and TooltipContent components.
 *
 * @example
 * ```tsx
 * <Tooltip content="Tooltip text">
 *   <Button>Hover me</Button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  side,
  sideOffset,
  align,
}: TooltipAdapterProps) {
  return (
    <TooltipBase>
      <TooltipTrigger render={children} />
      <TooltipContent side={side} sideOffset={sideOffset} align={align}>
        {content}
      </TooltipContent>
    </TooltipBase>
  );
}
