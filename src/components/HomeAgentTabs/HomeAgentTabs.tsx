import { useCallback, useMemo, useState } from "react";
import { Book, Layers, ListChecks, Bot, Zap } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { WizardAgentInline } from "@/modules/wizard-agent";
import type { WizardAgentContext } from "@/modules/wizard-agent";
import type { ContentSaveOverride } from "@/modules/agent/components/ContentSaveContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import CreateCourseModal from "@/components/CreateCourseModal";
import DeckQuickGenerate from "@/components/DeckQuickGenerate";
import { courseHistoryQueryKey } from "@/components/CourseHistory";
import { decksQueryKey } from "@/components/DeckList";
import { createDeck } from "@/lib/decks";
import type { FlashcardsContent, QuizContent } from "@/lib/types";
import { HOME_PROMPT_TEXTAREA_ID } from "@/lib/dom-ids";

type HomeMode = "roadmap" | "flashcards" | "quiz";

interface HomeAgentTabsProps {
  initialSessionId?: string;
}

interface ModeConfig {
  contentType: WizardAgentContext["contentType"];
  label: string;
  icon: React.ReactNode;
  welcomeTitle: string;
  placeholder: string;
  headerLabel: string;
}

const MODES: Record<HomeMode, ModeConfig> = {
  roadmap: {
    contentType: "roadmap",
    label: "Course",
    icon: <Book className="size-3.5" />,
    welcomeTitle: "What do you want to create?",
    placeholder: "Describe the course you want to create…",
    headerLabel: "Create Course",
  },
  flashcards: {
    contentType: "flashcards",
    label: "Flashcards",
    icon: <Layers className="size-3.5" />,
    welcomeTitle: "What do you want to create?",
    placeholder: "Describe the topic for your flashcard deck…",
    headerLabel: "Create Flashcards",
  },
  quiz: {
    contentType: "quiz",
    label: "Quiz",
    icon: <ListChecks className="size-3.5" />,
    welcomeTitle: "What do you want to create?",
    placeholder: "Describe the topic for your quiz…",
    headerLabel: "Create Quiz",
  },
};

function deriveDeckTitle(summary?: string, fallback?: string): string {
  const trimmed = summary?.trim();
  if (trimmed && trimmed.length > 0) {
    return trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed;
  }
  return fallback ?? "Untitled deck";
}

export default function HomeAgentTabs({
  initialSessionId,
}: HomeAgentTabsProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mode, setMode] = useState<HomeMode>("roadmap");

  const config = MODES[mode];

  const context = useMemo<WizardAgentContext>(
    () => ({ contentType: config.contentType }),
    [config.contentType]
  );

  const handleCourseCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["courses"] });
    queryClient.invalidateQueries({ queryKey: courseHistoryQueryKey });
  };

  const handleSessionPersisted = useCallback(
    (sessionId: string) => {
      navigate({ to: "/", search: { session: sessionId }, replace: true });
    },
    [navigate]
  );

  const saveOverride = useMemo<ContentSaveOverride | undefined>(() => {
    if (mode === "roadmap") return undefined;
    const deckKind = mode === "flashcards" ? "flashcards" : "quiz";
    return async ({ type, content, summary }) => {
      if (type !== "flashcards" && type !== "quiz") {
        return {
          success: false,
          error: `Cannot save ${type} on the home page in deck mode`,
        };
      }
      const title = deriveDeckTitle(summary, `New ${deckKind} deck`);
      const result = await createDeck({
        title,
        kind: deckKind,
        source: "llm",
        content: content as FlashcardsContent | QuizContent,
      });
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: decksQueryKey });
        if (result.id) {
          navigate({
            to: "/decks/$deckId",
            params: { deckId: result.id },
          });
        }
      }
      return result;
    };
  }, [mode, queryClient, navigate]);

  const tabs = (
    <ToggleGroup
      value={[mode]}
      onValueChange={(values) => {
        if (values.length > 0) {
          setMode(values[values.length - 1] as HomeMode);
        }
      }}
      variant="outline"
      size="sm"
      className="self-center"
    >
      {(Object.keys(MODES) as HomeMode[]).map((m) => (
        <ToggleGroupItem key={m} value={m} className="min-w-26">
          {MODES[m].icon}
          {MODES[m].label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );

  return (
    <WizardAgentInline
      key={mode}
      context={context}
      initialSessionId={mode === "roadmap" ? initialSessionId : undefined}
      startNewSession
      onSessionPersisted={
        mode === "roadmap" ? handleSessionPersisted : undefined
      }
      welcomeTitle={config.welcomeTitle}
      placeholder={config.placeholder}
      className="max-w-3xl w-full mx-auto"
      promptTextareaId={
        mode === "roadmap" ? HOME_PROMPT_TEXTAREA_ID : undefined
      }
      saveOverride={saveOverride}
      promptBefore={tabs}
      promptExtra={
        mode === "roadmap" ? (
          <CreateCourseModal
            onCreated={handleCourseCreated}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
              >
                <Zap className="size-3.5" />
                Quick Create
              </Button>
            }
          />
        ) : (
          <DeckQuickGenerate kind={mode} />
        )
      }
    >
      {({ hasMessages }) => (
        <PageHeader>
          {hasMessages && (
            <div className="flex items-center gap-2">
              <Bot className="size-4" />
              <span className="font-medium">{config.headerLabel}</span>
            </div>
          )}
        </PageHeader>
      )}
    </WizardAgentInline>
  );
}
