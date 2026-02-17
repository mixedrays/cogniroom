import {
  createFileRoute,
  useLoaderData,
  useParams,
  useRouter,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback, useEffect } from "react";
import { Layers, ListChecks, Plus } from "lucide-react";
import {
  getLessonTests,
  getCourse,
  generateLessonTests,
  updateLessonCompletion,
} from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Flashcards } from "@/modules/flashcards/components/Flashcards";
import { Quiz } from "@/modules/quiz";
import { useOS } from "@/hooks/use-os";
import type { Flashcard, QuizQuestion, TestsContent } from "@/lib/types";
import {
  ContentCreationDialog,
  type ContentGenerationData,
} from "@/components/ContentCreationDialog";
import {
  LessonPageShell,
  LessonPageHeader,
  LessonEmptyState,
} from "@/components/LessonPage";

export const Route = createFileRoute(
  "/course/$courseId/lesson/$lessonId/tests"
)({
  loader: async ({ params }) => {
    const [course, lessonData] = await Promise.all([
      getCourse(params.courseId),
      getLessonTests(params.courseId, params.lessonId),
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
  component: LessonTestsComponent,
});

type TestsContentLike = TestsContent | string | null;

const parseTestsContent = (
  input: TestsContentLike
): { content: TestsContent | null; error?: string } => {
  if (!input) {
    return { content: null };
  }

  let parsed: TestsContent;

  if (typeof input === "string") {
    try {
      parsed = JSON.parse(input) as TestsContent;
    } catch (error) {
      return { content: null, error: "Invalid tests content format" };
    }
  } else {
    parsed = input;
  }

  const flashcardsSource = Array.isArray(parsed.flashcards)
    ? parsed.flashcards
    : [];
  const normalizedFlashcards: Flashcard[] = flashcardsSource
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
      knownCount: card.knownCount,
    }));

  const quizSource = Array.isArray(parsed.quizQuestions)
    ? parsed.quizQuestions
    : [];
  const normalizedQuiz: QuizQuestion[] = quizSource
    .filter(
      (q): q is QuizQuestion =>
        typeof q?.question === "string" &&
        typeof q?.answer === "string" &&
        Array.isArray(q?.options) &&
        q.options.length > 0
    )
    .map((q, index) => ({
      id:
        typeof q.id === "string" && q.id.trim().length > 0
          ? q.id.trim()
          : `quiz-${index + 1}`,
      question: q.question.trim(),
      answer: q.answer.trim(),
      options: q.options.map((o: string) => String(o).trim()),
    }));

  return {
    content: {
      version: parsed.version ?? 1,
      flashcards: normalizedFlashcards,
      quizQuestions: normalizedQuiz,
      legacyMarkdown: parsed.legacyMarkdown,
    },
  };
};

function LessonTestsComponent() {
  const { course, lessonInfo, topicInfo, content } = useLoaderData({
    from: "/course/$courseId/lesson/$lessonId/tests",
  });
  const { courseId, lessonId } = useParams({
    from: "/course/$courseId/lesson/$lessonId/tests",
  });
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(
    lessonInfo.testsCompleted ?? false
  );

  useEffect(() => {
    setIsCompleted(lessonInfo.testsCompleted ?? false);
  }, [lessonInfo.testsCompleted]);

  const { content: parsedContent, error: parseError } = useMemo(
    () => parseTestsContent(content as TestsContentLike),
    [content]
  );
  const cards = parsedContent?.flashcards ?? [];
  const quizQuestions = parsedContent?.quizQuestions ?? [];
  const hasCards = cards.length > 0;
  const hasQuiz = quizQuestions.length > 0;
  const hasContent = hasCards || hasQuiz;
  const defaultTab = hasCards ? "flashcards" : "quiz";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const { isMac } = useOS();

  useEffect(() => {
    if (hasCards && hasQuiz) {
      setActiveTab((prev) =>
        prev === "flashcards" || prev === "quiz" ? prev : defaultTab
      );
      return;
    }

    if (hasCards) {
      setActiveTab("flashcards");
      return;
    }

    if (hasQuiz) {
      setActiveTab("quiz");
    }
  }, [hasCards, hasQuiz, defaultTab]);

  const handleGenerate = useCallback(
    async (data: ContentGenerationData) => {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await generateLessonTests(
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
          setError(result.error || "Failed to generate tests content");
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
        "tests"
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
        activeTab="tests"
        showMarkComplete={hasContent}
        isCompleted={isCompleted}
        isCompleting={isCompleting}
        completionError={completionError}
        onToggleComplete={handleToggleComplete}
      />

      {hasContent ? (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 mt-4 min-h-0 flex flex-col"
        >
          {hasCards && hasQuiz && (
            <TabsList className="mx-auto min-w-62 mt-2">
              <TabsTrigger value="flashcards" className="gap-2">
                <Layers />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="quiz" className="gap-2">
                <ListChecks />
                Quiz
              </TabsTrigger>
            </TabsList>
          )}

          {hasCards && (
            <TabsContent value="flashcards" className="flex-1 min-h-0">
              <div className="max-w-4xl w-full mx-auto min-h-0 p-4 h-full">
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
              </div>
            </TabsContent>
          )}

          {hasQuiz && (
            <TabsContent value="quiz" className="flex-1 min-h-0">
              <div className="max-w-4xl w-full mx-auto min-h-0 p-4 h-full">
                <Quiz.Container
                  className="m-auto h-full"
                  questions={quizQuestions}
                >
                  <Quiz.KeyboardShortcuts />
                  <Quiz.Topbar />
                  <Quiz.QuestionView />
                  <Quiz.Controls />
                </Quiz.Container>
              </div>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <LessonEmptyState
          title={lessonInfo.title}
          description={
            lessonInfo.description || "No tests available for this lesson yet."
          }
          extra={
            parseError ? (
              <p className="text-sm text-destructive">{parseError}</p>
            ) : undefined
          }
        >
          <ContentCreationDialog
            mode="generate"
            generationType="tests"
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
                Create Tests Content
              </Button>
            }
          />
        </LessonEmptyState>
      )}
    </LessonPageShell>
  );
}
