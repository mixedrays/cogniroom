import { Link, useLocation } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { BookOpen as IconApp, Settings } from "lucide-react";
import { useSettingsSearch } from "@/modules/settings";
import CourseList from "@/components/CourseList";
import CourseTree from "@/components/CourseTree";
import { Tooltip, TooltipContent } from "../ui/tooltip";
import { TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";

export default function AppSidebar() {
  const location = useLocation();
  const isCourseView = location.pathname.startsWith("/course/");
  const { open: openSettings } = useSettingsSearch();
  return (
    <Sidebar>
      <SidebarHeader className="flex-row border-b items-center">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                className="hover:bg-secondary"
                nativeButton={false}
                render={<Link to="/" />}
              >
                <IconApp /> {import.meta.env.APP_NAME}
              </Button>
            }
          />

          <TooltipContent side="right">v{APP_VERSION}</TooltipContent>
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
          <SidebarMenuButton onClick={() => openSettings()}>
            <Settings />
            Settings
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
