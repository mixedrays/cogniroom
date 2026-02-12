import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/course/$courseId")({
  component: CourseLayout,
});

function CourseLayout() {
  return (
    <div className="overflow-auto h-full">
      <Outlet />
    </div>
  );
}
