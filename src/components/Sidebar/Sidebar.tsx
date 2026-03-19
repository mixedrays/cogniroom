import { useLocation } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Settings } from "lucide-react";
import { SettingsDialog } from "@/modules/settings";
import CourseList from "@/components/CourseList";
import CourseTree from "@/components/CourseTree";

export default function AppSidebar() {
  const location = useLocation();
  const isCourseView = location.pathname.startsWith("/course/");

  return (
    <Sidebar collapsible="offExamples">
      {/* <SidebarHeader className="flex-row items-center justify-between border-b px-3">
        <span className="font-semibold text-sm">Courses</span>
        <SidebarTrigger />
      </SidebarHeader> */}
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
