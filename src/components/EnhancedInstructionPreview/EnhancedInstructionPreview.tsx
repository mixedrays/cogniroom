import { Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// Types
// ============================================================================

export interface EnhancedInstructionPreviewProps {
  /** The enhanced instruction text to display */
  enhancedInstruction: string;
  /** Callback when user accepts the enhancement */
  onAccept: () => void;
  /** Callback when user rejects the enhancement */
  onReject: () => void;
  /** Optional custom title for the preview */
  title?: string;
  /** Whether the buttons are disabled */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * EnhancedInstructionPreview - Displays an AI-enhanced instruction with accept/reject buttons
 *
 * @example
 * {enhancedInstruction && (
 *   <EnhancedInstructionPreview
 *     enhancedInstruction={enhancedInstruction}
 *     onAccept={handleAccept}
 *     onReject={handleReject}
 *   />
 * )}
 */
export function EnhancedInstructionPreview({
  enhancedInstruction,
  onAccept,
  onReject,
  title = "Enhanced Instruction",
  disabled = false,
}: EnhancedInstructionPreviewProps) {
  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-md border border-border">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          {title}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onAccept}
            disabled={disabled}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Accept enhancement"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onReject}
            disabled={disabled}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Reject enhancement"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">
        {enhancedInstruction}
      </p>
    </div>
  );
}

export default EnhancedInstructionPreview;
