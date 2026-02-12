import { queryOptions } from "@tanstack/react-query";
import type { Course } from "@/lib/types";
import { getCourse } from "@/lib/courses";

export type ActiveSection = "theory" | "tests" | "exercises" | null;

export const courseQueryOptions = (courseId: string) =>
  queryOptions({
    queryKey: ["course", courseId],
    queryFn: () => getCourse(courseId),
  });

export interface CourseStats {
  totalLessons: number;
  completedLessons: number;
  progress: number;
  topicCount: number;
}

export function calculateCourseStats(course: Course): CourseStats {
  let totalLessons = 0;
  let completedLessons = 0;

  for (const topic of course.topics) {
    totalLessons += topic.lessons.length;
    completedLessons += topic.lessons.filter(
      (l) => l.theoryCompleted ?? l.completed ?? false
    ).length;
  }

  const progress =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

  return {
    totalLessons,
    completedLessons,
    progress,
    topicCount: course.topics.length,
  };
}
