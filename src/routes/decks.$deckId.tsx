import {
  createFileRoute,
  useLoaderData,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Layers, ListChecks, Trash2 } from "lucide-react";
import {
  deleteDeck,
  getDeck,
  getDeckFlashcards,
  getDeckQuiz,
  getDeckReviews,
  saveDeckReviews,
} from "@/lib/decks";
import type { Flashcard, QuizQuestion, ReviewData } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
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
import { SM2UI } from "@/modules/flashcards/strategies/SM2/SM2UI";
import { Quiz } from "@/modules/quiz";
import { decksQueryKey } from "@/components/DeckList";

export const Route = createFileRoute("/decks/$deckId")({
  loader: async ({ params }) => {
    const deck = await getDeck(params.deckId);
    if (!deck) {
      throw new Error("Deck not found");
    }
    if (deck.kind === "flashcards") {
      const [flashcardsData, reviewData] = await Promise.all([
        getDeckFlashcards(params.deckId),
        getDeckReviews(params.deckId),
      ]);
      return {
        deck,
        flashcards: flashcardsData?.content ?? null,
        quiz: null,
        reviewData,
      };
    }
    const quizData = await getDeckQuiz(params.deckId);
    return {
      deck,
      flashcards: null,
      quiz: quizData?.content ?? null,
      reviewData: null,
    };
  },
  component: DeckViewer,
});

function parseFlashcards(
  input: { version: number; flashcards: Flashcard[] } | null
): Flashcard[] {
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
}

function parseQuizQuestions(
  input: { version: number; quizQuestions: QuizQuestion[] } | null
): QuizQuestion[] {
  if (!input || !Array.isArray(input.quizQuestions)) return [];
  return input.quizQuestions.filter((q): q is QuizQuestion => {
    if (!q?.id || typeof q.question !== "string") return false;
    if (q.type === "choice")
      return Array.isArray(q.options) && q.options.length > 0;
    if (q.type === "true-false") return typeof q.answer === "boolean";
    return false;
  });
}

function DeckViewer() {
  const { deck, flashcards, quiz, reviewData } = useLoaderData({
    from: "/decks/$deckId",
  });
  const { deckId } = useParams({ from: "/decks/$deckId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const cards = useMemo(() => parseFlashcards(flashcards), [flashcards]);
  const questions = useMemo(() => parseQuizQuestions(quiz), [quiz]);
  const hasContent =
    deck.kind === "flashcards" ? cards.length > 0 : questions.length > 0;

  const handleSaveReviews = useCallback(
    async (data: ReviewData) => {
      await saveDeckReviews(deckId, { ...data, lessonId: deckId });
    },
    [deckId]
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteDeck(deckId);
      if (!result.success) {
        setDeleteError(result.error || "Failed to delete");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: decksQueryKey });
      navigate({ to: "/decks" });
    } catch (e) {
      setDeleteError(String(e));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative animate-in fade-in duration-500 h-full flex flex-col">
      <PageHeader
        actions={
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger
              render={
                <Button size="icon-sm" variant="ghost" title="Delete deck">
                  <Trash2 />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete deck?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{deck.title}".
                </AlertDialogDescription>
                {deleteError && (
                  <p className="text-sm text-destructive">{deleteError}</p>
                )}
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
        }
      >
        <Breadcrumbs
          className="flex items-center"
          items={[
            { title: "", icon: <Home className="size-4" />, link: "/" },
            { title: "Decks", link: "/decks" },
            {
              title: deck.title,
              icon:
                deck.kind === "flashcards" ? (
                  <Layers className="size-4" />
                ) : (
                  <ListChecks className="size-4" />
                ),
            },
          ]}
        />
      </PageHeader>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-6 md:px-8 pt-2 max-w-4xl w-full mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {deck.title}
          </h1>
          {deck.description && (
            <p className="text-muted-foreground mt-1">{deck.description}</p>
          )}
        </div>

        {!hasContent ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="rounded-xl border bg-card p-10 text-center max-w-md">
              <h2 className="text-lg font-medium mb-1">This deck is empty</h2>
              <p className="text-sm text-muted-foreground">
                {deck.kind === "flashcards"
                  ? "No flashcards yet. Phase 2 will add agent-based generation."
                  : "No quiz questions yet. Phase 2 will add agent-based generation."}
              </p>
            </div>
          </div>
        ) : deck.kind === "flashcards" ? (
          <div className="flex-1 min-h-0 mt-4">
            <div className="max-w-4xl w-full mx-auto min-h-0 h-full">
              <SM2UI
                cards={cards}
                reviewData={reviewData}
                onSave={handleSaveReviews}
                className="m-auto h-full"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 mt-4">
            <div className="max-w-4xl w-full mx-auto min-h-0 h-full">
              <Quiz.Container className="m-auto h-full" questions={questions}>
                <Quiz.KeyboardShortcuts />
                <Quiz.Topbar />
                <Quiz.QuestionView />
                <Quiz.Controls />
              </Quiz.Container>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
