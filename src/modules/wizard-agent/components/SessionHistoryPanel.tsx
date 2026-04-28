import { Plus, Trash2, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionMeta } from "../types";

interface SessionHistoryPanelProps {
  sessions: SessionMeta[];
  currentSessionId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  className?: string;
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function SessionHistoryPanel({
  sessions,
  currentSessionId,
  onSelect,
  onNew,
  onDelete,
  className,
}: SessionHistoryPanelProps) {
  return (
    <div className={cn("flex flex-col h-full min-h-0 bg-sidebar", className)}>
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          History
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onNew}
          aria-label="New session"
        >
          <Plus />
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <MessagesSquare className="size-8 mb-2 opacity-50" />
            <p className="text-xs">No previous sessions</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <li key={session.id}>
                  <div
                    className={cn(
                      "group flex items-start gap-1 rounded-md px-2 py-1.5 cursor-pointer hover:bg-sidebar-accent",
                      isActive && "bg-sidebar-accent"
                    )}
                    onClick={() => onSelect(session.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(session.id);
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelative(session.updatedAt)}
                      </p>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(session.id);
                      }}
                      aria-label="Delete session"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
