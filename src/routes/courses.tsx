import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Book,
  FileJson,
  Home,
  Link as LinkIcon,
  Plus,
  Sparkles,
} from "lucide-react";
import { listCourses } from "@/lib/courses";
import type { CourseMetadata } from "@/modules/core";
import { HOME_PROMPT_TEXTAREA_ID } from "@/lib/dom-ids";
import { PageHeader } from "@/components/PageHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/courses")({
  component: CoursesPage,
});

function sourceIcon(source: CourseMetadata["source"]) {
  if (source === "llm") return <Sparkles className="size-4" />;
  if (source === "import") return <FileJson className="size-4" />;
  return <LinkIcon className="size-4" />;
}

/** Sends the user to the home prompt, focused and ready for a new course. */
function focusHomePrompt() {
  requestAnimationFrame(() => {
    const el = document.getElementById(HOME_PROMPT_TEXTAREA_ID);
    if (el instanceof HTMLTextAreaElement) el.focus();
  });
}

function CoursesPage() {
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: listCourses,
  });

  const courses = coursesQuery.data ?? [];

  return (
    <div className="relative animate-in fade-in duration-500 h-full flex flex-col overflow-auto">
      <PageHeader>
        <Breadcrumbs
          className="flex items-center"
          items={[
            { title: "", icon: <Home className="size-4" />, link: "/" },
            { title: "Courses" },
          ]}
        />
      </PageHeader>

      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 w-full">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Courses
            </h1>
            <p className="text-muted-foreground">
              Skill roadmaps with topics and lessons — generated, imported, or
              extracted from a source.
            </p>
          </div>
          {courses.length > 0 && (
            <Button
              className="shrink-0"
              nativeButton={false}
              render={
                <Link
                  to="/"
                  search={{ session: undefined }}
                  onClick={focusHomePrompt}
                >
                  <Plus />
                  Create course
                </Link>
              }
            />
          )}
        </div>

        {coursesQuery.isLoading ? (
          <LoadingState variant="skeleton" skeletonRows={4} />
        ) : coursesQuery.isError ? (
          <ErrorState
            variant="banner"
            title="Failed to load courses"
            message={coursesQuery.error?.message || "Unknown error"}
            onRetry={() => coursesQuery.refetch()}
            showRetry
          />
        ) : courses.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <Book className="size-12 mx-auto mb-4 opacity-40" />
            <h2 className="text-lg font-medium mb-1">No courses yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Describe a skill you want to learn and the assistant will build a
              roadmap for it.
            </p>
            <Button
              nativeButton={false}
              render={
                <Link
                  to="/"
                  search={{ session: undefined }}
                  onClick={focusHomePrompt}
                >
                  <Plus />
                  Create course
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {courses.map((course) => (
              <Link
                key={course.id}
                to="/course/$courseId"
                params={{ courseId: course.id }}
                className="rounded-xl border bg-card p-5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                    {sourceIcon(course.source)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{course.title}</h3>
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <span className="bg-muted px-1.5 py-0.5 rounded capitalize">
                        {course.source}
                      </span>
                      <span>·</span>
                      <span>{course.topicCount} topics</span>
                      <span>·</span>
                      <span>{course.lessonCount} lessons</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {course.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
