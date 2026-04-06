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
import type { Flashcard, ReviewData } from "@/lib/types";
import {
  LessonPageShell,
  LessonPageHeader,
  LessonEmptyState,
} from "@/components/LessonPage";
import { QuickCreate } from "@/components/QuickCreate";

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
  const [isCompleted, setIsCompleted] = useState(
    lessonInfo.flashcardsCompleted ?? false
  );

  useEffect(() => {
    setIsCompleted(lessonInfo.flashcardsCompleted ?? false);
  }, [lessonInfo.flashcardsCompleted]);

  const cards = useMemo(() => parseFlashcards(content), [content]);
  const hasCards = cards.length > 0;

  const handleSave = useCallback(
    async (data: ReviewData) => {
      await saveFlashcardsReviews(courseId, lessonId, { ...data, lessonId });
    },
    [courseId, lessonId]
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

  return (
    <LessonPageShell>
      <LessonPageHeader
        courseId={courseId}
        lessonId={lessonId}
        courseTitle={course.title}
        topicIndex={topicIndex}
        topicLessons={topicInfo?.lessons ?? []}
        activeTab="flashcards"
        hasContent={hasCards}
        showMarkComplete={hasCards}
        isCompleted={isCompleted}
        isCompleting={isCompleting}
        completionError={completionError}
        onToggleComplete={handleToggleComplete}
        contentContext={{
          courseTitle: course.title,
          topicTitle: topicInfo?.title,
          topicDescription: topicInfo?.description,
          lessonTitle: lessonInfo.title,
          lessonDescription: lessonInfo.description,
        }}
      />

      {hasCards ? (
        <div className="flex-1 min-h-0">
          <div className="max-w-4xl w-full mx-auto min-h-0 p-4 h-full">
            <SM2UI
              cards={cards}
              reviewData={reviewData}
              onSave={handleSave}
              className="m-auto h-full"
            />
          </div>
        </div>
      ) : (
        <LessonEmptyState
          title={lessonInfo.title}
          description={
            lessonInfo.description ||
            "No flashcards available for this lesson yet."
          }
        >
          <QuickCreate
            contentType="flashcards"
            courseId={courseId}
            lessonId={lessonId}
            wizardContext={{
              contentType: "flashcards",
              courseId,
              lessonId,
              topic: topicInfo?.title,
              lessonTitle: lessonInfo.title,
              courseTitle: course.title,
            }}
            contentContext={{
              courseTitle: course.title,
              topicTitle: topicInfo?.title,
              topicDescription: topicInfo?.description,
              lessonTitle: lessonInfo.title,
              lessonDescription: lessonInfo.description,
            }}
          />
        </LessonEmptyState>
      )}
    </LessonPageShell>
  );
}
