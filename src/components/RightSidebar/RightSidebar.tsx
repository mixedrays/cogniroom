import { useParams, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import { courseQueryOptions } from "@/components/CourseTree/utils";
import { LessonContentActions } from "./LessonContentActions";
import type { ContentContext } from "@/components/ContentCreationDialog";
import type { Lesson } from "@/lib/types";

type ContentType = "theory" | "flashcards" | "quiz" | "exercises";

function detectContentType(pathname: string): ContentType {
  if (pathname.endsWith("/flashcards")) return "flashcards";
  if (pathname.endsWith("/quiz")) return "quiz";
  if (pathname.endsWith("/exercises")) return "exercises";
  return "theory";
}

function getHasContent(lesson: Lesson, contentType: ContentType): boolean {
  switch (contentType) {
    case "theory":
      return lesson.hasContent ?? false;
    case "flashcards":
      return lesson.hasFlashcards ?? false;
    case "quiz":
      return lesson.hasQuiz ?? false;
    case "exercises":
      return lesson.hasExercises ?? false;
  }
}

export default function RightSidebar() {
  const { courseId, lessonId } = useParams({ strict: false }) as {
    courseId?: string;
    lessonId?: string;
  };
  const location = useLocation();
  const contentType = detectContentType(location.pathname);

  const { data: course } = useQuery({
    ...courseQueryOptions(courseId!),
    enabled: !!courseId,
  });

  let lessonInfo: Lesson | null = null;
  let topicTitle: string | undefined;
  let topicDescription: string | undefined;

  if (course && lessonId) {
    for (const topic of course.topics) {
      const found = topic.lessons?.find((l) => l.id === lessonId);
      if (found) {
        lessonInfo = found;
        topicTitle = topic.title;
        topicDescription = topic.description;
        break;
      }
    }
  }

  const hasContent = lessonInfo ? getHasContent(lessonInfo, contentType) : false;

  const contentContext: ContentContext | undefined =
    course && lessonInfo
      ? {
          courseTitle: course.title,
          topicTitle,
          topicDescription,
          lessonTitle: lessonInfo.title,
          lessonDescription: lessonInfo.description,
        }
      : undefined;

  const showActions = courseId && lessonId && lessonInfo;

  return (
    <Sidebar side="right" collapsible="offExamples">
      <SidebarContent className="p-4">
        {showActions ? (
          <LessonContentActions
            courseId={courseId}
            lessonId={lessonId}
            contentType={contentType}
            hasContent={hasContent}
            contentContext={contentContext}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a lesson to see actions</p>
          </div>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
