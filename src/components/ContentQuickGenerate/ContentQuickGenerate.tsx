import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContentCreationDialog,
  formatGenerationOptions,
  type ContentGenerationData,
  type ContentContext,
  type GenerationType,
} from "@/components/ContentCreationDialog";
import {
  generateLesson,
  generateLessonFlashcards,
  generateLessonQuiz,
  generateLessonExercises,
  type GenerateLessonContentOptions,
} from "@/lib/courses";

export type ContentType = "theory" | "flashcards" | "quiz" | "exercises";

interface ContentQuickGenerateProps {
  contentType: ContentType;
  courseId: string;
  lessonId: string;
  contentContext?: ContentContext;
}

const CONTENT_LABELS: Record<ContentType, string> = {
  theory: "Lesson",
  flashcards: "Flashcards",
  quiz: "Quiz",
  exercises: "Exercises",
};

const GENERATION_TYPE_MAP: Record<ContentType, GenerationType> = {
  theory: "theory",
  flashcards: "flashcards",
  quiz: "quiz",
  exercises: "exercises",
};

type GenerateFn = (
  courseId: string,
  lessonId: string,
  options?: GenerateLessonContentOptions
) => Promise<{ success: boolean; error?: string }>;

const GENERATE_FN_MAP: Record<ContentType, GenerateFn> = {
  theory: generateLesson,
  flashcards: generateLessonFlashcards,
  quiz: generateLessonQuiz,
  exercises: generateLessonExercises,
};

function generateContent(
  contentType: ContentType,
  courseId: string,
  lessonId: string,
  data: ContentGenerationData
) {
  const fn = GENERATE_FN_MAP[contentType];
  return fn(courseId, lessonId, {
    additionalInstructions: data.instructions,
    model: data.model,
    includeContent: data.includeContent,
    generationOptions: formatGenerationOptions(data.type, data.options),
  });
}

export function ContentQuickGenerate({
  contentType,
  courseId,
  lessonId,
  contentContext,
}: ContentQuickGenerateProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const invalidateAndRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    if (contentType === "theory") {
      await queryClient.invalidateQueries({
        queryKey: ["lesson", courseId, lessonId],
      });
    }
    router.invalidate();
  }, [queryClient, courseId, lessonId, contentType, router]);

  const handleGenerate = useCallback(
    async (data: ContentGenerationData) => {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await generateContent(
          contentType,
          courseId,
          lessonId,
          data
        );
        if (result.success) {
          setDialogOpen(false);
          await invalidateAndRefresh();
        } else {
          setError(result.error || "Failed to generate content");
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setIsGenerating(false);
      }
    },
    [contentType, courseId, lessonId, invalidateAndRefresh]
  );

  const label = CONTENT_LABELS[contentType];

  return (
    <div className="flex flex-col items-center gap-1">
      <ContentCreationDialog
        mode="generate"
        generationType={GENERATION_TYPE_MAP[contentType]}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGenerate={handleGenerate}
        isCreating={isGenerating}
        error={error}
        contentContext={contentContext}
        trigger={
          <Button variant="secondary" disabled={isGenerating}>
            {isGenerating ? <Loader2 className="animate-spin" /> : <Zap />}
            {isGenerating ? `Generating ${label}…` : `Quick Create ${label}`}
          </Button>
        }
      />
    </div>
  );
}
