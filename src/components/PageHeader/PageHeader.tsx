import { PropsWithChildren, ReactNode } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";

interface PageHeaderProps extends PropsWithChildren {
  actions?: ReactNode;
}

export function PageHeader({ children, actions }: PageHeaderProps) {
  const { open } = useSidebar();

  return (
    <div className="sticky z-10 p-2 min-h-13 mx-0.5 flex items-center left-0 top-0 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <Tooltip>
        <TooltipTrigger render={<SidebarTrigger size="icon" />} />
        <TooltipContent>
          {open ? "Close" : "Open"} sidebar <Kbd>⌘ + B</Kbd>
        </TooltipContent>
      </Tooltip>

      {children && (
        <>
          <Separator orientation="vertical" className="mx-2 h-4 self-center!" />
          <div className="flex-1 gap-2 px-1 flex items-center justify-between min-w-0">
            {children}
          </div>
        </>
      )}

      {actions}
    </div>
  );
}
