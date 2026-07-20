import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2 } from "lucide-react";
import { shareMdToDeck, type ShareableDeck } from "@modules/md-formats";
import { createDeck } from "@/lib/decks";
import { decksQueryKey } from "@/components/DeckList";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ImportDeckDialogProps {
  /** Trigger element for standalone (uncontrolled) usage. */
  trigger?: React.ReactElement;
  /** Controlled open state — for opening from an external menu item. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ImportDeckDialog({
  trigger,
  open,
  onOpenChange,
}: ImportDeckDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [internalOpen, setInternalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
      if (!next) {
        setImportText("");
        setImportError(null);
      }
    },
    [isControlled, onOpenChange]
  );

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    setImportError(null);
    try {
      let parsed: ShareableDeck;
      try {
        parsed = shareMdToDeck(importText);
      } catch (e) {
        setImportError(
          e instanceof Error ? e.message : "Could not parse pasted content"
        );
        return;
      }

      const result = await createDeck({
        title: parsed.title || "Imported deck",
        description: parsed.description,
        kind: parsed.kind,
        source: "import",
        content: parsed.content,
      });
      if (!result.success || !result.id) {
        setImportError(result.error || "Failed to import deck");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: decksQueryKey });
      setOpen(false);
      navigate({ to: "/decks/$deckId", params: { deckId: result.id } });
    } catch (e) {
      setImportError(String(e));
    } finally {
      setIsImporting(false);
    }
  }, [importText, queryClient, navigate, setOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Import deck</DialogTitle>
          <DialogDescription>
            Paste an exported deck below to create a copy here.
          </DialogDescription>
        </DialogHeader>
        {importError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
            {importError}
          </div>
        )}
        <Textarea
          autoFocus
          className="font-mono text-xs min-h-60 max-h-[60vh]"
          placeholder="Paste exported deck markdown here…"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={isImporting} />}
          >
            Cancel
          </DialogClose>
          <Button
            onClick={handleImport}
            disabled={isImporting || !importText.trim()}
          >
            {isImporting ? (
              <>
                <Loader2 className="animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <Upload />
                Import deck
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
