import { useEffect, useState, useCallback } from "react";
import { Bot, Loader2, Plus, Sparkles } from "lucide-react";

import {
  AVAILABLE_MODELS,
  getModelLabelWithPrice,
  getValidModel,
} from "@/lib/llmModels";
import { useSettings } from "@/modules/settings";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInstructionEnhancement } from "@/hooks/use-instruction-enhancement";
import { EnhancedInstructionPreview } from "@/components/EnhancedInstructionPreview";

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Data for creating a new agent
 */
export interface AgentData {
  name: string;
  model: string;
  instructions: string;
}

/**
 * Props for the AgentCreationDialog component
 */
export interface AgentCreationDialogProps {
  /** Callback when agent is successfully created */
  onAgentCreated: (data: AgentData) => void | Promise<void>;
  /** Optional callback when dialog open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Control open state externally */
  open?: boolean;
  /** Custom trigger element */
  trigger?: React.ReactElement;
  /** Whether creation is in progress (for external loading state) */
  isCreating?: boolean;
  /** Default name for the agent */
  defaultName?: string;
  /** Default instructions for the agent */
  defaultInstructions?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_INSTRUCTIONS = `You are a helpful learning assistant. Your role is to:
- Guide users through their learning journey
- Explain concepts clearly and concisely
- Provide examples and practice exercises
- Answer questions and clarify doubts
- Encourage and motivate learners`;

// ============================================================================
// Component
// ============================================================================

export function AgentCreationDialog({
  onAgentCreated,
  onOpenChange,
  open,
  trigger,
  isCreating: externalIsCreating,
  defaultName = "",
  defaultInstructions = DEFAULT_INSTRUCTIONS,
}: AgentCreationDialogProps) {
  const { settings } = useSettings();

  // Form state
  const [name, setName] = useState(defaultName);
  const [model, setModel] = useState<string>(() =>
    getValidModel(settings.llm.defaultModel)
  );
  const [instructions, setInstructions] = useState(defaultInstructions);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhancement hook for instructions
  const enhancement = useInstructionEnhancement();

  const isLoading = externalIsCreating || isSubmitting;
  const isEnhanceDisabled =
    isLoading ||
    enhancement.isEnhancing ||
    !enhancement.canEnhance(instructions);

  // Sync model with settings when they change
  useEffect(() => {
    setModel(getValidModel(settings.llm.defaultModel));
  }, [settings.llm.defaultModel]);

  const resetForm = useCallback(() => {
    setName(defaultName);
    setModel(getValidModel(settings.llm.defaultModel));
    setInstructions(defaultInstructions);
    setError(null);
    enhancement.reset();
  }, [defaultName, defaultInstructions, settings.llm.defaultModel, enhancement]);

  const handleEnhanceInstructions = useCallback(async () => {
    if (isEnhanceDisabled) return;
    await enhancement.enhance(instructions, { contentType: "course" });
  }, [instructions, isEnhanceDisabled, enhancement]);

  const handleAcceptEnhancement = useCallback(() => {
    const enhanced = enhancement.accept();
    if (enhanced) {
      setInstructions(enhanced);
    }
  }, [enhancement]);

  const handleRejectEnhancement = useCallback(() => {
    enhancement.reject();
  }, [enhancement]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetForm();
      }
      onOpenChange?.(newOpen);
    },
    [onOpenChange, resetForm]
  );

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return "Agent name is required";
    }
    if (name.trim().length < 2) {
      return "Agent name must be at least 2 characters";
    }
    if (name.trim().length > 50) {
      return "Agent name must be less than 50 characters";
    }
    if (!instructions.trim()) {
      return "Instructions are required";
    }
    if (instructions.trim().length < 10) {
      return "Instructions must be at least 10 characters";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data: AgentData = {
        name: name.trim(),
        model,
        instructions: instructions.trim(),
      };
      await onAgentCreated(data);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred while creating the agent"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <Button render={DialogTrigger}>
          <Plus className="w-4 h-4" />
          <span>Create Agent</span>
        </Button>
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Create Learning Agent
          </DialogTitle>
          <DialogDescription>
            Configure an AI agent to assist with learning. Choose a model and provide
            instructions that define how the agent should behave.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="agent-name">Agent Name</Label>
            <Input
              id="agent-name"
              placeholder="e.g., Python Tutor, Math Helper"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select
              value={model}
              onValueChange={(value: any) => setModel(value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="p-1">
                {Object.entries(AVAILABLE_MODELS).map(([value, stats]) => (
                  <SelectItem key={value} value={value}>
                    {getModelLabelWithPrice(stats)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the AI model that will power this agent.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="instructions">Instructions</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEnhanceInstructions}
                disabled={isEnhanceDisabled}
                className="h-7 text-xs gap-1.5"
              >
                {enhancement.isEnhancing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Enhance with AI
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="instructions"
              placeholder="Describe how the agent should behave, what topics it should focus on, and any specific guidelines..."
              className="min-h-32"
              value={instructions}
              onChange={(e) => {
                setInstructions(e.target.value);
                // Clear enhanced instruction when user edits
                if (enhancement.enhancedInstruction) {
                  enhancement.reject();
                }
              }}
              disabled={isLoading || enhancement.isEnhancing}
            />

            {/* Enhancement error display */}
            {enhancement.error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
                {enhancement.error}
              </div>
            )}

            {/* Enhanced instruction preview with accept/reject */}
            {enhancement.enhancedInstruction && (
              <EnhancedInstructionPreview
                enhancedInstruction={enhancement.enhancedInstruction}
                onAccept={handleAcceptEnhancement}
                onReject={handleRejectEnhancement}
                title="Enhanced Instructions"
                disabled={isLoading}
              />
            )}

            <p className="text-xs text-muted-foreground">
              These instructions define the agent's personality, expertise, and behavior.
            </p>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={isLoading} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  Create Agent
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AgentCreationDialog;
