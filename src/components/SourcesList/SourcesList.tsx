import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  AlertCircle,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import type { SourceKind } from "@/modules/core";
import { useSources } from "@/modules/sources";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { CollapsibleSidebarGroup } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

function kindIcon(kind: SourceKind) {
  if (kind === "image") return <ImageIcon />;
  return <FileText />;
}

export default function SourcesList() {
  const location = useLocation();
  const { sources, isLoading, remove } = useSources({ scope: {} });

  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(
    null
  );

  if (isLoading) return null;

  const handleDelete = (id: string) => {
    remove.mutate(id, {
      onSuccess: () => setDeleteDialogOpenId(null),
    });
  };

  return (
    <CollapsibleSidebarGroup
      sectionId="sources"
      to="/sources"
      label={
        <>
          <FolderOpen className="size-4" />
          Sources
        </>
      }
    >
      {sources.length === 0 ? (
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              No sources yet
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      ) : (
        <SidebarMenu>
          {sources.map((source) => (
            <SidebarMenuItem
              key={source.id}
              className="group/source-item relative"
            >
              <SidebarMenuButton
                isActive={location.pathname === "/sources"}
                className="pr-8"
                render={
                  <Link to="/sources">
                    {kindIcon(source.kind)}
                    <span className="truncate">{source.label}</span>
                    {source.status === "processing" && (
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground shrink-0" />
                    )}
                    {source.status === "error" && (
                      <AlertCircle className="size-3.5 text-destructive shrink-0" />
                    )}
                  </Link>
                }
              />

              <AlertDialog
                open={deleteDialogOpenId === source.id}
                onOpenChange={(open) =>
                  setDeleteDialogOpenId(open ? source.id : null)
                }
              >
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                        "absolute top-0 right-0 opacity-0 transition-opacity",
                        "group-hover/source-item:opacity-100"
                      )}
                      onClick={(e) => e.stopPropagation()}
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
                      This will permanently delete "{source.label}" and detach it
                      from everywhere it's used.
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
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}
    </CollapsibleSidebarGroup>
  );
}
