import type { ReactNode } from "react";
import { BookOpen, Layers, ListChecks, Code } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

type ActiveTab = "theory" | "flashcards" | "quiz" | "exercises";

interface LessonPageHeaderProps {
  courseId: string;
  lessonId: string;
  courseTitle: string;
  topicTitle?: string;
  activeTab: ActiveTab;
  showMarkComplete: boolean;
  isCompleted: boolean;
  isCompleting: boolean;
  completionError: string | null;
  onToggleComplete: () => void;
  extraActions?: ReactNode;
}

export function LessonPageHeader({
  courseId,
  lessonId,
  courseTitle,
  topicTitle,
  activeTab,
  showMarkComplete,
  isCompleted,
  isCompleting,
  completionError,
  onToggleComplete,
  extraActions,
}: LessonPageHeaderProps) {
  return (
    <PageHeader>
      <Breadcrumbs
        className="flex items-center"
        items={[
          { title: "Home", link: "/" },
          {
            title: courseTitle,
            link: {
              to: "/course/$courseId",
              params: { courseId },
            },
          },
          { title: topicTitle ?? "Lesson" },
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

      <div className="flex items-center gap-2">
        {completionError && (
          <p className="text-sm text-destructive font-medium">
            {completionError}
          </p>
        )}
        {extraActions}
        {showMarkComplete && (
          <Button
            onClick={onToggleComplete}
            disabled={isCompleting}
            variant={isCompleted ? "secondary" : "default"}
          >
            {isCompleted ? "Mark Incomplete" : "Mark Complete"}
          </Button>
        )}
      </div>
    </PageHeader>
  );
}
