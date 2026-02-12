import { LoadingState, type LoadingStateVariant } from "@/components/LoadingState";
import { ErrorState, type ErrorStateVariant, type ErrorSeverity } from "@/components/ErrorState";
import { cn } from "@/lib/utils";

interface StateHandlerProps {
  /** Whether the content is loading */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | Error | null;
  /** The content to render when not loading and no error */
  children: React.ReactNode;
  /** Loading state configuration */
  loading?: {
    variant?: LoadingStateVariant;
    message?: string;
    skeletonRows?: number;
    size?: "sm" | "md" | "lg";
    centered?: boolean;
    minHeight?: string;
  };
  /** Error state configuration */
  errorConfig?: {
    variant?: ErrorStateVariant;
    title?: string;
    severity?: ErrorSeverity;
    showRetry?: boolean;
    showDismiss?: boolean;
    retryLabel?: string;
  };
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Callback when dismiss button is clicked */
  onDismiss?: () => void;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Render function for empty state (when data is empty but no error) */
  empty?: React.ReactNode;
  /** Whether the data is empty (used with empty prop) */
  isEmpty?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * StateHandler - A compound component that handles loading, error, and empty states
 *
 * @example
 * // Basic usage with a query
 * <StateHandler
 *   isLoading={query.isLoading}
 *   error={query.error?.message}
 *   onRetry={() => query.refetch()}
 * >
 *   <DataContent data={query.data} />
 * </StateHandler>
 *
 * @example
 * // With empty state
 * <StateHandler
 *   isLoading={isLoading}
 *   error={error}
 *   isEmpty={items.length === 0}
 *   empty={<EmptyPlaceholder />}
 * >
 *   <ItemList items={items} />
 * </StateHandler>
 *
 * @example
 * // Custom loading configuration
 * <StateHandler
 *   isLoading={isLoading}
 *   loading={{ variant: "skeleton", skeletonRows: 5 }}
 * >
 *   <Content />
 * </StateHandler>
 */
export function StateHandler({
  isLoading = false,
  error,
  children,
  loading = {},
  errorConfig = {},
  onRetry,
  onDismiss,
  isRetrying = false,
  empty,
  isEmpty = false,
  className,
}: StateHandlerProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  if (isLoading) {
    return (
      <div className={className}>
        <LoadingState
          variant={loading.variant}
          message={loading.message}
          skeletonRows={loading.skeletonRows}
          size={loading.size}
          centered={loading.centered}
          minHeight={loading.minHeight}
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={cn("p-4", className)}>
        <ErrorState
          variant={errorConfig.variant}
          title={errorConfig.title}
          message={errorMessage}
          severity={errorConfig.severity}
          showRetry={errorConfig.showRetry ?? !!onRetry}
          showDismiss={errorConfig.showDismiss ?? !!onDismiss}
          retryLabel={errorConfig.retryLabel}
          onRetry={onRetry}
          onDismiss={onDismiss}
          isRetrying={isRetrying}
        />
      </div>
    );
  }

  if (isEmpty && empty) {
    return <div className={className}>{empty}</div>;
  }

  return <>{children}</>;
}

export default StateHandler;
