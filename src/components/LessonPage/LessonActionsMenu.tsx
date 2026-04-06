import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
  EllipsisVertical,
  Trash2,
  RefreshCw,
  Loader2,
  CircleCheck,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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

interface LessonActionsMenuProps {
  courseId: string;
  lessonId: string;
  contentType: ContentType;
  hasContent: boolean;
  contentContext?: ContentContext;
  showMarkComplete: boolean;
  isCompleted: boolean;
  isCompleting: boolean;
  onToggleComplete: () => void;
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

export function LessonActionsMenu({
  courseId,
  lessonId,
  contentType,
  hasContent,
  contentContext,
  showMarkComplete,
  isCompleted,
  isCompleting,
  onToggleComplete,
}: LessonActionsMenuProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
        setIsDeleteDialogOpen(false);
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <EllipsisVertical />
          <span className="sr-only">Lesson actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="w-auto">
          {showMarkComplete && (
            <DropdownMenuItem
              onClick={onToggleComplete}
              disabled={isCompleting}
            >
              {isCompleted ? <Circle /> : <CircleCheck />}
              {isCompleted ? "Mark Incomplete" : "Mark Complete"}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => setIsRegenerateDialogOpen(true)}>
            <RefreshCw />
            Regenerate {label}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 />
            Delete {label}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ContentCreationDialog
        mode="generate"
        generationType={generationType}
        open={isRegenerateDialogOpen}
        onOpenChange={setIsRegenerateDialogOpen}
        onGenerate={handleRegenerate}
        isCreating={isRegenerating}
        error={error}
        contentContext={contentContext}
        trigger={<button hidden />}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {label} for this lesson. You can
              regenerate it later. Any completion progress will be reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && !isRegenerateDialogOpen && !isDeleteDialogOpen && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </>
  );
}
