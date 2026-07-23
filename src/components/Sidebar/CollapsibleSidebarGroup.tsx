import { type ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useSidebarSectionState } from "@/modules/settings";
import { cn } from "@/lib/utils";

interface CollapsibleSidebarGroupProps {
  sectionId: string;
  label: ReactNode;
  labelClassName?: string;
  children: ReactNode;
  groupClassName?: string;
  /** When set, the label navigates to this route; the chevron toggles the group. */
  to?: LinkProps["to"];
}

export function CollapsibleSidebarGroup({
  sectionId,
  label,
  labelClassName,
  groupClassName,
  children,
  to,
}: CollapsibleSidebarGroupProps) {
  const { open, setOpen } = useSidebarSectionState(sectionId);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarGroup className={groupClassName}>
        {to ? (
          <SidebarGroupLabel className="pr-0">
            <Link
              to={to}
              className={cn(
                "flex flex-1 min-w-0 items-center gap-2 rounded-md cursor-pointer hover:text-sidebar-foreground",
                labelClassName
              )}
            >
              {label}
            </Link>
            <CollapsibleTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={open ? "Collapse section" : "Expand section"}
                >
                  <ChevronDown className="transition-transform duration-200 group-data-open/collapsible:rotate-180" />
                </Button>
              }
            />
          </SidebarGroupLabel>
        ) : (
          <SidebarGroupLabel
            render={
              <CollapsibleTrigger
                className={cn(
                  "w-full flex items-center gap-2 cursor-pointer hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  labelClassName
                )}
              />
            }
          >
            {label}
            <ChevronDown className="ml-auto size-3.5 transition-transform duration-200 group-data-open/collapsible:rotate-180" />
          </SidebarGroupLabel>
        )}
        <CollapsibleContent>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
