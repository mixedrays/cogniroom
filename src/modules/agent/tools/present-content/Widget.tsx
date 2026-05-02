import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { parsePartialJson } from "../../lib/parsePartialJson";
import type { PresentContentParams } from "./schema";
import type {
  Course,
  FlashcardsContent,
  NormalizedRoadmap,
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

interface ContentBubbleProps {
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

type SaveState = "idle" | "saving" | "saved" | "error";

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRoadmap(content: unknown): NormalizedRoadmap | null {
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

function getLessonCount(roadmap: NormalizedRoadmap): number {
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
  params,
  streamingInput,
  isStreaming = false,
  context,
  superseded = false,
}: ContentBubbleProps) {
  const queryClient = useQueryClient();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const lastParsedRef = useRef<Partial<PresentContentParams> | undefined>(
    undefined
  );

  const partialData = useMemo(() => {
    if (!isStreaming || !streamingInput) {
      lastParsedRef.current = undefined;
      return undefined;
    }
    const parsed = parsePartialJson(streamingInput) as
      | Partial<PresentContentParams>
      | undefined;
    if (parsed !== undefined) {
      lastParsedRef.current = parsed;
    }
    return lastParsedRef.current;
  }, [isStreaming, streamingInput]);

  const data = isStreaming
    ? (partialData as PresentContentParams | undefined)
    : (params as PresentContentParams);

  const type = data?.type;
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

  if (!type) {
    return (
      <div className="rounded-2xl rounded-tl-sm border border-border bg-card text-sm">
        <div className="flex items-center gap-2 px-4 py-3">
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground text-xs">Generating…</span>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaveState("saving");
    setError(null);
    try {
      let result: { success: boolean; error?: string; id?: string };

      if (type === "roadmap") {
        result = await saveCourse(content as Course);
      } else {
        const { courseId, lessonId } = context ?? {};
        if (!courseId || !lessonId) {
          setError("Missing course or lesson context");
          setSaveState("error");
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
        setError(result.error ?? "Save failed");
        setSaveState("error");
      }
    } catch (e) {
      setError(String(e));
      setSaveState("error");
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl rounded-tl-sm border text-sm transition-opacity",
        superseded ? "opacity-50 pointer-events-none" : "border-border bg-card",
        isSaved && "border-green-500/30 bg-green-500/5"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize text-xs">
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
      </div>

      <div className="px-4 py-3 max-h-80 overflow-y-auto">
        <ContentPreview type={type} content={content} />
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50">
        <Button size="sm" onClick={handleSave} disabled={isSaveDisabled}>
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
          ) : (
            "Save"
          )}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}

function ContentPreview({
  type,
  content,
}: {
  type: PresentContentParams["type"];
  content: unknown;
}) {
  if (type === "roadmap") {
    const course = content as Course;
    return (
      <div className="space-y-2">
        <p className="font-medium">{course?.title}</p>
        {course?.description && (
          <p className="text-muted-foreground text-xs">{course.description}</p>
        )}
        <div className="space-y-1 mt-2">
          {course?.topics?.map((topic, i) => (
            <div key={i} className="text-xs">
              <span className="font-medium">{topic.title}</span>
              <span className="text-muted-foreground ml-2">
                {topic.lessons?.length ?? 0} lessons
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "flashcards") {
    const fc = content as FlashcardsContent;
    const cards = fc?.flashcards ?? [];
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">{cards.length} cards</p>
        {cards.slice(0, 3).map((card, i) => (
          <div
            key={i}
            className="rounded border border-border/50 px-3 py-2 space-y-1"
          >
            <p className="font-medium text-xs">{card.question}</p>
            <p className="text-muted-foreground text-xs">{card.answer}</p>
          </div>
        ))}
        {cards.length > 3 && (
          <p className="text-muted-foreground text-xs">
            +{cards.length - 3} more…
          </p>
        )}
      </div>
    );
  }

  if (type === "quiz") {
    const quiz = content as QuizContent;
    const questions = quiz?.quizQuestions ?? [];
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">
          {questions.length} questions
        </p>
        {questions.slice(0, 3).map((q, i) => (
          <div key={i} className="text-xs">
            <span className="font-medium">{i + 1}. </span>
            {q.question}
          </div>
        ))}
        {questions.length > 3 && (
          <p className="text-muted-foreground text-xs">
            +{questions.length - 3} more…
          </p>
        )}
      </div>
    );
  }

  if (type === "lesson" || type === "exercise") {
    const text = typeof content === "string" ? content : "";
    const preview = text.slice(0, 300);
    return (
      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
        {preview}
        {text.length > 300 ? "…" : ""}
      </p>
    );
  }

  return null;
}
