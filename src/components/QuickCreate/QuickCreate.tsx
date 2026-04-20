import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Sparkles, ChevronDown, Settings2, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ContentCreationDialog,
  type ContentGenerationData,
  type ContentContext,
  type GenerationType,
} from "@/components/ContentCreationDialog";
import {
  WizardAgentDialog,
  type WizardAgentContext,
} from "@/modules/wizard-agent";
import {
  generateLesson,
  generateLessonFlashcards,
  generateLessonQuiz,
  generateLessonExercises,
} from "@/lib/courses";

type ContentType = "theory" | "flashcards" | "quiz" | "exercises";

interface QuickCreateProps {
  contentType: ContentType;
  courseId: string;
  lessonId: string;
  wizardContext: WizardAgentContext;
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

/**
 * @deprecated Use `WizardAgentInline` with `ContentQuickGenerate` as `promptExtra` instead.
 * This component is kept for reference but should not be used in new code.
 */
export function QuickCreate({
  contentType,
  courseId,
  lessonId,
  wizardContext,
  contentContext,
}: QuickCreateProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);

  const invalidateAndRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    if (contentType === "theory") {
      await queryClient.invalidateQueries({
        queryKey: ["lesson", courseId, lessonId],
      });
    }
    router.invalidate();
  }, [queryClient, courseId, lessonId, contentType, router]);

  const handleQuickGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const generateFn =
        contentType === "theory"
          ? () => generateLesson(courseId, lessonId)
          : contentType === "flashcards"
            ? () =>
                generateLessonFlashcards(courseId, lessonId, {
                  includeContent: true,
                })
            : contentType === "quiz"
              ? () =>
                  generateLessonQuiz(courseId, lessonId, {
                    includeContent: true,
                  })
              : () =>
                  generateLessonExercises(courseId, lessonId, {
                    includeContent: true,
                  });

      const result = await generateFn();
      if (result.success) {
        await invalidateAndRefresh();
      } else {
        setError(result.error || "Failed to generate content");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setIsGenerating(false);
    }
  }, [contentType, courseId, lessonId, invalidateAndRefresh]);

  const handleCustomizeGenerate = useCallback(
    async (data: ContentGenerationData) => {
      setIsGenerating(true);
      setError(null);
      try {
        const baseOptions = {
          additionalInstructions: data.instructions,
          model: data.model,
          includeContent: data.includeContent,
        };
        const generateFn =
          contentType === "theory"
            ? () => generateLesson(courseId, lessonId, baseOptions)
            : contentType === "flashcards"
              ? () => generateLessonFlashcards(courseId, lessonId, baseOptions)
              : contentType === "quiz"
                ? () => generateLessonQuiz(courseId, lessonId, baseOptions)
                : () =>
                    generateLessonExercises(courseId, lessonId, baseOptions);

        const result = await generateFn();
        if (result.success) {
          setCustomizeOpen(false);
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

  const handleAgentOpenChange = useCallback(
    (open: boolean) => {
      setAgentOpen(open);
      if (!open) {
        invalidateAndRefresh();
      }
    },
    [invalidateAndRefresh]
  );

  const label = CONTENT_LABELS[contentType];

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={handleQuickGenerate}
                  disabled={isGenerating}
                />
              }
            >
              {isGenerating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              {isGenerating ? `Generating ${label}...` : `Create ${label}`}
            </TooltipTrigger>
            <TooltipContent>
              Generate with default settings
            </TooltipContent>
          </Tooltip>

          <ButtonGroupSeparator />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="lg" disabled={isGenerating}>
                  <ChevronDown />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-auto">
              <DropdownMenuItem onClick={() => setCustomizeOpen(true)}>
                <Settings2 />
                Customize
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAgentOpen(true)}>
                <Bot />
                Agent Wizard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <ContentCreationDialog
        mode="generate"
        generationType={GENERATION_TYPE_MAP[contentType]}
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        onGenerate={handleCustomizeGenerate}
        isCreating={isGenerating}
        error={error}
        contentContext={contentContext}
        trigger={<button hidden />}
      />

      <WizardAgentDialog
        open={agentOpen}
        onOpenChange={handleAgentOpenChange}
        context={wizardContext}
      />
    </>
  );
}
