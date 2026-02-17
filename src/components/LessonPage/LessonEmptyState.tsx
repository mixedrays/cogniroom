import type { ReactNode } from "react";

interface LessonEmptyStateProps {
  title: string;
  description?: string;
  extra?: ReactNode;
  children?: ReactNode;
}

export function LessonEmptyState({
  title,
  description,
  extra,
  children,
}: LessonEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-6 p-6">
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
        {extra}
      </div>
      {children}
    </div>
  );
}
