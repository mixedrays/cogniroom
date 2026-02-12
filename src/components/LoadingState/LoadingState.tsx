import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type LoadingStateVariant = "spinner" | "skeleton" | "inline";

interface LoadingStateProps {
  /** Display variant for the loading state */
  variant?: LoadingStateVariant;
  /** Custom message to display */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Number of skeleton rows to show (only for skeleton variant) */
  skeletonRows?: number;
  /** Size of the spinner (only for spinner variant) */
  size?: "sm" | "md" | "lg";
  /** Whether to center the loading state */
  centered?: boolean;
  /** Minimum height for the container */
  minHeight?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

/**
 * LoadingState - A reusable component for displaying loading states
 *
 * @example
 * // Spinner (default)
 * <LoadingState message="Loading courses..." />
 *
 * @example
 * // Skeleton
 * <LoadingState variant="skeleton" skeletonRows={3} />
 *
 * @example
 * // Inline
 * <LoadingState variant="inline" size="sm" />
 */
export function LoadingState({
  variant = "spinner",
  message,
  className,
  skeletonRows = 3,
  size = "md",
  centered = true,
  minHeight = "50vh",
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: skeletonRows }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </span>
    );
  }

  // Default: spinner variant
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3",
        centered && "justify-center",
        className
      )}
      style={{ minHeight: centered ? minHeight : undefined }}
    >
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}

export default LoadingState;
