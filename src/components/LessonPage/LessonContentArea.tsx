import type { ReactNode } from "react";

interface LessonContentAreaProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function LessonContentArea({
  title,
  description,
  children,
}: LessonContentAreaProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {title}
        </h1>

        {description && (
          <p className="text-xl text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
