import type { Course } from "@/lib/types";
import type { CourseStats } from "./utils";

export interface CourseHeaderProps {
  course: Course;
  stats: CourseStats;
}

export function CourseHeader({ stats }: CourseHeaderProps) {
  return (
    <div className="flex p-4 pb-2 gap-2 flex-col">
      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
        <span>{stats.topicCount} Topics</span>
        <span>{stats.progress}% Complete</span>
      </div>

      <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${stats.progress}%` }}
        />
      </div>
    </div>
  );
}
