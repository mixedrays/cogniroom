import { PanelLeftIcon, PanelRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface PageHeaderProps {
  children: React.ReactNode;
}

export function PageHeader({ children }: PageHeaderProps) {
  const { toggleSidebar, toggleSidebarByName } = useSidebar();

  return (
    <div className="sticky p-2 gap-2 flex items-center w-full left-0 top-0 z-20 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Left sidebar toggle */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <PanelLeftIcon className="h-4 w-4" />
        <span className="sr-only">Toggle Left Sidebar</span>
      </Button>

      <Separator orientation="vertical" />

      {/* Page content (breadcrumbs, actions, etc.) */}
      <div className="flex-1 gap-2 px-2 flex items-center justify-between min-w-0">
        {children}
      </div>

      <Separator orientation="vertical" />

      {/* Right sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => toggleSidebarByName("right")}
      >
        <PanelRightIcon className="h-4 w-4" />
        <span className="sr-only">Toggle Right Sidebar</span>
      </Button>
    </div>
  );
}
