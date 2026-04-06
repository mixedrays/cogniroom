import { Link, useLocation } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { BookOpen as IconApp, Settings } from "lucide-react";
import { SettingsDialog } from "@/modules/settings";
import CourseList from "@/components/CourseList";
import CourseTree from "@/components/CourseTree";
import { Tooltip, TooltipContent } from "../ui/tooltip";
import { TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";

export default function AppSidebar() {
  const location = useLocation();
  const isCourseView = location.pathname.startsWith("/course/");
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="offExamples">
      <SidebarHeader className="flex-row border-b items-center justify-between">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                className="hover:bg-secondary"
                render={<Link to="/" />}
              >
                <IconApp /> {import.meta.env.APP_NAME}
              </Button>
            }
          />

          <TooltipContent side="right">v{APP_VERSION}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<SidebarTrigger />} />
          <TooltipContent side="right">
            {open ? "Close" : "Open"} sidebar{" "}
            <Kbd>⌘ + B</Kbd>
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>

      <SidebarContent className="overflow-xhidden relative p-0">
        <div
          className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out ${
            isCourseView ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <CourseList />
        </div>

        <div
          className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out ${
            isCourseView ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <CourseTree />
        </div>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SettingsDialog
            trigger={
              <SidebarMenuButton>
                <Settings />
                Settings
              </SidebarMenuButton>
            }
          />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
