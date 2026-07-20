import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, Layers, ListChecks, Upload } from "lucide-react";
import { listDecks } from "@/lib/decks";
import { PageHeader } from "@/components/PageHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import CreateDeckDialog from "@/components/CreateDeckDialog";
import { ImportDeckDialog } from "@/components/ImportDeckDialog";
import { Button } from "@/components/ui/button";
import { decksQueryKey } from "@/components/DeckList";

export const Route = createFileRoute("/decks/")({
  component: DecksIndex,
});

function DecksIndex() {
  const decksQuery = useQuery({
    queryKey: decksQueryKey,
    queryFn: listDecks,
  });

  const decks = decksQuery.data ?? [];

  return (
    <div className="relative animate-in fade-in duration-500 h-full flex flex-col overflow-auto">
      <PageHeader>
        <Breadcrumbs
          className="flex items-center"
          items={[
            { title: "", icon: <Home className="size-4" />, link: "/" },
            { title: "Decks" },
          ]}
        />
      </PageHeader>

      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 w-full">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Decks
            </h1>
            <p className="text-muted-foreground">
              Standalone flashcard sets and quizzes — separate from courses.
            </p>
          </div>
          {decks.length > 0 && (
            <ImportDeckDialog
              trigger={
                <Button className="shrink-0">
                  <Upload />
                  Import deck
                </Button>
              }
            />
          )}
        </div>

        {decksQuery.isLoading ? (
          <LoadingState variant="skeleton" skeletonRows={4} />
        ) : decksQuery.isError ? (
          <ErrorState
            variant="banner"
            title="Failed to load decks"
            message={decksQuery.error?.message || "Unknown error"}
            onRetry={() => decksQuery.refetch()}
            showRetry
          />
        ) : decks.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <Layers className="size-12 mx-auto mb-4 opacity-40" />
            <h2 className="text-lg font-medium mb-1">No decks yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create a standalone flashcard set or quiz for any topic, or import
              one shared from another device.
            </p>
            <div className="flex items-center justify-center gap-2">
              <CreateDeckDialog />
              <ImportDeckDialog
                trigger={
                  <Button variant="outline">
                    <Upload />
                    Import deck
                  </Button>
                }
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {decks.map((deck) => (
              <Link
                key={deck.id}
                to="/decks/$deckId"
                params={{ deckId: deck.id }}
                className="rounded-xl border bg-card p-5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                    {deck.kind === "flashcards" ? (
                      <Layers className="size-4" />
                    ) : (
                      <ListChecks className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{deck.title}</h3>
                    {deck.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {deck.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <span className="bg-muted px-1.5 py-0.5 rounded capitalize">
                        {deck.kind}
                      </span>
                      <span>·</span>
                      <span>
                        {deck.itemCount}{" "}
                        {deck.kind === "flashcards" ? "cards" : "questions"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
