import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Home,
  Layers,
  ListChecks,
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
import { listDecks } from "@/lib/decks";
import type { DeckKind } from "@/lib/types";
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

  const decksQuery = useQuery({
    queryKey: ["decks"],
    queryFn: listDecks,
    enabled: isOpen,
  });

  const courses = coursesQuery.data ?? [];
  const decks = decksQuery.data ?? [];

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
        onOpenDecks={() => runCommand(() => navigate({ to: "/decks" }))}
        onOpenSettings={() => runCommand(() => openSettings())}
        onSelectCourse={(courseId) =>
          runCommand(() =>
            navigate({ to: "/course/$courseId", params: { courseId } })
          )
        }
        onSelectDeck={(deckId) =>
          runCommand(() =>
            navigate({ to: "/decks/$deckId", params: { deckId } })
          )
        }
        courses={courses}
        decks={decks}
      />
    </CommandDialog>
  );
}

interface InnerProps {
  onHome: () => void;
  onNewCourse: () => void;
  onOpenDecks: () => void;
  onOpenSettings: () => void;
  onSelectCourse: (courseId: string) => void;
  onSelectDeck: (deckId: string) => void;
  courses: Array<{
    id: string;
    title: string;
    source: string;
    description?: string;
  }>;
  decks: Array<{
    id: string;
    title: string;
    kind: DeckKind;
    description?: string;
  }>;
}

function deckIcon(kind: DeckKind) {
  return kind === "flashcards" ? <Layers /> : <ListChecks />;
}

function Command_Inner({
  onHome,
  onNewCourse,
  onOpenDecks,
  onOpenSettings,
  onSelectCourse,
  onSelectDeck,
  courses,
  decks,
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
          <CommandItem onSelect={onNewCourse} value="create new">
            <Plus />
            <span>Create</span>
          </CommandItem>
          <CommandItem onSelect={onOpenDecks} value="decks flashcards quiz">
            <Layers />
            <span>Decks</span>
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
                  value={`${course.title} ${course.description ?? ""} ${course.id}`}
                  onSelect={() => onSelectCourse(course.id)}
                >
                  {getSourceIcon(course.source)}
                  <span className="truncate">{course.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {decks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Decks">
              {decks.map((deck) => (
                <CommandItem
                  key={deck.id}
                  value={`${deck.title} ${deck.description ?? ""} ${deck.id}`}
                  onSelect={() => onSelectDeck(deck.id)}
                >
                  {deckIcon(deck.kind)}
                  <span className="truncate">{deck.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </>
  );
}
