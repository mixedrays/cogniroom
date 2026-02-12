import { Link } from "@tanstack/react-router";
import { CircleCheck, CircleDashed, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContentBadgeProps {
  hasContent: boolean;
  completed?: boolean;
  icon: React.ReactNode;
  label: string;
  to: string;
  params: Record<string, string>;
  className?: string;
  isActive?: boolean;
  isActiveSection?: boolean;
}

export function ContentBadge({
  hasContent,
  completed,
  icon,
  label,
  to,
  params,
  className,
  isActive,
  isActiveSection,
}: ContentBadgeProps) {
  return (
    <Link
      to={to}
      params={params}
      className={cn(
        "inline-flex border items-center gap-1 px-1.5 py-1 rounded text-xs transition-colors hover:border-primary/90 hover:text-primary/90",
        hasContent && "text-muted-foreground",
        !hasContent && "border-dashed text-muted-foreground/60",
        isActive && "border-muted-foreground/40",
        isActiveSection && "bg-primary/10 text-primary border-primary",
        className
      )}
      title={`${label}${hasContent ? (completed ? " (completed)" : "") : " (no content)"}`}
      onClick={(e) => e.stopPropagation()}
    >
      {icon}
      {!hasContent && <CircleDashed />}
      {hasContent && completed && <CircleCheck />}
      {hasContent && !completed && <Circle />}
    </Link>
  );
}
