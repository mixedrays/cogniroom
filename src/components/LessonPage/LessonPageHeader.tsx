import { BookOpen, Home, Layers, ListChecks, Code } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader";
import { LessonActionsMenu } from "./LessonActionsMenu";
import type { ContentContext } from "@/components/ContentCreationDialog";

type ActiveTab = "theory" | "flashcards" | "quiz" | "exercises";

interface LessonPageHeaderProps {
  courseId: string;
  lessonId: string;
  courseTitle: string;
  topicIndex: number;
  topicLessons: Array<{ id: string; title: string }>;
  activeTab: ActiveTab;
  hasContent: boolean;
  showMarkComplete: boolean;
  isCompleted: boolean;
  isCompleting: boolean;
  completionError: string | null;
  onToggleComplete: () => void;
  contentContext?: ContentContext;
}

export function LessonPageHeader({
  courseId,
  lessonId,
  courseTitle,
  topicIndex,
  topicLessons,
  activeTab,
  hasContent,
  showMarkComplete,
  isCompleted,
  isCompleting,
  completionError,
  onToggleComplete,
  contentContext,
}: LessonPageHeaderProps) {
  const lessonItems = topicLessons.map((lesson, i) => ({
    title: `Lesson ${topicIndex}.${i + 1}`,
    tooltip: lesson.title,
    current: lesson.id === lessonId,
    link: {
      to: "/course/$courseId/lesson/$lessonId",
      params: { courseId, lessonId: lesson.id },
    },
  }));

  return (
    <PageHeader
      actions={
        <LessonActionsMenu
          courseId={courseId}
          lessonId={lessonId}
          contentType={activeTab}
          hasContent={hasContent}
          contentContext={contentContext}
          showMarkComplete={showMarkComplete}
          isCompleted={isCompleted}
          isCompleting={isCompleting}
          onToggleComplete={onToggleComplete}
        />
      }
    >
      <Breadcrumbs
        className="flex items-center"
        items={[
          { title: "", icon: <Home className="size-4" />, link: "/" },
          {
            title: "Course",
            tooltip: courseTitle,
            link: {
              to: "/course/$courseId",
              params: { courseId },
            },
          },
          lessonItems,
          [
            {
              title: "Theory",
              icon: <BookOpen className="size-4" />,
              link: {
                to: "/course/$courseId/lesson/$lessonId",
                params: { courseId, lessonId },
              },
              current: activeTab === "theory",
            },
            {
              title: "Flashcards",
              icon: <Layers className="size-4" />,
              link: {
                to: "/course/$courseId/lesson/$lessonId/flashcards",
                params: { courseId, lessonId },
              },
              current: activeTab === "flashcards",
            },
            {
              title: "Quiz",
              icon: <ListChecks className="size-4" />,
              link: {
                to: "/course/$courseId/lesson/$lessonId/quiz",
                params: { courseId, lessonId },
              },
              current: activeTab === "quiz",
            },
            {
              title: "Exercises",
              icon: <Code className="size-4" />,
              link: {
                to: "/course/$courseId/lesson/$lessonId/exercises",
                params: { courseId, lessonId },
              },
              current: activeTab === "exercises",
            },
          ],
        ]}
      />

      {completionError && (
        <p className="text-sm text-destructive font-medium">
          {completionError}
        </p>
      )}
    </PageHeader>
  );
}
