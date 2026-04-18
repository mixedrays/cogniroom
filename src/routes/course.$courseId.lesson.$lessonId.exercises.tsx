import {
  createFileRoute,
  useLoaderData,
  useParams,
  useRouter,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/modules/markdown";
import {
  getLessonExercises,
  getCourse,
  updateLessonCompletion,
} from "@/lib/courses";
import { ContentQuickGenerate } from "@/components/ContentQuickGenerate";
import { WizardAgentInline } from "@/modules/wizard-agent";
import {
  LessonPageShell,
  LessonPageHeader,
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
  component: LessonExercisesComponent,
});

function LessonExercisesComponent() {
  const { course, lessonInfo, topicInfo, topicIndex, content } = useLoaderData({
    from: "/course/$courseId/lesson/$lessonId/exercises",
  });
  const { courseId, lessonId } = useParams({
    from: "/course/$courseId/lesson/$lessonId/exercises",
  });
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(
    lessonInfo.exercisesCompleted ?? false
  );

  useEffect(() => {
    setIsCompleted(lessonInfo.exercisesCompleted ?? false);
  }, [lessonInfo.exercisesCompleted]);

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

  const headerProps = {
    courseId,
    lessonId,
    courseTitle: course.title,
    topicIndex,
    topicLessons: topicInfo?.lessons ?? [],
    activeTab: "exercises" as const,
    hasContent: !!content,
    showMarkComplete: !!content,
    isCompleted,
    isCompleting,
    completionError,
    onToggleComplete: handleToggleComplete,
    contentContext: {
      courseTitle: course.title,
      topicTitle: topicInfo?.title,
      topicDescription: topicInfo?.description,
      lessonTitle: lessonInfo.title,
      lessonDescription: lessonInfo.description,
    },
  };

  return (
    <LessonPageShell>
      {content ? (
        <>
          <LessonPageHeader {...headerProps} />
          <LessonContentArea
            title={lessonInfo.title}
            description={lessonInfo.description}
          >
            <Markdown content={content} variant="lesson" />
          </LessonContentArea>
        </>
      ) : (
        <WizardAgentInline
          context={{
            contentType: "exercise",
            courseId,
            lessonId,
            topic: topicInfo?.title,
            lessonTitle: lessonInfo.title,
            courseTitle: course.title,
          }}
          welcomeTitle={lessonInfo.title}
          welcomeDescription={
            lessonInfo.description ||
            "No exercises available for this lesson yet."
          }
          placeholder="Describe the exercises you want to create…"
          className="max-w-3xl w-full mx-auto"
          promptExtra={
            <ContentQuickGenerate
              contentType="exercises"
              courseId={courseId}
              lessonId={lessonId}
              contentContext={headerProps.contentContext}
            />
          }
        >
          {({ hasMessages, onClear }) => (
            <LessonPageHeader
              {...headerProps}
              extraActions={
                hasMessages ? (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={onClear}
                    aria-label="Clear conversation"
                  >
                    <RotateCcw />
                  </Button>
                ) : undefined
              }
            />
          )}
        </WizardAgentInline>
      )}
    </LessonPageShell>
  );
}
