import { useRouter } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type LessonTabValue = "theory" | "tests" | "exercises";

type LessonTabsProps = {
  courseId: string;
  lessonId: string;
  value: LessonTabValue;
  className?: string;
};

export function LessonTabs({
  courseId,
  lessonId,
  value,
  className,
}: LessonTabsProps) {
  const router = useRouter();

  const handleChange = (nextValue: string) => {
    if (nextValue === value) return;

    if (nextValue === "theory") {
      router.navigate({
        to: "/course/$courseId/lesson/$lessonId",
        params: { courseId, lessonId },
      });
      return;
    }

    router.navigate({
      to: `/course/$courseId/lesson/$lessonId/${nextValue}`,
      params: { courseId, lessonId },
    });
  };

  return (
    <div className={cn(className)}>
      <Tabs value={value} onValueChange={handleChange}>
        <TabsList className="justify-start">
          <TabsTrigger value="theory">Theory</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
