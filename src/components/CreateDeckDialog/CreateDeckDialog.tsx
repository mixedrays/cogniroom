import { useState } from "react";
import { Loader2, Plus, Layers, ListChecks } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { mdToFlashcards, mdToQuiz } from "@modules/md-formats";
import { createDeck } from "@/lib/decks";
import type { DeckKind } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { decksQueryKey } from "@/components/DeckList";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface CreateDeckDialogProps {
  trigger?: React.ReactElement;
  defaultKind?: DeckKind;
}

export default function CreateDeckDialog({
  trigger,
  defaultKind = "flashcards",
}: CreateDeckDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeKind, setActiveKind] = useState<DeckKind>(defaultKind);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const online = useOnlineStatus();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMarkdown("");
    setError(null);
    setActiveKind(defaultKind);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let content: unknown = null;
      if (markdown.trim()) {
        try {
          content =
            activeKind === "flashcards"
              ? mdToFlashcards(markdown)
              : mdToQuiz(markdown);
        } catch (e) {
          setError(`Could not parse markdown: ${String(e)}`);
          return;
        }
      }

      const result = await createDeck({
        title: title.trim(),
        description: description.trim() || undefined,
        kind: activeKind,
        source: markdown.trim() ? "import" : "manual",
        content: content as never,
      });

      if (!result.success || !result.id) {
        setError(result.error || "Failed to create deck");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: decksQueryKey });
      setOpen(false);
      resetForm();
      navigate({ to: "/decks/$deckId", params: { deckId: result.id } });
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus />
              <span>New Deck</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Create new deck</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeKind}
          onValueChange={(v) => setActiveKind(v as DeckKind)}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="flashcards">
              <Layers className="size-4" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="quiz">
              <ListChecks className="size-4" />
              Quiz
            </TabsTrigger>
          </TabsList>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <TabsContent value="flashcards" className="space-y-4 mt-0">
            <DeckFields
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              markdown={markdown}
              setMarkdown={setMarkdown}
              kind="flashcards"
            />
          </TabsContent>

          <TabsContent value="quiz" className="space-y-4 mt-0">
            <DeckFields
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              markdown={markdown}
              setMarkdown={setMarkdown}
              kind="quiz"
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={isLoading} />}
          >
            Cancel
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !online}
            title={!online ? "You are offline" : undefined}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Plus />
                Create deck
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeckFieldsProps {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  markdown: string;
  setMarkdown: (v: string) => void;
  kind: DeckKind;
}

function DeckFields({
  title,
  setTitle,
  description,
  setDescription,
  markdown,
  setMarkdown,
  kind,
}: DeckFieldsProps) {
  const placeholder =
    kind === "flashcards"
      ? "---\nid: card-1\nquestion: What is a closure?\ndifficulty: easy\n---\n\nA closure is a function bundled with its lexical scope.\n"
      : "---\nid: q-1\ntype: choice\nquestion: What is 2 + 2?\ndifficulty: easy\n---\n\n- [x] 4\n- [ ] 3\n- [ ] 5\n";

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="deck-title">Title</Label>
        <Input
          id="deck-title"
          autoFocus
          placeholder="e.g., TypeScript essentials"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deck-description">Description (optional)</Label>
        <Input
          id="deck-description"
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deck-content">
          Content as markdown (optional — leave blank to create an empty deck)
        </Label>
        <Textarea
          id="deck-content"
          className="font-mono text-xs min-h-50"
          placeholder={placeholder}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
        />
      </div>
    </div>
  );
}
