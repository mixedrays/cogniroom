import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { getCourse } from "@/lib/courses";
import { PageHeader } from "@/components/PageHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Code, Layers, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/course/$courseId/")({
  loader: async ({ params }) => {
    const course = await getCourse(params.courseId);
    if (!course) {
      throw new Error("Course not found");
    }
    return course;
  },
  component: CourseComponent,
});

function CourseComponent() {
  const course = useLoaderData({ from: "/course/$courseId/" });

  return (
    <div className="relative animate-in fade-in duration-500 h-full flex flex-col overflow-auto">
      <PageHeader>
        <Breadcrumbs
          className="flex items-center"
          items={[{ title: "Home", link: "/" }, { title: course.title }]}
        />
      </PageHeader>

      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 w-full">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {course.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="bg-muted px-2.5 py-0.5 rounded-md font-medium capitalize">
              {course.source}
            </span>
            <span>•</span>
            <span>{course.topics.length} topics</span>
            <span>•</span>
            <span>
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
              }).format(new Date(course.updatedAt))}
            </span>
          </div>
        </div>

        <div className="grid gap-6">
          {course.topics.map((topic, index) => (
            <div
              key={topic.id}
              className="rounded-xl border bg-card text-card-foreground shadow-sm"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold">
                    {topic.lessons[0] ? (
                      <Link
                        to="/course/$courseId/lesson/$lessonId"
                        params={{
                          courseId: course.id,
                          lessonId: topic.lessons[0].id,
                        }}
                        className="hover:underline"
                      >
                        {topic.title}
                      </Link>
                    ) : (
                      topic.title
                    )}
                  </h3>
                </div>
                {topic.description && (
                  <p className="text-muted-foreground mb-4 pl-12">
                    {topic.description}
                  </p>
                )}

                <div className="space-y-1 pl-12">
                  {topic.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {index + 1}.{lessonIndex + 1}
                      </div>

                      <Link
                        to="/course/$courseId/lesson/$lessonId"
                        params={{ courseId: course.id, lessonId: lesson.id }}
                        className="font-medium flex-1 truncate"
                      >
                        {lesson.title}
                      </Link>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          nativeButton={false}
                          render={
                            <Link
                              to="/course/$courseId/lesson/$lessonId/flashcards"
                              params={{
                                courseId: course.id,
                                lessonId: lesson.id,
                              }}
                              title="Flashcards"
                            />
                          }
                        >
                          <Layers />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          nativeButton={false}
                          render={
                            <Link
                              to="/course/$courseId/lesson/$lessonId/quiz"
                              params={{
                                courseId: course.id,
                                lessonId: lesson.id,
                              }}
                              title="Quiz"
                            />
                          }
                        >
                          <ListChecks />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          nativeButton={false}
                          render={
                            <Link
                              to="/course/$courseId/lesson/$lessonId/exercises"
                              params={{
                                courseId: course.id,
                                lessonId: lesson.id,
                              }}
                              title="Exercises"
                            />
                          }
                        >
                          <Code />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
