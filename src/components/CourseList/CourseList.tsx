import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Sparkles,
  FileJson,
  Link as LinkIcon,
  Trash2,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { deleteCourse, listCourses } from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import CourseHistory from "@/components/CourseHistory";
import { CommandPaletteTrigger } from "@/modules/command-palette";

export default function CourseList() {
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: listCourses,
  });

  const courses = coursesQuery.data ?? [];
  const queryIsLoading = coursesQuery.isLoading;

  const handleDeleteCourse = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const result = await deleteCourse(id);
      if (!result.success) {
        setDeleteError({ id, message: result.error || "Failed to delete" });
        return;
      }
      setDeleteDialogOpenId(null);
      await coursesQuery.refetch();
    } catch (e) {
      setDeleteError({ id, message: String(e) });
    } finally {
      setDeletingId(null);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "llm":
        return <Sparkles />;
      case "import":
        return <FileJson />;
      case "extract":
        return <LinkIcon />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <CommandPaletteTrigger />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={
                  <Link to="/" search={{ session: undefined }}>
                    <Plus />
                    <span>New Course</span>
                  </Link>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <div className="flex-1 min-h-0">
        <div className="h-full overflow-y-auto">
          {queryIsLoading ? (
            <LoadingState variant="skeleton" skeletonRows={3} className="p-4" />
          ) : coursesQuery.isError ? (
            <ErrorState
              variant="banner"
              title="Failed to load courses"
              message={
                coursesQuery.error?.message ||
                "An error occurred while loading courses"
              }
              onRetry={() => coursesQuery.refetch()}
              showRetry
              className="m-4"
            />
          ) : courses.length === 0 ? (
            <>
              <div className="p-4 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No courses yet</p>
                <p className="text-xs mt-1">
                  Create your first course to get started
                </p>
              </div>

              <CourseHistory />
            </>
          ) : (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>Your Courses</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {courses.map((course) => (
                      <Collapsible
                        key={course.id}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            className="pr-0"
                            render={
                              <Link
                                to="/course/$courseId"
                                params={{ courseId: course.id }}
                                className="relative"
                              >
                                {getSourceIcon(course.source)}
                                <span className="truncate">{course.title}</span>

                                <CollapsibleTrigger
                                  onClick={(e) => e.preventDefault()}
                                  render={
                                    <Button
                                      size="icon-sm"
                                      variant="secondary"
                                      className="ml-auto"
                                    >
                                      <ChevronDown className="transition-transform duration-200 group-data-open/collapsible:rotate-180" />
                                    </Button>
                                  }
                                />
                              </Link>
                            }
                          />

                          <CollapsibleContent>
                            <SidebarMenuSub className="mr-0 pr-0">
                              <SidebarMenuSubItem>
                                <div className="flex flex-col gap-2 pt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {course.topicCount} topics ·{" "}
                                    {course.lessonCount} lessons
                                  </span>

                                  <div className="h-1.5 w-full bg-sidebar-accent rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all"
                                      style={{ width: `${course.progress}%` }}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between gap-2">
                                    <Button
                                      variant="secondary"
                                      nativeButton={false}
                                      render={
                                        <Link
                                          to="/course/$courseId"
                                          params={{ courseId: course.id }}
                                        >
                                          View Course
                                        </Link>
                                      }
                                    />
                                    <AlertDialog
                                      open={deleteDialogOpenId === course.id}
                                      onOpenChange={(open) => {
                                        if (open) setDeleteError(null);
                                        setDeleteDialogOpenId(
                                          open ? course.id : null
                                        );
                                      }}
                                    >
                                      <AlertDialogTrigger
                                        render={
                                          <Button
                                            size="icon"
                                            variant="destructive"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Trash2 />
                                          </Button>
                                        }
                                      />
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete course?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete "
                                            {course.title}".
                                          </AlertDialogDescription>
                                          {deleteError?.id === course.id && (
                                            <ErrorState
                                              variant="minimal"
                                              message={deleteError.message}
                                            />
                                          )}
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel
                                            disabled={deletingId === course.id}
                                          >
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            variant="destructive"
                                            onClick={() =>
                                              handleDeleteCourse(course.id)
                                            }
                                            disabled={deletingId === course.id}
                                          >
                                            {deletingId === course.id
                                              ? "Deleting…"
                                              : "Delete"}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </SidebarMenuSubItem>
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <CourseHistory />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
