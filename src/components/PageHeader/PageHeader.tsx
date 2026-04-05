import { PanelRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { PropsWithChildren } from "react";

interface PageHeaderProps extends PropsWithChildren {
  showRightSidebarToggle?: boolean;
}

export function PageHeader({
  children,
  showRightSidebarToggle = true,
}: PageHeaderProps) {
  const { toggleSidebarByName } = useSidebar();

  return (
    <div className="sticky p-2 gap-2 mx-0.5 flex items-center left-0 top-0 z-20 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Page content (breadcrumbs, actions, etc.) */}
      <div className="flex-1 gap-2 px-2 flex items-center justify-between min-w-0">
        {children}
      </div>

      {showRightSidebarToggle && (
        <>
          <Separator
            orientation="vertical"
            className="h-4 relative top-1/2 -translate-y-1/2"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleSidebarByName("right")}
          >
            <PanelRightIcon className="h-4 w-4" />
            <span className="sr-only">Toggle Right Sidebar</span>
          </Button>
        </>
      )}
    </div>
  );
}
