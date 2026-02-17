import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Trash2, RefreshCw, Loader2 } from "lucide-react";
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
import {
  ContentCreationDialog,
  type ContentContext,
  type ContentGenerationData,
  type GenerationType,
} from "@/components/ContentCreationDialog";
import {
  deleteLessonContent,
  deleteLessonFlashcards,
  deleteLessonQuiz,
  deleteLessonExercises,
  generateLesson,
  generateLessonFlashcards,
  generateLessonQuiz,
  generateLessonExercises,
} from "@/lib/courses";

type ContentType = "theory" | "flashcards" | "quiz" | "exercises";

interface LessonContentActionsProps {
  courseId: string;
  lessonId: string;
  contentType: ContentType;
  hasContent: boolean;
  contentContext?: ContentContext;
}

const CONTENT_LABELS: Record<ContentType, string> = {
  theory: "theory content",
  flashcards: "flashcards",
  quiz: "quiz",
  exercises: "exercises",
};

const GENERATION_TYPE_MAP: Record<ContentType, GenerationType> = {
  theory: "theory",
  flashcards: "flashcards",
  quiz: "quiz",
  exercises: "exercises",
};

export function LessonContentActions({
  courseId,
  lessonId,
  contentType,
  hasContent,
  contentContext,
}: LessonContentActionsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidateAndRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    if (contentType === "theory") {
      await queryClient.invalidateQueries({
        queryKey: ["lesson", courseId, lessonId],
      });
    }
    router.invalidate();
  }, [queryClient, courseId, lessonId, contentType, router]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const deleteFn =
        contentType === "theory"
          ? deleteLessonContent
          : contentType === "flashcards"
            ? deleteLessonFlashcards
            : contentType === "quiz"
              ? deleteLessonQuiz
              : deleteLessonExercises;

      const result = await deleteFn(courseId, lessonId);
      if (result.success) {
        await invalidateAndRefresh();
      } else {
        setError(result.error || "Failed to delete content");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setIsDeleting(false);
    }
  }, [courseId, lessonId, contentType, invalidateAndRefresh]);

  const handleRegenerate = useCallback(
    async (data: ContentGenerationData) => {
      setIsRegenerating(true);
      setError(null);
      try {
        const generateFn =
          contentType === "theory"
            ? generateLesson
            : contentType === "flashcards"
              ? generateLessonFlashcards
              : contentType === "quiz"
                ? generateLessonQuiz
                : generateLessonExercises;

        const result = await generateFn(
          courseId,
          lessonId,
          data.instructions,
          data.model
        );
        if (result.success) {
          setIsRegenerateDialogOpen(false);
          await invalidateAndRefresh();
        } else {
          setError(result.error || "Failed to regenerate content");
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setIsRegenerating(false);
      }
    },
    [courseId, lessonId, contentType, invalidateAndRefresh]
  );

  if (!hasContent) {
    return null;
  }

  const label = CONTENT_LABELS[contentType];
  const generationType: GenerationType = GENERATION_TYPE_MAP[contentType];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Actions
      </h3>

      <ContentCreationDialog
        mode="generate"
        generationType={generationType}
        open={isRegenerateDialogOpen}
        onOpenChange={setIsRegenerateDialogOpen}
        onGenerate={handleRegenerate}
        isCreating={isRegenerating}
        error={error}
        contentContext={contentContext}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            disabled={isDeleting}
          >
            <RefreshCw className="size-4" />
            Regenerate {label}
          </Button>
        }
      />

      <AlertDialog>
        <Button
          render={<AlertDialogTrigger />}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          disabled={isDeleting || isRegenerating}
        >
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Delete {label}
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {label} for this lesson. You can
              regenerate it later. Any completion progress will be reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && !isRegenerateDialogOpen && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
