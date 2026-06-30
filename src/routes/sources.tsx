import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  FileText,
  FolderOpen,
  Home,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Trash2,
} from "lucide-react";
import type { Source } from "@/modules/core";
import { useSources } from "@/modules/sources";
import { PageHeader } from "@/components/PageHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LoadingState } from "@/components/LoadingState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/sources")({
  component: SourcesPage,
});

/** File types the attach button accepts, matching the AI assistant's menu. */
const ACCEPT_FILE_TYPES =
  "image/*,application/pdf,.pdf,.docx,.doc,.txt,.md,.markdown";

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function kindIcon(kind: Source["kind"]) {
  if (kind === "image") return <ImageIcon className="size-4" />;
  return <FileText className="size-4" />;
}

function SourcesPage() {
  const { sources, isLoading, remove, upload, isUploading } = useSources({
    scope: {},
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (id: string) => {
    remove.mutate(id, { onSettled: () => setDeleteId(null) });
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    upload.mutate(Array.from(fileList));
  };

  return (
    <div className="relative animate-in fade-in duration-500 h-full flex flex-col overflow-auto">
      <PageHeader>
        <Breadcrumbs
          className="flex items-center"
          items={[
            { title: "", icon: <Home className="size-4" />, link: "/" },
            { title: "Sources" },
          ]}
        />
      </PageHeader>

      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 w-full">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_FILE_TYPES}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Sources
            </h1>
            <p className="text-muted-foreground">
              Files you've attached to the AI assistant. Deleting a source
              removes it everywhere it's attached.
            </p>
          </div>
          <Button
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
            Attach files
          </Button>
        </div>

        {isLoading ? (
          <LoadingState variant="skeleton" skeletonRows={4} />
        ) : sources.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <FolderOpen className="size-12 mx-auto mb-4 opacity-40" />
            <h2 className="text-lg font-medium mb-1">No sources yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Attach photos, PDFs, or documents here, or from the AI assistant's
              "+" menu, and they'll show up here.
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Paperclip />
              )}
              Attach files
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border bg-card divide-y">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center gap-3 p-4 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                  {kindIcon(source.kind)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-medium truncate">{source.label}</h3>
                    {source.status === "processing" && (
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground shrink-0" />
                    )}
                    {source.status === "error" && (
                      <Badge
                        variant="outline"
                        className="border-destructive text-destructive shrink-0"
                      >
                        <AlertCircle className="size-3" />
                        Error
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="bg-muted px-1.5 py-0.5 rounded capitalize">
                      {source.kind}
                    </span>
                    <span>·</span>
                    <span>{formatBytes(source.byteSize)}</span>
                    {source.refCount > 0 && (
                      <>
                        <span>·</span>
                        <span>
                          {source.refCount}{" "}
                          {source.refCount === 1 ? "attachment" : "attachments"}
                        </span>
                      </>
                    )}
                  </div>
                  {source.status === "error" && source.error && (
                    <p className="text-xs text-destructive mt-1 line-clamp-2">
                      {source.error}
                    </p>
                  )}
                </div>

                <AlertDialog
                  open={deleteId === source.id}
                  onOpenChange={(o) => setDeleteId(o ? source.id : null)}
                >
                  <AlertDialogTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${source.label}`}
                      >
                        <Trash2 />
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete source?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{source.label}" and detach
                        it from everywhere it's used.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={remove.isPending}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleDelete(source.id)}
                        disabled={remove.isPending}
                      >
                        {remove.isPending ? "Deleting…" : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
