import { type ReactNode } from "react";
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
import { useSidebarSectionState } from "@/modules/settings";
import { cn } from "@/lib/utils";

interface CollapsibleSidebarGroupProps {
  sectionId: string;
  label: ReactNode;
  labelClassName?: string;
  children: ReactNode;
  groupClassName?: string;
}

export function CollapsibleSidebarGroup({
  sectionId,
  label,
  labelClassName,
  groupClassName,
  children,
}: CollapsibleSidebarGroupProps) {
  const { open, setOpen } = useSidebarSectionState(sectionId);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarGroup className={groupClassName}>
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
        <CollapsibleContent>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
