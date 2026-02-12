import { Link, useParams, useLocation } from "@tanstack/react-router";
import { BookOpen, ClipboardList, Code } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ContentBadge } from "./ContentBadge";
import type { ActiveSection } from "./utils";

export interface LessonItemProps {
  lesson: Lesson;
  topicIndex: number;
  lessonIndex: number;
}

export function LessonItem({
  lesson,
  topicIndex,
  lessonIndex,
}: LessonItemProps) {
  const { courseId, lessonId: activeLessonId } = useParams({
    strict: false,
  }) as {
    courseId?: string;
    lessonId?: string;
  };
  const location = useLocation();

  if (!courseId) return null;

  const isActive = activeLessonId === lesson.id;

  // Determine which section is active based on the current path
  let activeSection: ActiveSection = null;
  if (isActive) {
    const path = location.pathname;
    if (path.endsWith("/tests")) {
      activeSection = "tests";
    } else if (path.endsWith("/exercises")) {
      activeSection = "exercises";
    } else {
      activeSection = "theory";
    }
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={cn(
          "group/lesson flex-col items-start gap-1.5 h-auto py-2 transition-colors",
          isActive && "bg-primary/15!"
        )}
        render={
          <Link
            to="/course/$courseId/lesson/$lessonId"
            params={{ courseId, lessonId: lesson.id }}
          />
        }
      >
        <div className="flex items-center gap-2 w-full min-w-0">
          <span className="text-sm truncate flex-1">
            {topicIndex + 1}.{lessonIndex + 1} {lesson.title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <ContentBadge
            hasContent={lesson.hasContent ?? false}
            completed={
              lesson.hasContent &&
              (lesson.theoryCompleted ?? lesson.completed ?? false)
            }
            isActive={isActive}
            isActiveSection={activeSection === "theory"}
            icon={<BookOpen />}
            label="Theory"
            to="/course/$courseId/lesson/$lessonId"
            params={{ courseId, lessonId: lesson.id }}
          />

          <ContentBadge
            hasContent={lesson.hasTests ?? false}
            isActive={isActive}
            isActiveSection={activeSection === "tests"}
            completed={lesson.hasTests && (lesson.testsCompleted ?? false)}
            icon={<ClipboardList />}
            label="Tests"
            to="/course/$courseId/lesson/$lessonId/tests"
            params={{ courseId, lessonId: lesson.id }}
          />

          <ContentBadge
            hasContent={lesson.hasExercises ?? false}
            isActive={isActive}
            isActiveSection={activeSection === "exercises"}
            completed={
              lesson.hasExercises && (lesson.exercisesCompleted ?? false)
            }
            icon={<Code />}
            label="Exercises"
            to="/course/$courseId/lesson/$lessonId/exercises"
            params={{ courseId, lessonId: lesson.id }}
          />
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
