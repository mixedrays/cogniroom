import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Home,
  Plus,
  Settings as SettingsIcon,
  Sparkles,
  FileJson,
  Link as LinkIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { listCourses } from "@/lib/courses";
import { useSettingsSearch } from "@/modules/settings";
import { useCommandPalette } from "../context/CommandPaletteContext";
import { useCommandPaletteHotkey } from "../hooks/useCommandPaletteHotkey";

function getSourceIcon(source: string) {
  switch (source) {
    case "llm":
      return <Sparkles />;
    case "import":
      return <FileJson />;
    case "extract":
      return <LinkIcon />;
    default:
      return <BookOpen />;
  }
}

export function CommandPalette() {
  useCommandPaletteHotkey();
  const { isOpen, close, setOpen } = useCommandPalette();
  const navigate = useNavigate();
  const { open: openSettings } = useSettingsSearch();

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: listCourses,
    enabled: isOpen,
  });

  const courses = coursesQuery.data ?? [];

  const runCommand = (action: () => void) => {
    close();
    action();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen}>
      <Command_Inner
        onHome={() => runCommand(() => navigate({ to: "/" }))}
        onNewCourse={() =>
          runCommand(() =>
            navigate({ to: "/", search: { session: undefined } as never })
          )
        }
        onOpenSettings={() => runCommand(() => openSettings())}
        onSelectCourse={(courseId) =>
          runCommand(() =>
            navigate({ to: "/course/$courseId", params: { courseId } })
          )
        }
        courses={courses}
      />
    </CommandDialog>
  );
}

interface InnerProps {
  onHome: () => void;
  onNewCourse: () => void;
  onOpenSettings: () => void;
  onSelectCourse: (courseId: string) => void;
  courses: Array<{
    id: string;
    title: string;
    source: string;
    description?: string;
  }>;
}

function Command_Inner({
  onHome,
  onNewCourse,
  onOpenSettings,
  onSelectCourse,
  courses,
}: InnerProps) {
  return (
    <>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={onHome} value="home">
            <Home />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={onNewCourse} value="create">
            <Plus />
            <span>Create</span>
          </CommandItem>
          <CommandItem onSelect={onOpenSettings} value="settings preferences">
            <SettingsIcon />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        {courses.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Courses">
              {courses.map((course) => (
                <CommandItem
                  key={course.id}
                  value={`${course.title} ${course.description ?? ""}`}
                  onSelect={() => onSelectCourse(course.id)}
                >
                  {getSourceIcon(course.source)}
                  <span className="truncate">{course.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </>
  );
}
