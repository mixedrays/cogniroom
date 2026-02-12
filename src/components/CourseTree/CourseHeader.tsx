import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { Course } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { SidebarHeader } from "@/components/ui/sidebar";
import type { CourseStats } from "./utils";

export interface CourseHeaderProps {
  course: Course;
  stats: CourseStats;
}

export function CourseHeader({ stats }: CourseHeaderProps) {
  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <Button
          variant="ghost"
          className="shrink-0 w-full justify-start"
          render={
            <Link to="/">
              <ArrowLeft />
              <span className="truncate">Back to Courses</span>
            </Link>
          }
        />
      </SidebarHeader>

      <SidebarHeader className="px-4 py-2">
        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
          <span>{stats.topicCount} Topics</span>
          <span>{stats.progress}% Complete</span>
        </div>

        <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </SidebarHeader>
    </>
  );
}
