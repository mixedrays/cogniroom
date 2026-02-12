import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/course/$courseId/lesson/$lessonId")({
  component: LessonLayout,
});

function LessonLayout() {
  return <Outlet />;
}
