import {
  createFileRoute,
  useLoaderData,
  useParams,
  useRouter,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback, useEffect } from "react";
import {
  getLessonFlashcards,
  getCourse,
  updateLessonCompletion,
  getFlashcardsReviews,
  saveFlashcardsReviews,
} from "@/lib/courses";
import { SM2UI } from "@/modules/flashcards/strategies/SM2/SM2UI";
import { isLessonSectionCompleted } from "@/lib/types";
import type { Flashcard, ReviewData } from "@/lib/types";
import {
  LessonPageShell,
  LessonPageHeader,
  LessonContentEmptyState,
} from "@/components/LessonPage";
import { WizardAgentSheet, useLessonAttachments } from "@/modules/wizard-agent";

export const Route = createFileRoute(
  "/course/$courseId/lesson/$lessonId/flashcards"
)({
  loader: async ({ params }) => {
    const [course, lessonData, reviewData] = await Promise.all([
      getCourse(params.courseId),
      getLessonFlashcards(params.courseId, params.lessonId),
      getFlashcardsReviews(params.courseId, params.lessonId),
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
      reviewData,
    };
  },
  component: LessonFlashcardsComponent,
});

const parseFlashcards = (
  input: { version: number; flashcards: Flashcard[] } | null
): Flashcard[] => {
  if (!input || !Array.isArray(input.flashcards)) return [];
  return input.flashcards
    .filter(
      (card) =>
        typeof card?.question === "string" && typeof card?.answer === "string"
    )
    .map((card, index) => ({
      id:
        typeof card?.id === "string" && card.id.trim().length > 0
          ? card.id.trim()
          : `card-${index + 1}`,
      question: card.question.trim(),
      answer: card.answer.trim(),
      hint: card.hint,
      difficulty: card.difficulty,
    }));
};

function LessonFlashcardsComponent() {
  const { course, lessonInfo, topicInfo, topicIndex, content, reviewData } =
    useLoaderData({
      from: "/course/$courseId/lesson/$lessonId/flashcards",
    });
  const { courseId, lessonId } = useParams({
    from: "/course/$courseId/lesson/$lessonId/flashcards",
  });
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const flashcardsCompleted = isLessonSectionCompleted(
    lessonInfo,
    "flashcards"
  );
  const [isCompleted, setIsCompleted] = useState(flashcardsCompleted);
  const [agentOpen, setAgentOpen] = useState(false);

  useEffect(() => {
    setIsCompleted(flashcardsCompleted);
  }, [flashcardsCompleted]);

  const cards = useMemo(() => parseFlashcards(content), [content]);
  const hasCards = cards.length > 0;

  const attachments = useLessonAttachments({
    courseId,
    lessonId,
    enabled: agentOpen,
  });

  const handleSave = useCallback(
    async (data: ReviewData) => {
      await saveFlashcardsReviews(courseId, lessonId, { ...data, lessonId });
    },
    [courseId, lessonId]
  );

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
        "flashcards"
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
    activeTab: "flashcards" as const,
    hasContent: hasCards,
    showMarkComplete: hasCards,
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
        onOpenAgent={hasCards ? () => setAgentOpen(true) : undefined}
      />
      {hasCards ? (
        <div className="flex-1 min-h-0">
          <div className="max-w-4xl w-full mx-auto min-h-0 h-full">
            <SM2UI
              cards={cards}
              reviewData={reviewData}
              onSave={handleSave}
              className="m-auto h-full"
            />
          </div>
        </div>
      ) : (
        <LessonContentEmptyState
          title={lessonInfo.title}
          description={
            lessonInfo.description ||
            "No flashcards available for this lesson yet."
          }
          contentType="flashcards"
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
          contentType: "flashcards",
          courseId,
          lessonId,
          topic: topicInfo?.title,
          lessonTitle: lessonInfo.title,
          courseTitle: course.title,
        }}
        availableAttachments={attachments}
        defaultAttachmentIds={["theory", "flashcards"]}
      />
    </LessonPageShell>
  );
}
