import {
  createFileRoute,
  useLoaderData,
  useParams,
  useRouter,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Markdown } from "@/modules/markdown";
import { Bot } from "lucide-react";
import {
  getLessonExercises,
  getCourse,
  updateLessonCompletion,
} from "@/lib/courses";
import { Button } from "@/components/ui/button";
import {
  LessonPageShell,
  LessonPageHeader,
  LessonEmptyState,
  LessonContentArea,
} from "@/components/LessonPage";
import { WizardAgentDialog } from "@/modules/wizard-agent";

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
  const [agentOpen, setAgentOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(
    lessonInfo.exercisesCompleted ?? false
  );

  useEffect(() => {
    setIsCompleted(lessonInfo.exercisesCompleted ?? false);
  }, [lessonInfo.exercisesCompleted]);

  const handleAgentOpenChange = (open: boolean) => {
    setAgentOpen(open);
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      router.invalidate();
    }
  };

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
        topicIndex={topicIndex}
        topicLessons={topicInfo?.lessons ?? []}
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
          <Button
            size="lg"
            className="gap-2"
            onClick={() => setAgentOpen(true)}
          >
            <Bot className="size-4" />
            Create Exercises
          </Button>
        </LessonEmptyState>
      )}

      <WizardAgentDialog
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
      />
    </LessonPageShell>
  );
}
