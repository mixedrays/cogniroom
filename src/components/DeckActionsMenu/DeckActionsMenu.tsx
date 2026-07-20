import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  EllipsisVertical,
  Download,
  Upload,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { deckToShareMd, type ShareableDeck } from "@modules/md-formats";
import type { Deck, FlashcardsContent, QuizContent } from "@/lib/types";
import { deleteDeck } from "@/lib/decks";
import { decksQueryKey } from "@/components/DeckList";
import { ImportDeckDialog } from "@/components/ImportDeckDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeckActionsMenuProps {
  deck: Deck;
  flashcards: FlashcardsContent | null;
  quiz: QuizContent | null;
}

export function DeckActionsMenu({
  deck,
  flashcards,
  quiz,
}: DeckActionsMenuProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [importOpen, setImportOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const content = deck.kind === "flashcards" ? flashcards : quiz;
  const hasContent =
    deck.kind === "flashcards"
      ? (flashcards?.flashcards.length ?? 0) > 0
      : (quiz?.quizQuestions.length ?? 0) > 0;

  const exportMarkdown = useMemo(() => {
    if (!content) return "";
    return deckToShareMd({
      title: deck.title,
      description: deck.description,
      kind: deck.kind,
      content,
    } satisfies ShareableDeck);
  }, [content, deck.title, deck.description, deck.kind]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [exportMarkdown]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteDeck(deck.id);
      if (!result.success) {
        setDeleteError(result.error || "Failed to delete");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: decksQueryKey });
      navigate({ to: "/decks" });
    } catch (e) {
      setDeleteError(String(e));
    } finally {
      setIsDeleting(false);
    }
  }, [deck.id, queryClient, navigate]);

  return (
    <>
      <DropdownMenu>
        <Tooltip content="Deck actions">
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <EllipsisVertical />
            <span className="sr-only">Deck actions</span>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end" side="bottom" className="w-auto">
          <DropdownMenuItem
            disabled={!hasContent}
            onClick={() => setExportOpen(true)}
          >
            <Download />
            Export
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setImportOpen(true)}>
            <Upload />
            Import
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export deck</DialogTitle>
            <DialogDescription>
              Copy this markdown and paste it into Import on another device.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            readOnly
            className="font-mono text-xs min-h-60 max-h-[60vh]"
            value={exportMarkdown}
            onFocus={(e) => e.currentTarget.select()}
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
            <Button onClick={handleCopy}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportDeckDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deck?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deck.title}".
            </AlertDialogDescription>
            {deleteError && (
              <p className="text-sm text-destructive">{deleteError}</p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
