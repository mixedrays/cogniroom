import React from "react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  children: React.ReactNode;
  className?: string;
}

export function Topbar({ children, className }: TopbarProps) {
  return (
    <div className={cn("flex justify-between gap-1 px-4 py-2", className)}>
      {children}
    </div>
  );
}
