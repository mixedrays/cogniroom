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
import { Loader2, Plus, Wand2 } from "lucide-react";
import {
  getLesson,
  getCourse,
  generateLesson,
  updateLessonCompletion,
} from "@/lib/courses";
import { Button } from "@/components/ui/button";
import {
  ContentCreationDialog,
  type ContentGenerationData,
} from "@/components/ContentCreationDialog";
import { WizardDialog } from "@/modules/wizard";
import {
  LessonPageShell,
  LessonPageHeader,
  LessonEmptyState,
  LessonContentArea,
} from "@/components/LessonPage";

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

    let lessonInfo = null;
    let topicInfo = null;
    let topicIndex = 1;

    for (let ti = 0; ti < course.topics.length; ti++) {
      const topic = course.topics[ti];
      for (const lesson of topic.lessons ?? []) {
        if (lesson.id === params.lessonId) {
          lessonInfo = lesson;
          topicInfo = topic;
          topicIndex = ti + 1;
        }
      }
    }

    if (!lessonInfo) {
      throw new Error("Lesson ID not found in course");
    }

    return {
      course,
      lessonInfo,
      topicInfo,
      topicIndex,
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
    topicIndex,
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
  const [wizardOpen, setWizardOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(
    lessonInfo.theoryCompleted ?? lessonInfo.completed ?? false
  );

  useEffect(() => {
    setIsCompleted(lessonInfo.theoryCompleted ?? lessonInfo.completed ?? false);
  }, [lessonInfo.theoryCompleted, lessonInfo.completed]);

  const handleWizardGenerate = useCallback(
    async (prompt: string) => {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await generateLesson(courseId, lessonId, prompt);
        if (result.success) {
          setWizardOpen(false);
          await queryClient.invalidateQueries({
            queryKey: ["course", courseId],
          });
          if (result.content) {
            queryClient.setQueryData(
              lessonQueryOptions(courseId, lessonId).queryKey,
              { content: result.content }
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
    <LessonPageShell>
      <LessonPageHeader
        courseId={courseId}
        lessonId={lessonId}
        courseTitle={course.title}
        topicIndex={topicIndex}
        topicLessons={topicInfo?.lessons ?? []}
        activeTab="theory"
        showMarkComplete={!!content}
        isCompleted={isCompleted}
        isCompleting={isCompleting}
        completionError={completionError}
        onToggleComplete={handleToggleComplete}
      />

      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        {content ? (
          <LessonContentArea
            title={lessonInfo.title}
            description={lessonInfo.description}
          >
            <Markdown content={content} variant="lesson" />
          </LessonContentArea>
        ) : (
          <LessonEmptyState
            title={lessonInfo.title}
            description={
              lessonInfo.description ||
              "No content available for this lesson yet."
            }
          >
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
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              onClick={() => setWizardOpen(true)}
            >
              <Wand2 className="size-4" />
              AI Wizard
            </Button>
          </LessonEmptyState>
        )}
      </Suspense>
      <WizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        context={{
          contentType: "lesson",
          courseId,
          lessonId,
          topic: topicInfo?.title,
          lessonTitle: lessonInfo.title,
        }}
        onGenerate={handleWizardGenerate}
      />
    </LessonPageShell>
  );
}
