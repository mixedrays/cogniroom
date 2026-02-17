import {
  createFileRoute,
  useLoaderData,
  useParams,
  useRouter,
} from "@tanstack/react-router";
import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Suspense, useEffect, useState, useCallback } from "react";
import { Markdown } from "@/modules/markdown";
import { Loader2, Plus } from "lucide-react";
import {
  getLesson,
  getCourse,
  generateLesson,
  updateLessonCompletion,
} from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader";
import {
  ContentCreationDialog,
  type ContentGenerationData,
} from "@/components/ContentCreationDialog";

const lessonQueryOptions = (courseId: string, lessonId: string) =>
  queryOptions({
    queryKey: ["lesson", courseId, lessonId],
    queryFn: () => getLesson(courseId, lessonId),
  });

export const Route = createFileRoute("/course/$courseId/lesson/$lessonId/")({
  loader: async ({ params, context }) => {
    const [course, lessonData] = await Promise.all([
      getCourse(params.courseId),
      context.queryClient.ensureQueryData(
        lessonQueryOptions(params.courseId, params.lessonId)
      ),
    ]);

    if (!course) {
      throw new Error("Course not found");
    }

    // Find lesson details in course for title/breadcrumbs
    let lessonInfo = null;
    let topicInfo = null;

    for (const topic of course.topics) {
      const l = topic.lessons?.find(
        (x: { id: string }) => x.id === params.lessonId
      );
      if (l) {
        lessonInfo = l;
        topicInfo = topic;
        break;
      }
    }

    if (!lessonInfo) {
      throw new Error("Lesson ID not found in course");
    }

    return {
      course,
      lessonInfo,
      topicInfo,
      content: lessonData?.content || null,
    };
  },
  component: LessonComponent,
});

function LessonComponent() {
  const {
    course,
    lessonInfo,
    topicInfo,
    content: initialContent,
  } = useLoaderData({
    from: "/course/$courseId/lesson/$lessonId/",
  });
  const { courseId, lessonId } = useParams({
    from: "/course/$courseId/lesson/$lessonId/",
  });
  const queryClient = useQueryClient();
  const lessonQuery = useSuspenseQuery({
    ...lessonQueryOptions(courseId, lessonId),
    initialData: initialContent ? { content: initialContent } : undefined,
  });
  const content = lessonQuery.data?.content ?? null;
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(
    lessonInfo.theoryCompleted ?? lessonInfo.completed ?? false
  );

  useEffect(() => {
    setIsCompleted(lessonInfo.theoryCompleted ?? lessonInfo.completed ?? false);
  }, [lessonInfo.theoryCompleted, lessonInfo.completed]);

  const handleGenerate = useCallback(
    async (data: ContentGenerationData) => {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await generateLesson(
          courseId,
          lessonId,
          data.instructions,
          data.model
        );
        if (result.success) {
          setIsDialogOpen(false);
          await queryClient.invalidateQueries({
            queryKey: ["course", courseId],
          });
          if (result.content) {
            queryClient.setQueryData(
              lessonQueryOptions(courseId, lessonId).queryKey,
              {
                content: result.content,
              }
            );
          } else {
            await queryClient.invalidateQueries({
              queryKey: lessonQueryOptions(courseId, lessonId).queryKey,
            });
          }
        } else {
          setError(result.error || "Failed to generate lesson content");
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setIsGenerating(false);
      }
    },
    [courseId, lessonId, queryClient]
  );

  const handleToggleComplete = async () => {
    setIsCompleting(true);
    setCompletionError(null);
    try {
      const nextCompleted = !isCompleted;
      const result = await updateLessonCompletion(
        courseId,
        lessonId,
        nextCompleted,
        "theory"
      );

      if (result.success) {
        setIsCompleted(nextCompleted);
        router.invalidate();
      } else {
        setCompletionError(
          result.error || "Failed to update completion status"
        );
      }

      // revalidate course data to update progress
      await queryClient.invalidateQueries({
        queryKey: ["course", courseId],
      });
    } catch (e) {
      setCompletionError(String(e));
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="relative animate-in fade-in duration-500 h-full flex flex-col overflow-auto">
      <PageHeader>
        <Breadcrumbs
          className="flex items-center"
          items={[
            { title: "Home", link: "/" },
            {
              title: course.title,
              link: {
                to: "/course/$courseId",
                params: { courseId },
              },
            },
            {
              title: topicInfo?.title ?? "Lesson",
            },
            [
              {
                title: "Theory",
                link: {
                  to: "/course/$courseId/lesson/$lessonId",
                  params: { courseId, lessonId },
                },
                current: true,
              },
              {
                title: "Tests",
                link: {
                  to: "/course/$courseId/lesson/$lessonId/tests",
                  params: { courseId, lessonId },
                },
              },
              {
                title: "Exercises",
                link: {
                  to: "/course/$courseId/lesson/$lessonId/exercises",
                  params: { courseId, lessonId },
                },
              },
            ],
          ]}
        />

        <div className="flex items-center gap-2">
          {completionError && (
            <p className="text-sm text-destructive font-medium">
              {completionError}
            </p>
          )}
          {content && (
            <Button
              onClick={handleToggleComplete}
              disabled={isCompleting}
              variant={isCompleted ? "secondary" : "default"}
            >
              {isCompleted ? "Mark Incomplete" : "Mark Complete"}
            </Button>
          )}
        </div>
      </PageHeader>

      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        {content ? (
          <div className="max-w-4xl mx-auto p-6 md:p-8">
            <div className="mb-8 space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {lessonInfo.title}
              </h1>
              {lessonInfo.description && (
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {lessonInfo.description}
                </p>
              )}
            </div>

            <Markdown content={content} variant="lesson" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-6 p-6">
            <div className="text-center space-y-2 max-w-md">
              <h2 className="text-2xl font-bold tracking-tight">
                {lessonInfo.title}
              </h2>
              <p className="text-muted-foreground">
                {lessonInfo.description ||
                  "No content available for this lesson yet."}
              </p>
            </div>

            <ContentCreationDialog
              mode="generate"
              generationType="theory"
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              onGenerate={handleGenerate}
              isCreating={isGenerating}
              error={error}
              contentContext={{
                courseTitle: course.title,
                topicTitle: topicInfo?.title,
                topicDescription: topicInfo?.description,
                lessonTitle: lessonInfo.title,
                lessonDescription: lessonInfo.description,
              }}
              trigger={
                <Button size="lg" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Theory Content
                </Button>
              }
            />
          </div>
        )}
      </Suspense>
    </div>
  );
}
