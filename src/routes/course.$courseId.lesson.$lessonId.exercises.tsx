import {
  createFileRoute,
  useLoaderData,
  useParams,
  useRouter,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { Markdown } from "@/modules/markdown";
import {
  getLessonExercises,
  getCourse,
  updateLessonCompletion,
} from "@/lib/courses";
import { WizardAgentSheet, useLessonAttachments } from "@/modules/wizard-agent";
import {
  LessonPageShell,
  LessonPageHeader,
  LessonContentArea,
  LessonContentEmptyState,
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
  const [agentOpen, setAgentOpen] = useState(false);

  useEffect(() => {
    setIsCompleted(lessonInfo.exercisesCompleted ?? false);
  }, [lessonInfo.exercisesCompleted]);

  const invalidateAndRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    router.invalidate();
  }, [queryClient, courseId, router]);

  const handleAgentOpenChange = useCallback(
    (open: boolean) => {
      setAgentOpen(open);
      if (!open) {
        invalidateAndRefresh();
      }
    },
    [invalidateAndRefresh]
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

  const attachments = useLessonAttachments({
    courseId,
    lessonId,
    enabled: agentOpen,
  });

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
      <LessonPageHeader
        {...headerProps}
        onOpenAgent={content ? () => setAgentOpen(true) : undefined}
      />
      {content ? (
        <LessonContentArea
          title={lessonInfo.title}
          description={lessonInfo.description}
        >
          <Markdown content={content} variant="lesson" />
        </LessonContentArea>
      ) : (
        <LessonContentEmptyState
          title={lessonInfo.title}
          description={
            lessonInfo.description ||
            "No exercises available for this lesson yet."
          }
          contentType="exercises"
          courseId={courseId}
          lessonId={lessonId}
          contentContext={headerProps.contentContext}
          onOpenAgent={() => setAgentOpen(true)}
        />
      )}
      <WizardAgentSheet
        open={agentOpen}
        onOpenChange={handleAgentOpenChange}
        context={{
          contentType: "exercise",
          courseId,
          lessonId,
          topic: topicInfo?.title,
          lessonTitle: lessonInfo.title,
          courseTitle: course.title,
        }}
        availableAttachments={attachments}
        defaultAttachmentIds={["exercises"]}
      />
    </LessonPageShell>
  );
}
