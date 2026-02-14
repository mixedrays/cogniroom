import {
  createFileRoute,
  useLoaderData,
  useParams,
  useRouter,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { Markdown } from "@/modules/markdown";
import { Plus } from "lucide-react";
import {
  getLessonExercises,
  getCourse,
  generateLessonExercises,
  updateLessonCompletion,
} from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader";
import { LessonTabs } from "@/components/LessonTabs/LessonTabs";
import {
  ContentCreationDialog,
  type ContentGenerationData,
} from "@/components/ContentCreationDialog";

export const Route = createFileRoute(
  "/course/$courseId/lesson/$lessonId/exercises"
)({
  loader: async ({ params }) => {
    const [course, lessonData] = await Promise.all([
      getCourse(params.courseId),
      getLessonExercises(params.courseId, params.lessonId),
    ]);

    if (!course) {
      throw new Error("Course not found");
    }

    let lessonInfo = null;
    let topicInfo = null;

    for (const topic of course.topics) {
      const l = topic.lessons?.find((x) => x.id === params.lessonId);
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
  component: LessonExercisesComponent,
});

function LessonExercisesComponent() {
  const { course, lessonInfo, topicInfo, content } = useLoaderData({
    from: "/course/$courseId/lesson/$lessonId/exercises",
  });
  const { courseId, lessonId } = useParams({
    from: "/course/$courseId/lesson/$lessonId/exercises",
  });
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(
    lessonInfo.exercisesCompleted ?? false
  );

  useEffect(() => {
    setIsCompleted(lessonInfo.exercisesCompleted ?? false);
  }, [lessonInfo.exercisesCompleted]);

  const handleGenerate = useCallback(
    async (data: ContentGenerationData) => {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await generateLessonExercises(
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
          router.invalidate();
        } else {
          setError(result.error || "Failed to generate exercises content");
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setIsGenerating(false);
      }
    },
    [courseId, lessonId, queryClient, router]
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
        "exercises"
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
    <div className="relative animate-in fade-in duration-500 h-full flex flex-col overflow-y-auto">
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
                current: true,
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

      {/* <LessonTabs
        className="max-w-4xl w-full mx-auto px-8 pt-4"
        courseId={courseId}
        lessonId={lessonId}
        value="exercises"
      /> */}

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
                "No exercises available for this lesson yet."}
            </p>
          </div>

          <ContentCreationDialog
            mode="generate"
            generationType="exercises"
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
                Create Exercises Content
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
