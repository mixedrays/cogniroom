import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContentQuickGenerate,
  type ContentType as QuickGenerateContentType,
} from "@/components/ContentQuickGenerate";
import type { ContentContext } from "@/components/ContentCreationDialog";

interface LessonContentEmptyStateProps {
  title: string;
  description?: string;
  contentType: QuickGenerateContentType;
  courseId: string;
  lessonId: string;
  contentContext?: ContentContext;
  onOpenAgent: () => void;
}

export function LessonContentEmptyState({
  title,
  description,
  contentType,
  courseId,
  lessonId,
  contentContext,
  onOpenAgent,
}: LessonContentEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16 max-w-3xl mx-auto w-full">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center justify-center gap-2">
        <ContentQuickGenerate
          contentType={contentType}
          courseId={courseId}
          lessonId={lessonId}
          contentContext={contentContext}
        />
        <span className="text-sm text-muted-foreground">or</span>
        <Button variant="secondary" onClick={onOpenAgent}>
          <Bot />
          Ask AI
        </Button>
      </div>
    </div>
  );
}
