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
import { Suspense, useEffect, useState } from "react";

import { Markdown } from "@/modules/markdown";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLesson, getCourse, updateLessonCompletion } from "@/lib/courses";
import { ContentQuickGenerate } from "@/components/ContentQuickGenerate";
import { WizardAgentInline } from "@/modules/wizard-agent";
import {
  LessonPageShell,
  LessonPageHeader,
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
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(
    lessonInfo.theoryCompleted ?? lessonInfo.completed ?? false
  );

  useEffect(() => {
    setIsCompleted(lessonInfo.theoryCompleted ?? lessonInfo.completed ?? false);
  }, [lessonInfo.theoryCompleted, lessonInfo.completed]);

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

  const headerProps = {
    courseId,
    lessonId,
    courseTitle: course.title,
    topicIndex,
    topicLessons: topicInfo?.lessons ?? [],
    activeTab: "theory" as const,
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
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <LessonContentArea
              title={lessonInfo.title}
              description={lessonInfo.description}
            >
              <Markdown content={content} variant="lesson" />
            </LessonContentArea>
          </Suspense>
        </>
      ) : (
        <WizardAgentInline
          context={{
            contentType: "lesson",
            courseId,
            lessonId,
            topic: topicInfo?.title,
            lessonTitle: lessonInfo.title,
            courseTitle: course.title,
          }}
          welcomeTitle={lessonInfo.title}
          welcomeDescription={
            lessonInfo.description ||
            "No content available for this lesson yet."
          }
          placeholder="Describe the lesson content you want to create…"
          className="max-w-3xl w-full mx-auto"
          promptExtra={
            <ContentQuickGenerate
              contentType="theory"
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
