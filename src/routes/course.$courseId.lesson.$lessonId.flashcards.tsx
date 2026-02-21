import {
  createFileRoute,
  useLoaderData,
  useParams,
  useRouter,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  getLessonFlashcards,
  getCourse,
  generateLessonFlashcards,
  deleteLessonFlashcards,
  updateLessonCompletion,
  getFlashcardsReviews,
  saveFlashcardsReviews,
} from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { Flashcards } from "@/modules/flashcards/components/Flashcards";
import { StudyFlashCard } from "@/modules/flashcards";
import SM2QualityControls from "@/modules/flashcards/components/SM2QualityControls";
import SM2SessionTopbar from "@/modules/flashcards/components/SM2SessionTopbar";
import { useFlashcardsSM2 } from "@/modules/flashcards/hooks/useFlashcardsSM2";
import { useOS } from "@/hooks/use-os";
import type { Flashcard, ReviewData } from "@/lib/types";
import {
  ContentCreationDialog,
  type ContentGenerationData,
} from "@/components/ContentCreationDialog";
import {
  LessonPageShell,
  LessonPageHeader,
  LessonEmptyState,
} from "@/components/LessonPage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

interface SM2StudyViewProps {
  cards: Flashcard[];
  reviewData: ReviewData | null;
  lessonId: string;
  courseId: string;
}

function SM2StudyView({ cards, reviewData, lessonId, courseId }: SM2StudyViewProps) {
  const [forceAll, setForceAll] = useState(false);

  const handleSave = useCallback(
    async (data: ReviewData) => {
      await saveFlashcardsReviews(courseId, lessonId, {
        ...data,
        lessonId,
      });
    },
    [courseId, lessonId]
  );

  const {
    sessionCards,
    currentIndex,
    currentCard,
    dueCount,
    newCount,
    sessionComplete,
    isSaving,
    rateCard,
    resetSession,
  } = useFlashcardsSM2(cards, reviewData, handleSave, forceAll);

  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  if (sessionCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
        <p className="text-lg font-medium">No cards due for review</p>
        <p className="text-muted-foreground text-sm">
          All cards are scheduled for a future session. Check back later.
        </p>
        <Button variant="outline" onClick={() => setForceAll(true)}>
          Review anyway
        </Button>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
        <p className="text-xl font-semibold">Session complete!</p>
        <p className="text-muted-foreground text-sm">
          All {sessionCards.length} cards reviewed.
        </p>
        <Button variant="outline" onClick={resetSession}>
          Review again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SM2SessionTopbar
        currentIndex={currentIndex}
        sessionCards={sessionCards}
        dueCount={dueCount}
        newCount={newCount}
        sessionComplete={sessionComplete}
        onReset={resetSession}
      />

      <div
        className="flex-1 flex items-center justify-center px-4 pb-6 pt-4 overflow-hidden cursor-pointer"
        onClick={() => setIsFlipped((f) => !f)}
      >
        {currentCard && (
          <StudyFlashCard
            question={currentCard.question}
            answer={currentCard.answer}
            isFlipped={isFlipped}
            className="h-full w-full sm:h-auto"
            isFlippedByDefault={false}
          />
        )}
      </div>

      <div className="p-4 flex justify-center">
        {isFlipped ? (
          <SM2QualityControls
            currentCard={currentCard}
            sessionComplete={sessionComplete}
            isSaving={isSaving}
            onRate={rateCard}
          />
        ) : (
          <Button variant="outline" onClick={() => setIsFlipped(true)}>
            Show Answer{" "}
            <span className="ml-1 text-xs text-muted-foreground">(Space)</span>
          </Button>
        )}
      </div>
    </div>
  );
}

function LessonFlashcardsComponent() {
  const { course, lessonInfo, topicInfo, content, reviewData } = useLoaderData({
    from: "/course/$courseId/lesson/$lessonId/flashcards",
  });
  const { courseId, lessonId } = useParams({
    from: "/course/$courseId/lesson/$lessonId/flashcards",
  });
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(
    lessonInfo.flashcardsCompleted ?? false
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studyMode, setStudyMode] = useState<"classic" | "sm2">("classic");

  useEffect(() => {
    setIsCompleted(lessonInfo.flashcardsCompleted ?? false);
  }, [lessonInfo.flashcardsCompleted]);

  const cards = useMemo(() => parseFlashcards(content), [content]);
  const hasCards = cards.length > 0;

  const { isMac } = useOS();

  const handleGenerate = useCallback(
    async (data: ContentGenerationData) => {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await generateLessonFlashcards(
          courseId,
          lessonId,
          data.instructions,
          data.model,
          data.includeContent
        );
        if (result.success) {
          setIsDialogOpen(false);
          await queryClient.invalidateQueries({
            queryKey: ["course", courseId],
          });
          router.invalidate();
        } else {
          setError(result.error || "Failed to generate flashcards");
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setIsGenerating(false);
      }
    },
    [courseId, lessonId, queryClient, router]
  );

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const result = await deleteLessonFlashcards(courseId, lessonId);
      if (result.success) {
        setDeleteDialogOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["course", courseId] });
        router.invalidate();
      } else {
        setError(result.error || "Failed to delete flashcards");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setIsDeleting(false);
    }
  }, [courseId, lessonId, queryClient, router]);

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
        topicTitle={topicInfo?.title}
        activeTab="flashcards"
        showMarkComplete={hasCards}
        isCompleted={isCompleted}
        isCompleting={isCompleting}
        completionError={completionError}
        onToggleComplete={handleToggleComplete}
        extraActions={
          hasCards ? (
            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
            >
              <AlertDialogTrigger
                render={
                  <Button size="icon" variant="outline">
                    <Trash2 />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete flashcards?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all flashcards for this lesson.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : undefined
        }
      />

      {hasCards ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex gap-2 px-4 pt-3">
            <Button
              variant={studyMode === "classic" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStudyMode("classic")}
            >
              Classic
            </Button>
            <Button
              variant={studyMode === "sm2" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStudyMode("sm2")}
            >
              Spaced Repetition
            </Button>
          </div>

          <div className="flex-1 min-h-0">
            <div className="max-w-4xl w-full mx-auto min-h-0 p-4 h-full">
              {studyMode === "classic" ? (
                <Flashcards.Container className="m-auto h-full" cards={cards}>
                  <Flashcards.KeyboardShortcuts />
                  <Flashcards.Topbar />
                  <Flashcards.Slider />
                  <Flashcards.BottomBar>
                    <Flashcards.KnownCardControls
                      finishShortcutLabel={`${isMac ? "⌘" : "Ctrl"} + Enter`}
                    />
                  </Flashcards.BottomBar>
                </Flashcards.Container>
              ) : (
                <SM2StudyView
                  cards={cards}
                  reviewData={reviewData}
                  courseId={courseId}
                  lessonId={lessonId}
                />
              )}
            </div>
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
          <ContentCreationDialog
            mode="generate"
            generationType="flashcards"
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
                <Plus />
                Create Flashcards
              </Button>
            }
          />
        </LessonEmptyState>
      )}
    </LessonPageShell>
  );
}
