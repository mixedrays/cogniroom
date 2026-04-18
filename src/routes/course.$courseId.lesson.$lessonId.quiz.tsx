import {
  createFileRoute,
  useLoaderData,
  useParams,
  useRouter,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getLessonQuiz,
  getCourse,
  updateLessonCompletion,
} from "@/lib/courses";
import { Quiz } from "@/modules/quiz";
import type { QuizQuestion } from "@/lib/types";
import {
  LessonPageShell,
  LessonPageHeader,
} from "@/components/LessonPage";
import { ContentQuickGenerate } from "@/components/ContentQuickGenerate";
import { WizardAgentInline } from "@/modules/wizard-agent";

export const Route = createFileRoute("/course/$courseId/lesson/$lessonId/quiz")(
  {
    loader: async ({ params }) => {
      const [course, lessonData] = await Promise.all([
        getCourse(params.courseId),
        getLessonQuiz(params.courseId, params.lessonId),
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
    component: LessonQuizComponent,
  }
);

const parseQuizQuestions = (
  input: { version: number; quizQuestions: QuizQuestion[] } | null
): QuizQuestion[] => {
  if (!input || !Array.isArray(input.quizQuestions)) return [];
  return input.quizQuestions.filter((q): q is QuizQuestion => {
    if (!q?.id || typeof q.question !== "string") return false;
    if (q.type === "choice")
      return Array.isArray(q.options) && q.options.length > 0;
    if (q.type === "true-false") return typeof q.answer === "boolean";
    return false;
  });
};

function LessonQuizComponent() {
  const { course, lessonInfo, topicInfo, topicIndex, content } = useLoaderData({
    from: "/course/$courseId/lesson/$lessonId/quiz",
  });
  const { courseId, lessonId } = useParams({
    from: "/course/$courseId/lesson/$lessonId/quiz",
  });
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(
    lessonInfo.quizCompleted ?? false
  );

  useEffect(() => {
    setIsCompleted(lessonInfo.quizCompleted ?? false);
  }, [lessonInfo.quizCompleted]);

  const questions = useMemo(() => parseQuizQuestions(content), [content]);
  const hasQuestions = questions.length > 0;

  const handleToggleComplete = async () => {
    setIsCompleting(true);
    setCompletionError(null);
    try {
      const nextCompleted = !isCompleted;
      const result = await updateLessonCompletion(
        courseId,
        lessonId,
        nextCompleted,
        "quiz"
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
    activeTab: "quiz" as const,
    hasContent: hasQuestions,
    showMarkComplete: hasQuestions,
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
      {hasQuestions ? (
        <>
          <LessonPageHeader {...headerProps} />
          <div className="flex-1 min-h-0">
            <div className="max-w-4xl w-full mx-auto min-h-0 h-full">
              <Quiz.Container className="m-auto h-full" questions={questions}>
                <Quiz.KeyboardShortcuts />
                <Quiz.Topbar />
                <Quiz.QuestionView />
                <Quiz.Controls />
              </Quiz.Container>
            </div>
          </div>
        </>
      ) : (
        <WizardAgentInline
          context={{
            contentType: "quiz",
            courseId,
            lessonId,
            topic: topicInfo?.title,
            lessonTitle: lessonInfo.title,
            courseTitle: course.title,
          }}
          welcomeTitle={lessonInfo.title}
          welcomeDescription={
            lessonInfo.description ||
            "No quiz available for this lesson yet."
          }
          placeholder="Describe the quiz you want to create…"
          className="max-w-3xl w-full mx-auto"
          promptExtra={
            <ContentQuickGenerate
              contentType="quiz"
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
