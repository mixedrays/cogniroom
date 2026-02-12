import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { Course } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { courseQueryOptions, calculateCourseStats } from "./utils";
import { CourseHeader } from "./CourseHeader";
import { CourseTreeSkeleton } from "./CourseTreeSkeleton";
import { TopicItem } from "./TopicItem";

export default function CourseTree() {
  const { courseId } = useParams({ strict: false }) as { courseId: string };
  const courseQuery = useQuery({
    ...courseQueryOptions(courseId),
    enabled: Boolean(courseId),
  });

  const course = (courseQuery.data ?? null) as Course | null;
  const isLoading = courseQuery.isLoading;

  if (isLoading) {
    return <CourseTreeSkeleton />;
  }

  if (!course) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Course not found</p>
        <Button variant="link" render={<Link to="/">Go back</Link>}>
          Return home
        </Button>
      </div>
    );
  }

  const stats = calculateCourseStats(course);

  return (
    <div className="flex flex-col h-full">
      <CourseHeader course={course} stats={stats} />

      {/* Syllabus */}
      <div className="flex-1 min-h-0 h-full overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs tracking-wider">
            Syllabus
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {course.topics.map((topic, index) => (
                <TopicItem key={topic.id} topic={topic} index={index} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    </div>
  );
}
