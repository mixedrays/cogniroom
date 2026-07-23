import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, ListChecks, Sparkles, Trash2 } from "lucide-react";
import { deleteDeck, listDecks } from "@/lib/decks";
import type { DeckKind, DeckSource } from "@/lib/types";
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CollapsibleSidebarGroup } from "@/components/Sidebar";
import { ChevronDown } from "lucide-react";

export const decksQueryKey = ["decks"] as const;

function kindIcon(kind: DeckKind) {
  return kind === "flashcards" ? <Layers /> : <ListChecks />;
}

function sourceIcon(source: DeckSource) {
  if (source === "llm") return <Sparkles className="size-3" />;
  return null;
}

export default function DeckList() {
  const queryClient = useQueryClient();
  const decksQuery = useQuery({
    queryKey: decksQueryKey,
    queryFn: listDecks,
  });

  const [deleteOpenId, setDeleteOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  const decks = decksQuery.data ?? [];

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const result = await deleteDeck(id);
      if (!result.success) {
        setDeleteError({ id, message: result.error || "Failed to delete" });
        return;
      }
      setDeleteOpenId(null);
      await queryClient.invalidateQueries({ queryKey: decksQueryKey });
    } catch (e) {
      setDeleteError({ id, message: String(e) });
    } finally {
      setDeletingId(null);
    }
  };

  if (decksQuery.isLoading) {
    return <LoadingState variant="skeleton" skeletonRows={3} className="p-4" />;
  }

  if (decksQuery.isError) {
    return (
      <ErrorState
        variant="banner"
        title="Failed to load decks"
        message={
          decksQuery.error?.message || "An error occurred while loading decks"
        }
        onRetry={() => decksQuery.refetch()}
        showRetry
        className="m-4"
      />
    );
  }

  return (
    <CollapsibleSidebarGroup
      sectionId="decks"
      to="/decks"
      label={
        <>
          <Layers className="size-4" />
          Decks
        </>
      }
    >
      {decks.length === 0 ? (
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              No decks yet
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      ) : (
        <SidebarMenu>
          {decks.map((deck) => (
            <Collapsible key={deck.id} className="group/deck-item">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="pr-0"
                  render={
                    <Link
                      to="/decks/$deckId"
                      params={{ deckId: deck.id }}
                      className="relative"
                    >
                      {kindIcon(deck.kind)}
                      <span className="truncate">{deck.title}</span>
                      <CollapsibleTrigger
                        onClick={(e) => e.preventDefault()}
                        render={
                          <Button
                            size="icon-sm"
                            variant="secondary"
                            className="ml-auto"
                          >
                            <ChevronDown className="transition-transform duration-200 group-data-open/deck-item:rotate-180" />
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
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {sourceIcon(deck.source)}
                          {deck.kind === "flashcards"
                            ? `${deck.itemCount} cards`
                            : `${deck.itemCount} questions`}
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            variant="secondary"
                            nativeButton={false}
                            render={
                              <Link
                                to="/decks/$deckId"
                                params={{ deckId: deck.id }}
                              >
                                Open
                              </Link>
                            }
                          />
                          <AlertDialog
                            open={deleteOpenId === deck.id}
                            onOpenChange={(o) => {
                              if (o) setDeleteError(null);
                              setDeleteOpenId(o ? deck.id : null);
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
                                  Delete deck?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{deck.title}".
                                </AlertDialogDescription>
                                {deleteError?.id === deck.id && (
                                  <ErrorState
                                    variant="minimal"
                                    message={deleteError.message}
                                  />
                                )}
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  disabled={deletingId === deck.id}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  onClick={() => handleDelete(deck.id)}
                                  disabled={deletingId === deck.id}
                                >
                                  {deletingId === deck.id
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
      )}
    </CollapsibleSidebarGroup>
  );
}
