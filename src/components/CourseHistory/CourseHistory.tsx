import { useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History, MessagesSquare, Trash2 } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { SessionMeta } from "@/modules/wizard-agent";

const SCOPE_QUERY = "contentType=roadmap";

async function fetchRoadmapSessions(): Promise<SessionMeta[]> {
  const res = await fetch(`/api/wizard-agent/sessions?${SCOPE_QUERY}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.sessions) ? data.sessions : [];
}

async function deleteRoadmapSession(id: string): Promise<void> {
  await fetch(
    `/api/wizard-agent/sessions/${encodeURIComponent(id)}?${SCOPE_QUERY}`,
    { method: "DELETE" }
  );
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
    await deleteRoadmapSession(id);
    queryClient.invalidateQueries({ queryKey: courseHistoryQueryKey });
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-1.5">
        <History className="size-3.5" />
        History
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {sessions.map((session) => (
            <SidebarMenuItem key={session.id} className="group/history-item">
              <SidebarMenuButton
                onClick={() => handleSelect(session.id)}
                className={cn(
                  "pr-8",
                  session.id === activeSessionId && "bg-sidebar-accent"
                )}
              >
                <MessagesSquare />
                <span className="truncate">{session.title}</span>
              </SidebarMenuButton>
              <SidebarMenuAction
                showOnHover
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(session.id);
                }}
                aria-label="Delete session"
              >
                <Trash2 />
              </SidebarMenuAction>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
