import { useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History, MessagesSquare, Trash2 } from "lucide-react";
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
import { ErrorState } from "@/components/ErrorState";
import { cn } from "@/lib/utils";
import type { SessionMeta } from "@/modules/wizard-agent";
import { getStorageMode } from "@/lib/runtimeConfig";
import { getLocalDataApi, isLocalDataAvailable } from "@/lib/localRepo";
import { sessionRepo } from "@modules/repository";

const SCOPE_QUERY = "contentType=roadmap";
const ROADMAP_SCOPE = { contentType: "roadmap" as const };

async function isBrowserMode(): Promise<boolean> {
  return (await getStorageMode()) === "browser";
}

async function fetchRoadmapSessions(): Promise<SessionMeta[]> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return [];
    return sessionRepo.listSessions(getLocalDataApi(), ROADMAP_SCOPE);
  }
  const res = await fetch(`/api/wizard-agent/sessions?${SCOPE_QUERY}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.sessions) ? data.sessions : [];
}

async function deleteRoadmapSession(id: string): Promise<void> {
  if (await isBrowserMode()) {
    await sessionRepo.deleteSession(getLocalDataApi(), ROADMAP_SCOPE, id);
    return;
  }
  const res = await fetch(
    `/api/wizard-agent/sessions/${encodeURIComponent(id)}?${SCOPE_QUERY}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    throw new Error(`Failed to delete (${res.status})`);
  }
}

export const courseHistoryQueryKey = [
  "wizard-agent",
  "sessions",
  "roadmap",
] as const;

export default function CourseHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const sessionsQuery = useQuery({
    queryKey: courseHistoryQueryKey,
    queryFn: fetchRoadmapSessions,
    refetchInterval: 5000,
  });

  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  const sessions = sessionsQuery.data ?? [];
  if (sessions.length === 0) return null;

  const activeSessionId =
    location.pathname === "/"
      ? (location.search as Record<string, string | undefined>)?.session
      : undefined;

  const handleSelect = (id: string) => {
    navigate({ to: "/", search: { session: id } });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deleteRoadmapSession(id);
      queryClient.invalidateQueries({ queryKey: courseHistoryQueryKey });
      setDeleteDialogOpenId(null);
      if (id === activeSessionId) {
        navigate({ to: "/", search: { session: undefined } });
      }
    } catch (e) {
      setDeleteError({
        id,
        message: (e as Error).message ?? "Failed to delete",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <CollapsibleSidebarGroup
      sectionId="history"
      to="/"
      label={
        <>
          <History className="size-4" />
          History
        </>
      }
    >
      <SidebarMenu>
        {sessions.map((session) => (
          <SidebarMenuItem
            key={session.id}
            className="group/history-item relative"
          >
            <SidebarMenuButton
              onClick={() => handleSelect(session.id)}
              className={cn(
                "pr-8 cursor-pointer",
                session.id === activeSessionId && "bg-sidebar-accent"
              )}
            >
              <MessagesSquare />
              <span className="truncate">{session.title}</span>
            </SidebarMenuButton>

            <AlertDialog
              open={deleteDialogOpenId === session.id}
              onOpenChange={(open) => {
                if (open) setDeleteError(null);
                setDeleteDialogOpenId(open ? session.id : null);
              }}
            >
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-0 right-0 opacity-0 group-hover/history-item:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Delete session"
                  >
                    <Trash2 />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{session.title}".
                  </AlertDialogDescription>
                  {deleteError?.id === session.id && (
                    <ErrorState
                      variant="minimal"
                      message={deleteError.message}
                    />
                  )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingId === session.id}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => handleDelete(session.id)}
                    disabled={deletingId === session.id}
                  >
                    {deletingId === session.id ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </CollapsibleSidebarGroup>
  );
}
