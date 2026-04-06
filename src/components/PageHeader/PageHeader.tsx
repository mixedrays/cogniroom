import { PropsWithChildren, ReactNode } from "react";

interface PageHeaderProps extends PropsWithChildren {
  actions?: ReactNode;
}

export function PageHeader({ children, actions }: PageHeaderProps) {
  return (
    <div className="sticky p-2 min-h-13 mx-0.5 flex items-center left-0 top-0 z-20 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex-1 gap-2 px-2 flex items-center justify-between min-w-0">
        {children}
      </div>

      {actions}
    </div>
  );
}
