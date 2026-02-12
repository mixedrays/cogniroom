import { useState, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Content types supported by the instruction enhancement API
 */
export type EnhancementContentType = "lesson" | "exercise" | "test" | "course";

/**
 * Skill levels for content enhancement context
 */
export type SkillLevel = "beginner" | "intermediate" | "advanced";

/**
 * Context for enhancing instructions
 */
export interface EnhancementContext {
  contentType: EnhancementContentType;
  courseTitle?: string;
  topicTitle?: string;
  lessonTitle?: string;
  skillLevel?: SkillLevel;
}

/**
 * State of the enhancement process
 */
export interface EnhancementState {
  /** Whether enhancement is in progress */
  isEnhancing: boolean;
  /** The enhanced instruction result */
  enhancedInstruction: string | null;
  /** Error message if enhancement failed */
  error: string | null;
}

/**
 * Return type for the useInstructionEnhancement hook
 */
export interface UseInstructionEnhancementReturn extends EnhancementState {
  /** Trigger enhancement for the given instruction */
  enhance: (instruction: string, context: EnhancementContext) => Promise<void>;
  /** Accept the enhanced instruction */
  accept: () => string | null;
  /** Reject the enhanced instruction */
  reject: () => void;
  /** Reset the enhancement state */
  reset: () => void;
  /** Check if enhancement is available (instruction is valid) */
  canEnhance: (instruction: string) => boolean;
}

// ============================================================================
// Constants
// ============================================================================

const MIN_INSTRUCTION_LENGTH = 3;
const MAX_INSTRUCTION_LENGTH = 2000;

// ============================================================================
// Hook
// ============================================================================

/**
 * useInstructionEnhancement - A hook for managing the instruction enhancement flow
 *
 * @example
 * const {
 *   isEnhancing,
 *   enhancedInstruction,
 *   error,
 *   enhance,
 *   accept,
 *   reject,
 *   canEnhance,
 * } = useInstructionEnhancement();
 *
 * // Trigger enhancement
 * await enhance(instruction, { contentType: "lesson" });
 *
 * // Accept the enhancement
 * const newValue = accept();
 * if (newValue) {
 *   setInstruction(newValue);
 * }
 *
 * // Or reject it
 * reject();
 */
export function useInstructionEnhancement(): UseInstructionEnhancementReturn {
  const [state, setState] = useState<EnhancementState>({
    isEnhancing: false,
    enhancedInstruction: null,
    error: null,
  });

  const canEnhance = useCallback((instruction: string): boolean => {
    const trimmed = instruction.trim();
    return (
      trimmed.length >= MIN_INSTRUCTION_LENGTH &&
      trimmed.length <= MAX_INSTRUCTION_LENGTH
    );
  }, []);

  const enhance = useCallback(
    async (instruction: string, context: EnhancementContext): Promise<void> => {
      const trimmed = instruction.trim();

      if (!canEnhance(instruction)) {
        setState({
          isEnhancing: false,
          enhancedInstruction: null,
          error: `Instruction must be between ${MIN_INSTRUCTION_LENGTH} and ${MAX_INSTRUCTION_LENGTH} characters`,
        });
        return;
      }

      setState({
        isEnhancing: true,
        enhancedInstruction: null,
        error: null,
      });

      try {
        const response = await fetch("/api/instructions/enhance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userInstruction: trimmed,
            contentType: context.contentType,
            courseTitle: context.courseTitle,
            topicTitle: context.topicTitle,
            lessonTitle: context.lessonTitle,
            skillLevel: context.skillLevel,
          }),
        });

        if (!response.ok) {
          throw new Error(`Enhancement failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Enhancement failed");
        }

        setState({
          isEnhancing: false,
          enhancedInstruction: data.enhancedInstruction,
          error: null,
        });
      } catch (err) {
        setState({
          isEnhancing: false,
          enhancedInstruction: null,
          error: err instanceof Error ? err.message : "Failed to enhance instruction",
        });
      }
    },
    [canEnhance]
  );

  const accept = useCallback((): string | null => {
    const enhanced = state.enhancedInstruction;
    if (enhanced) {
      setState({
        isEnhancing: false,
        enhancedInstruction: null,
        error: null,
      });
    }
    return enhanced;
  }, [state.enhancedInstruction]);

  const reject = useCallback(() => {
    setState({
      isEnhancing: false,
      enhancedInstruction: null,
      error: null,
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      isEnhancing: false,
      enhancedInstruction: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    enhance,
    accept,
    reject,
    reset,
    canEnhance,
  };
}

export default useInstructionEnhancement;
