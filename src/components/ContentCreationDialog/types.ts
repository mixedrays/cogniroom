/**
 * Types for the ContentCreationDialog component.
 * Defines content types, context, and callback signatures.
 */

import type {
  InstructionContentType,
  InstructionSkillLevel,
} from "@/lib/courses";

/**
 * Content types that the dialog can generate
 */
export type ContentType = "lesson" | "tests" | "exercises";

/**
 * Content-type specific configuration for the dialog UI
 */
export interface ContentTypeConfig {
  /** Dialog title */
  title: string;
  /** Dialog description */
  description: string;
  /** Placeholder text for instructions textarea */
  placeholder: string;
  /** Text for the generate button */
  generateButtonText: string;
  /** Text for the trigger button */
  triggerButtonText: string;
  /** Content type for the enhancement API */
  enhancementContentType: InstructionContentType;
}

/**
 * Context about the course/lesson for instruction enhancement
 */
export interface ContentContext {
  /** Course title */
  courseTitle?: string;
  /** Topic title */
  topicTitle?: string;
  /** Lesson title */
  lessonTitle?: string;
  /** Target skill level */
  skillLevel?: InstructionSkillLevel;
}

/**
 * Generation result passed to the onGenerate callback
 */
export interface GenerationParams {
  /** Additional instructions provided by the user */
  instructions: string;
  /** Selected model for generation */
  model: string;
}

/**
 * Props for the ContentCreationDialog component
 */
export interface ContentCreationDialogProps {
  /** The type of content to generate */
  contentType: ContentType;

  /** Whether the dialog is open */
  open: boolean;

  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;

  /** Callback to trigger content generation */
  onGenerate: (params: GenerationParams) => Promise<void>;

  /** Whether generation is currently in progress */
  isGenerating?: boolean;

  /** Error message to display */
  error?: string | null;

  /** Context for instruction enhancement */
  contentContext?: ContentContext;

  /** Initial value for instructions textarea */
  initialInstructions?: string;

  /** Initial model selection */
  initialModel?: string;

  /** Custom trigger element (if not provided, uses default button) */
  trigger?: React.ReactNode;
}

/**
 * Internal state for the enhancement flow
 */
export interface EnhancementState {
  /** Whether enhancement is in progress */
  isEnhancing: boolean;
  /** The enhanced instruction text */
  enhancedText: string | null;
  /** Error from enhancement attempt */
  error: string | null;
  /** Whether we're showing the comparison view */
  showComparison: boolean;
}
