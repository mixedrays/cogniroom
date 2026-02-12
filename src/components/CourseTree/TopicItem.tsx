import { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { Topic } from "@/lib/types";
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LessonItem } from "./LessonItem";

export interface TopicItemProps {
  topic: Topic;
  index: number;
}

export function TopicItem({ topic, index }: TopicItemProps) {
  const { lessonId: activeLessonId } = useParams({ strict: false }) as {
    lessonId?: string;
  };
  const isActive = topic.lessons.some((lesson) => lesson.id === activeLessonId);
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    setOpen(isActive);
  }, [isActive, activeLessonId]);

  return (
    <SidebarMenuItem>
      <Collapsible className="group/collapsible" open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          render={
            <SidebarMenuButton className="font-medium">
              <div className="flex items-center gap-2 w-full">
                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <span className="truncate flex-1 text-left">{topic.title}</span>
                <ChevronRight className="transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </div>
            </SidebarMenuButton>
          }
        />
        <CollapsibleContent>
          <SidebarMenuSub className="mr-0 pr-0">
            {topic.lessons.map((lesson, lessonIndex) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                topicIndex={index}
                lessonIndex={lessonIndex}
              />
            ))}
            {topic.lessons.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                No lessons yet
              </div>
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
