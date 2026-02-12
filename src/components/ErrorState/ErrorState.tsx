import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ErrorStateVariant = "card" | "inline" | "banner" | "minimal";
export type ErrorSeverity = "error" | "warning" | "info";

interface ErrorStateProps {
  /** The error message to display */
  message: string;
  /** Optional title for the error */
  title?: string;
  /** Display variant for the error state */
  variant?: ErrorStateVariant;
  /** Severity level affecting styling */
  severity?: ErrorSeverity;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Callback when dismiss button is clicked */
  onDismiss?: () => void;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Whether to show dismiss button */
  showDismiss?: boolean;
  /** Label for the retry button */
  retryLabel?: string;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Additional details (e.g., error stack trace for development) */
  details?: string;
}

const severityStyles = {
  error: {
    icon: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    text: "text-destructive",
  },
  warning: {
    icon: "text-yellow-600 dark:text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-800 dark:text-yellow-200",
  },
  info: {
    icon: "text-blue-600 dark:text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-200",
  },
};

/**
 * ErrorState - A reusable component for displaying error states
 *
 * @example
 * // Basic inline error
 * <ErrorState message="Failed to load data" />
 *
 * @example
 * // Card with retry
 * <ErrorState
 *   variant="card"
 *   title="Something went wrong"
 *   message="Failed to load courses"
 *   onRetry={() => refetch()}
 *   showRetry
 * />
 *
 * @example
 * // Dismissible banner
 * <ErrorState
 *   variant="banner"
 *   message="Connection lost"
 *   onDismiss={() => clearError()}
 *   showDismiss
 * />
 */
export function ErrorState({
  message,
  title,
  variant = "inline",
  severity = "error",
  onRetry,
  onDismiss,
  showRetry = false,
  showDismiss = false,
  retryLabel = "Try Again",
  isRetrying = false,
  className,
  details,
}: ErrorStateProps) {
  const styles = severityStyles[severity];

  if (variant === "minimal") {
    return (
      <p className={cn("text-sm font-medium", styles.text, className)}>
        {message}
      </p>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <AlertCircle className={cn("h-4 w-4 shrink-0", styles.icon)} />
        <p className={cn("text-sm font-medium", styles.text)}>{message}</p>
        {showRetry && onRetry && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onRetry}
            disabled={isRetrying}
            className="ml-2"
          >
            <RefreshCw className={cn("h-3 w-3", isRetrying && "animate-spin")} />
            {retryLabel}
          </Button>
        )}
        {showDismiss && onDismiss && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onDismiss}
            className="ml-auto"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border p-4",
          styles.bg,
          styles.border,
          className
        )}
        role="alert"
      >
        <AlertCircle className={cn("h-5 w-5 shrink-0", styles.icon)} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className={cn("font-medium", styles.text)}>{title}</p>
          )}
          <p className={cn("text-sm", title ? "text-muted-foreground" : styles.text)}>
            {message}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
            >
              <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
              {retryLabel}
            </Button>
          )}
          {showDismiss && onDismiss && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDismiss}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <Card className={cn("border-destructive/20", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className={cn("h-5 w-5", styles.icon)} />
          <CardTitle className={styles.text}>
            {title || "Error"}
          </CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          {message}
        </CardDescription>
      </CardHeader>
      {(details || showRetry || showDismiss) && (
        <CardContent>
          {details && (
            <pre className="mb-4 max-h-32 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {details}
            </pre>
          )}
          <div className="flex gap-2">
            {showRetry && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled={isRetrying}
              >
                <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
                {retryLabel}
              </Button>
            )}
            {showDismiss && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default ErrorState;
