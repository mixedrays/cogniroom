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
import {
  ContentCreationDialog,
  type ContentGenerationData,
} from "@/components/ContentCreationDialog";
import {
  LessonPageShell,
  LessonPageHeader,
  LessonEmptyState,
  LessonContentArea,
} from "@/components/LessonPage";

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
    <LessonPageShell>
      <LessonPageHeader
        courseId={courseId}
        lessonId={lessonId}
        courseTitle={course.title}
        topicTitle={topicInfo?.title}
        activeTab="exercises"
        showMarkComplete={!!content}
        isCompleted={isCompleted}
        isCompleting={isCompleting}
        completionError={completionError}
        onToggleComplete={handleToggleComplete}
      />

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
            "No exercises available for this lesson yet."
          }
        >
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
        </LessonEmptyState>
      )}
    </LessonPageShell>
  );
}
