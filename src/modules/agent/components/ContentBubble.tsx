import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { parsePartialJson } from "../lib/parsePartialJson";
import type {
  Course,
  FlashcardsContent,
  NormalizedCourse,
  QuizContent,
} from "@/lib/types";
import {
  getCourse,
  listCourses,
  saveCourse,
  saveLessonContent,
  saveLessonQuiz,
  saveLessonFlashcards,
  saveLessonExercises,
} from "@/lib/courses";
import { useContentSaveOverride } from "./ContentSaveContext";

export type ContentBubbleType =
  | "roadmap"
  | "lesson"
  | "quiz"
  | "flashcards"
  | "exercise";

interface ContentBubbleProps {
  type: ContentBubbleType;
  params: unknown;
  streamingInput?: string;
  isStreaming?: boolean;
  onSubmit: (result: unknown) => void;
  onDismiss: () => void;
  context?: {
    courseId?: string;
    lessonId?: string;
  };
  superseded?: boolean;
}

interface BubbleParams {
  content?: unknown;
  summary?: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRoadmap(content: unknown): NormalizedCourse | null {
  if (!content || typeof content !== "object") return null;

  const roadmap = content as {
    title?: unknown;
    description?: unknown;
    topics?: unknown[];
  };

  const title = normalizeText(roadmap.title);
  if (!title) return null;

  const topics = Array.isArray(roadmap.topics)
    ? roadmap.topics.flatMap((topic) => {
        if (!topic || typeof topic !== "object") return [];

        const topicValue = topic as {
          title?: unknown;
          description?: unknown;
          lessons?: unknown[];
        };

        return [
          {
            title: normalizeText(topicValue.title),
            description: normalizeText(topicValue.description),
            lessons: Array.isArray(topicValue.lessons)
              ? topicValue.lessons.flatMap((lesson) => {
                  if (!lesson || typeof lesson !== "object") return [];

                  const lessonValue = lesson as {
                    title?: unknown;
                    description?: unknown;
                  };

                  return [
                    {
                      title: normalizeText(lessonValue.title),
                      description: normalizeText(lessonValue.description),
                    },
                  ];
                })
              : [],
          },
        ];
      })
    : [];

  return {
    title,
    description: normalizeText(roadmap.description),
    topics,
  };
}

function getRoadmapSignature(content: unknown): string | null {
  const roadmap = normalizeRoadmap(content);
  return roadmap ? JSON.stringify(roadmap) : null;
}

function getLessonCount(roadmap: NormalizedCourse): number {
  return roadmap.topics.reduce(
    (count, topic) => count + topic.lessons.length,
    0
  );
}

async function findMatchingSavedRoadmapId(
  roadmapContent: unknown
): Promise<string | null> {
  const roadmap = normalizeRoadmap(roadmapContent);
  if (!roadmap) return null;

  const lessonCount = getLessonCount(roadmap);
  const roadmapSignature = JSON.stringify(roadmap);
  const candidates = (await listCourses()).filter(
    (course) =>
      normalizeText(course.title) === roadmap.title &&
      normalizeText(course.description) === roadmap.description &&
      course.topicCount === roadmap.topics.length &&
      course.lessonCount === lessonCount
  );

  if (candidates.length === 0) return null;

  const savedCourses = await Promise.all(
    candidates.map(async (course) => getCourse(course.id))
  );

  const match = savedCourses.find(
    (course): course is Course =>
      course !== null && getRoadmapSignature(course) === roadmapSignature
  );

  return match?.id ?? null;
}

export function ContentBubble({
  type,
  params,
  streamingInput,
  isStreaming = false,
  context,
  superseded = false,
}: ContentBubbleProps) {
  const queryClient = useQueryClient();
  const saveOverride = useContentSaveOverride();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const [lastParsed, setLastParsed] = useState<BubbleParams | undefined>(
    undefined
  );
  const [lastInputKey, setLastInputKey] = useState<string | undefined>(
    undefined
  );

  const parsedNow = useMemo(() => {
    if (!isStreaming || !streamingInput) return undefined;
    return parsePartialJson(streamingInput) as BubbleParams | undefined;
  }, [isStreaming, streamingInput]);

  const inputKey = isStreaming ? streamingInput : undefined;
  if (inputKey !== lastInputKey) {
    setLastInputKey(inputKey);
    if (!inputKey) {
      setLastParsed(undefined);
    } else if (parsedNow !== undefined) {
      setLastParsed(parsedNow);
    }
  }

  const partialData = parsedNow ?? lastParsed;

  const data = isStreaming ? partialData : (params as BubbleParams | undefined);

  const content = data?.content;
  const summary = data?.summary;

  const roadmapSignature =
    type === "roadmap" ? getRoadmapSignature(content) : null;
  const shouldCheckSavedRoadmap =
    !isStreaming &&
    type === "roadmap" &&
    Boolean(roadmapSignature) &&
    !superseded;

  const savedRoadmapQuery = useQuery({
    queryKey: ["presentContent", "savedRoadmap", roadmapSignature],
    queryFn: () => findMatchingSavedRoadmapId(content),
    enabled: shouldCheckSavedRoadmap,
  });

  const isCheckingSavedRoadmap =
    shouldCheckSavedRoadmap && savedRoadmapQuery.isPending;
  const isSaved =
    saveState === "saved" ||
    (type === "roadmap" && Boolean(savedRoadmapQuery.data));
  const canResaveRoadmap = type === "roadmap" && isSaved && !superseded;
  const isSaveDisabled =
    isStreaming ||
    superseded ||
    saveState === "saving" ||
    isCheckingSavedRoadmap ||
    (!canResaveRoadmap && isSaved);

  const reportError = (message: string) => {
    setError(message);
    setSaveState("error");
    toast.error(`Failed to save ${type}`, { description: message });
  };

  const handleSave = async () => {
    if (
      (type === "lesson" || type === "exercise") &&
      (typeof content !== "string" || content.trim().length === 0)
    ) {
      reportError(
        "Generated content is empty — ask the assistant to regenerate."
      );
      return;
    }

    if (type === "flashcards") {
      const cards = (content as FlashcardsContent | undefined)?.flashcards;
      if (!Array.isArray(cards) || cards.length === 0) {
        reportError(
          "Flashcard set is empty — ask the assistant to regenerate."
        );
        return;
      }
    }

    if (type === "quiz") {
      const questions = (content as QuizContent | undefined)?.quizQuestions;
      if (!Array.isArray(questions) || questions.length === 0) {
        reportError("Quiz is empty — ask the assistant to regenerate.");
        return;
      }
    }

    setSaveState("saving");
    setError(null);
    try {
      let result: { success: boolean; error?: string; id?: string };

      if (saveOverride) {
        result = await saveOverride({ type, content, summary });
      } else if (type === "roadmap") {
        result = await saveCourse(content as Course);
      } else {
        const { courseId, lessonId } = context ?? {};
        if (!courseId || !lessonId) {
          reportError("Missing course or lesson context");
          return;
        }
        if (type === "lesson") {
          result = await saveLessonContent(
            courseId,
            lessonId,
            content as string
          );
        } else if (type === "quiz") {
          result = await saveLessonQuiz(courseId, lessonId, content);
        } else if (type === "flashcards") {
          result = await saveLessonFlashcards(courseId, lessonId, content);
        } else {
          result = await saveLessonExercises(
            courseId,
            lessonId,
            content as string
          );
        }
      }

      if (result.success) {
        setSaveState("saved");
        if (type === "roadmap") {
          void queryClient.invalidateQueries({ queryKey: ["courses"] });
          void queryClient.invalidateQueries({
            queryKey: ["presentContent", "savedRoadmap"],
          });
        }
      } else {
        reportError(result.error ?? "Save failed");
      }
    } catch (e) {
      reportError(e instanceof Error ? e.message : String(e));
    }
  };

  const hasError = saveState === "error" && Boolean(error);

  return (
    <div
      className={cn(
        "rounded-2xl rounded-tl-sm border text-sm transition-opacity",
        superseded ? "opacity-50 pointer-events-none" : "border-border bg-card",
        isSaved && "border-green-500/30 bg-green-500/5",
        hasError && "border-destructive/50 bg-destructive/5"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Badge
            variant={hasError ? "destructive" : "secondary"}
            className="capitalize text-xs"
          >
            {type}
          </Badge>
          {summary && (
            <span className="text-muted-foreground text-xs">{summary}</span>
          )}
        </div>
        {isStreaming && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Generating…
          </span>
        )}
        {!isStreaming && isSaved && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check className="size-3" />
            Saved
          </span>
        )}
        {!isStreaming && hasError && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="size-3" />
            Save failed
          </span>
        )}
      </div>

      <div
        className={cn(
          "px-4 py-3 overflow-y-auto",
          expanded ? "max-h-[32rem]" : "max-h-80"
        )}
      >
        <ContentPreview type={type} content={content} expanded={expanded} />
      </div>

      {hasHiddenContent(type, content) && (
        <div className="flex justify-center px-4 pb-2">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-muted-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp />
                Show less
              </>
            ) : (
              <>
                <ChevronDown />
                Show all
              </>
            )}
          </Button>
        </div>
      )}

      {hasError && (
        <div className="flex items-start gap-2 px-4 py-2 border-t border-destructive/30 bg-destructive/5 text-destructive">
          <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed break-words">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaveDisabled}
          variant={hasError ? "destructive" : "default"}
        >
          {saveState === "saving" ? (
            <>
              <Loader2 className="size-3 animate-spin mr-1.5" />
              Saving…
            </>
          ) : isCheckingSavedRoadmap ? (
            <>
              <Loader2 className="size-3 animate-spin mr-1.5" />
              Checking…
            </>
          ) : canResaveRoadmap ? (
            "Save again"
          ) : hasError ? (
            "Retry save"
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}

const LESSON_PREVIEW_CHARS = 300;
const ITEM_PREVIEW_COUNT = 3;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function hasHiddenContent(type: ContentBubbleType, content: unknown): boolean {
  if (type === "lesson" || type === "exercise") {
    const text = typeof content === "string" ? content : "";
    return text.length > LESSON_PREVIEW_CHARS;
  }
  if (type === "flashcards") {
    const cards = (content as FlashcardsContent | undefined)?.flashcards;
    return Array.isArray(cards) && cards.length > ITEM_PREVIEW_COUNT;
  }
  if (type === "quiz") {
    const questions = (content as QuizContent | undefined)?.quizQuestions;
    return Array.isArray(questions) && questions.length > ITEM_PREVIEW_COUNT;
  }
  if (type === "roadmap") {
    const topics = (content as Course | undefined)?.topics;
    if (!Array.isArray(topics)) return false;
    return topics.some(
      (t) => Array.isArray(t?.lessons) && t.lessons.length > 0
    );
  }
  return false;
}

function ContentPreview({
  type,
  content,
  expanded,
}: {
  type: ContentBubbleType;
  content: unknown;
  expanded: boolean;
}) {
  if (type === "roadmap") {
    const course = content as Course;
    const topics = Array.isArray(course?.topics) ? course.topics : [];
    const lessonTotal = topics.reduce(
      (sum, t) => sum + (Array.isArray(t?.lessons) ? t.lessons.length : 0),
      0
    );
    return (
      <div className="space-y-2">
        <p className="font-medium">{course?.title}</p>
        {course?.description && (
          <p className="text-muted-foreground text-xs">{course.description}</p>
        )}
        <p className="text-muted-foreground text-xs">
          {topics.length} topics · {lessonTotal} lessons
        </p>
        <div className="space-y-1 mt-2">
          {topics.map((topic, i) => {
            const lessons = Array.isArray(topic?.lessons) ? topic.lessons : [];
            return (
              <div key={i} className="text-xs">
                <div>
                  <span className="font-medium">{topic?.title}</span>
                  <span className="text-muted-foreground ml-2">
                    {lessons.length} lessons
                  </span>
                </div>
                {expanded && lessons.length > 0 && (
                  <ul className="mt-1 ml-3 space-y-0.5 text-muted-foreground">
                    {lessons.map((lesson, j) => (
                      <li key={j}>• {lesson?.title}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "flashcards") {
    const fc = content as FlashcardsContent;
    const cards = Array.isArray(fc?.flashcards) ? fc.flashcards : [];
    const visibleCards = expanded ? cards : cards.slice(0, ITEM_PREVIEW_COUNT);
    const hiddenCount = cards.length - visibleCards.length;
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">{cards.length} cards</p>
        {visibleCards.map((card, i) => (
          <div
            key={i}
            className="rounded border border-border/50 px-3 py-2 space-y-1"
          >
            <p className="font-medium text-xs">{card?.question}</p>
            <p className="text-muted-foreground text-xs">{card?.answer}</p>
          </div>
        ))}
        {hiddenCount > 0 && (
          <p className="text-muted-foreground text-xs">+{hiddenCount} more…</p>
        )}
      </div>
    );
  }

  if (type === "quiz") {
    const quiz = content as QuizContent;
    const questions = Array.isArray(quiz?.quizQuestions)
      ? quiz.quizQuestions
      : [];
    const visibleQuestions = expanded
      ? questions
      : questions.slice(0, ITEM_PREVIEW_COUNT);
    const hiddenCount = questions.length - visibleQuestions.length;
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">
          {questions.length} questions
        </p>
        {visibleQuestions.map((q, i) => (
          <div key={i} className="text-xs space-y-1">
            <div>
              <span className="font-medium">{i + 1}. </span>
              {q?.question}
            </div>
            {expanded && q?.type === "choice" && Array.isArray(q.options) && (
              <ul className="ml-4 space-y-0.5 text-muted-foreground">
                {q.options.map((opt, j) => (
                  <li key={j}>
                    {String.fromCharCode(65 + j)}. {opt?.text}
                    {opt?.isCorrect && (
                      <span className="ml-1 text-green-600">✓</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {expanded && q?.type === "true-false" && (
              <p className="ml-4 text-muted-foreground">
                Answer: {q.answer ? "True" : "False"}
              </p>
            )}
          </div>
        ))}
        {hiddenCount > 0 && (
          <p className="text-muted-foreground text-xs">+{hiddenCount} more…</p>
        )}
      </div>
    );
  }

  if (type === "lesson" || type === "exercise") {
    const text = typeof content === "string" ? content : "";
    const words = countWords(text);
    const showFull = expanded || text.length <= LESSON_PREVIEW_CHARS;
    const body = showFull ? text : text.slice(0, LESSON_PREVIEW_CHARS);
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">
          {words} {words === 1 ? "word" : "words"}
        </p>
        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
          {body}
          {!showFull ? "…" : ""}
        </p>
      </div>
    );
  }

  return null;
}
