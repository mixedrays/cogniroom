import type { ReactNode } from "react";

interface LessonPageShellProps {
  children: ReactNode;
}

export function LessonPageShell({ children }: LessonPageShellProps) {
  return (
    <div className="relative animate-in fade-in duration-500 h-full flex flex-col overflow-auto">
      {children}
    </div>
  );
}
