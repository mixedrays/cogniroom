import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContentCreationDialog,
  formatGenerationOptions,
  type ContentGenerationData,
} from "@/components/ContentCreationDialog";
import {
  generateFlashcardsDeck,
  generateQuizDeck,
  type GenerateDeckOptions,
} from "@/lib/decks";
import { decksQueryKey } from "@/components/DeckList";
import type { DeckKind } from "@/lib/types";

interface DeckQuickGenerateProps {
  kind: DeckKind;
  trigger?: React.ReactElement;
}

const LABELS: Record<DeckKind, string> = {
  flashcards: "Flashcards",
  quiz: "Quiz",
};

async function runGenerate(kind: DeckKind, options: GenerateDeckOptions) {
  return kind === "flashcards"
    ? generateFlashcardsDeck(options)
    : generateQuizDeck(options);
}

export default function DeckQuickGenerate({
  kind,
  trigger,
}: DeckQuickGenerateProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleGenerate = useCallback(
    async (data: ContentGenerationData) => {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await runGenerate(kind, {
          additionalInstructions: data.instructions,
          model: data.model,
          generationOptions: formatGenerationOptions(data.type, data.options),
        });
        if (result.success && result.id) {
          setDialogOpen(false);
          await queryClient.invalidateQueries({ queryKey: decksQueryKey });
          navigate({
            to: "/decks/$deckId",
            params: { deckId: result.id },
          });
        } else {
          setError(result.error || "Failed to generate deck");
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setIsGenerating(false);
      }
    },
    [kind, queryClient, navigate]
  );

  const label = LABELS[kind];
  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground"
      disabled={isGenerating}
    >
      {isGenerating ? <Loader2 className="animate-spin" /> : <Zap />}
      {isGenerating ? `Generating ${label}…` : "Quick Create"}
    </Button>
  );

  return (
    <ContentCreationDialog
      mode="generate"
      generationType={kind}
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      onGenerate={handleGenerate}
      isCreating={isGenerating}
      error={error}
      trigger={trigger ?? defaultTrigger}
    />
  );
}
