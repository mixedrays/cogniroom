import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Loader2,
  Plus,
  FileText,
  BookOpen,
  ListChecks,
  Sparkles,
  Wand2,
} from "lucide-react";

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
import {
  useInstructionEnhancement,
  type EnhancementContentType,
} from "@/hooks/use-instruction-enhancement";
import { EnhancedInstructionPreview } from "@/components/EnhancedInstructionPreview";
import { PromptPreview } from "@/components/PromptPreview/PromptPreview";

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Dialog mode - either creating new content items or generating AI content
 */
export type DialogMode = "create" | "generate";

/**
 * The type of content being created
 */
export type ContentType = "lesson" | "topic" | "exercise";

/**
 * The type of content being generated via AI
 */
export type GenerationType = "theory" | "exercises" | "flashcards" | "quiz";

/**
 * Base content data shared across all content types
 */
export interface BaseContentData {
  title: string;
  description?: string;
}

/**
 * Data for creating a new lesson
 */
export interface LessonContentData extends BaseContentData {
  type: "lesson";
  content?: string;
  topicId?: string;
}

/**
 * Data for creating a new topic
 */
export interface TopicContentData extends BaseContentData {
  type: "topic";
}

/**
 * Data for creating a new exercise
 */
export interface ExerciseContentData extends BaseContentData {
  type: "exercise";
  difficulty?: "easy" | "medium" | "hard";
  lessonId?: string;
}

/**
 * Union type of all content data types
 */
export type ContentData =
  | LessonContentData
  | TopicContentData
  | ExerciseContentData;

/**
 * Data for AI content generation
 */
export interface ContentGenerationData {
  type: GenerationType;
  model: string;
  instructions: string;
}

/**
 * Result returned when content creation is successful
 */
export interface ContentCreationResult {
  success: true;
  data: ContentData;
}

/**
 * Result returned when content creation fails
 */
export interface ContentCreationError {
  success: false;
  error: string;
}

/**
 * Union type of content creation outcomes
 */
export type ContentCreationOutcome =
  | ContentCreationResult
  | ContentCreationError;

/**
 * Base props shared by both modes
 */
interface BaseDialogProps {
  /** Optional callback when dialog open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Control open state externally */
  open?: boolean;
  /** Custom trigger element */
  trigger?: React.ReactElement;
  /** Whether operation is in progress (for external loading state) */
  isCreating?: boolean;
  /** Error message to display (for external error state) */
  error?: string | null;
}

/**
 * Props for create mode
 */
export interface CreateModeProps extends BaseDialogProps {
  mode?: "create";
  /** Callback when content is successfully created */
  onContentCreated: (data: ContentData) => void | Promise<void>;
  /** Default content type to select */
  defaultContentType?: ContentType;
  /** Available content types to show (defaults to all) */
  allowedContentTypes?: ContentType[];
  /** Optional topic ID for lesson creation context */
  topicId?: string;
  /** Optional lesson ID for exercise creation context */
  lessonId?: string;
  // Generate mode props should not be present
  onGenerate?: never;
  generationType?: never;
}

/**
 * Context for the content being generated (used for AI enhancement)
 */
export interface ContentContext {
  /** Course title */
  courseTitle?: string;
  /** Topic title */
  topicTitle?: string;
  /** Topic description */
  topicDescription?: string;
  /** Lesson title */
  lessonTitle?: string;
  /** Lesson description */
  lessonDescription?: string;
  /** Skill level */
  skillLevel?: "beginner" | "intermediate" | "advanced";
}

/**
 * Props for generate mode
 */
export interface GenerateModeProps extends BaseDialogProps {
  mode: "generate";
  /** Callback when content generation is requested */
  onGenerate: (data: ContentGenerationData) => void | Promise<void>;
  /** Type of content to generate */
  generationType: GenerationType;
  /** Context for AI enhancement (course/topic/lesson info) */
  contentContext?: ContentContext;
  // Create mode props should not be present
  onContentCreated?: never;
  defaultContentType?: never;
  allowedContentTypes?: never;
  topicId?: never;
  lessonId?: never;
}

/**
 * Props for the ContentCreationDialog component
 */
export type ContentCreationDialogProps = CreateModeProps | GenerateModeProps;

/**
 * Content type configuration
 */
interface ContentTypeConfig {
  label: string;
  icon: React.ReactNode;
  description: string;
  dialogTitle: string;
  dialogDescription: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
}

// ============================================================================
// Constants
// ============================================================================

const CONTENT_TYPE_CONFIG: Record<ContentType, ContentTypeConfig> = {
  lesson: {
    label: "Lesson",
    icon: <FileText className="w-4 h-4" />,
    description: "Create a new lesson with content",
    dialogTitle: "Create New Lesson",
    dialogDescription:
      "Add a new lesson to teach concepts and share knowledge with your learners.",
    titlePlaceholder: "e.g., Introduction to React Hooks",
    descriptionPlaceholder:
      "Briefly describe what this lesson covers and what learners will gain...",
  },
  topic: {
    label: "Topic",
    icon: <BookOpen className="w-4 h-4" />,
    description: "Create a new topic to group lessons",
    dialogTitle: "Create New Topic",
    dialogDescription:
      "Topics help organize related lessons into logical groups for easier navigation.",
    titlePlaceholder: "e.g., JavaScript Fundamentals",
    descriptionPlaceholder:
      "Describe the theme or subject area this topic covers...",
  },
  exercise: {
    label: "Exercise",
    icon: <ListChecks className="w-4 h-4" />,
    description: "Create a practice exercise",
    dialogTitle: "Create New Exercise",
    dialogDescription:
      "Exercises help learners practice and reinforce their understanding through hands-on activities.",
    titlePlaceholder: "e.g., Build a Todo List Component",
    descriptionPlaceholder:
      "Describe the exercise goals and what skills it will help practice...",
  },
};

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

/**
 * Generation type configuration
 */
interface GenerationTypeConfig {
  label: string;
  icon: React.ReactNode;
  dialogTitle: string;
  dialogDescription: string;
  instructionsPlaceholder: string;
  buttonText: string;
  generatingText: string;
}

const GENERATION_TYPE_CONFIG: Record<GenerationType, GenerationTypeConfig> = {
  theory: {
    label: "Theory Content",
    icon: <FileText className="w-4 h-4" />,
    dialogTitle: "Generate Theory Content",
    dialogDescription:
      "Use AI to generate comprehensive theory content for this lesson. You can provide additional instructions to tailor the result.",
    instructionsPlaceholder:
      "E.g., Focus on practical examples, include a quiz, verify against latest version...",
    buttonText: "Generate Content",
    generatingText: "Generating...",
  },
  exercises: {
    label: "Exercises",
    icon: <ListChecks className="w-4 h-4" />,
    dialogTitle: "Generate Exercises Content",
    dialogDescription:
      "Use AI to generate exercises for this lesson. You can provide additional instructions to tailor the result.",
    instructionsPlaceholder:
      "E.g., Include hands-on tasks, focus on real-world scenarios...",
    buttonText: "Generate Content",
    generatingText: "Generating...",
  },
  flashcards: {
    label: "Flashcards",
    icon: <BookOpen className="w-4 h-4" />,
    dialogTitle: "Generate Flashcards",
    dialogDescription:
      "Use AI to generate flashcards for this lesson. You can provide additional instructions to tailor the result.",
    instructionsPlaceholder:
      "E.g., Focus on key definitions, include application questions...",
    buttonText: "Generate Content",
    generatingText: "Generating...",
  },
  quiz: {
    label: "Quiz",
    icon: <ListChecks className="w-4 h-4" />,
    dialogTitle: "Generate Quiz",
    dialogDescription:
      "Use AI to generate multiple-choice quiz questions for this lesson. You can provide additional instructions to tailor the result.",
    instructionsPlaceholder:
      "E.g., Focus on practical application, include tricky edge-case questions...",
    buttonText: "Generate Content",
    generatingText: "Generating...",
  },
};

// ============================================================================
// Component
// ============================================================================

export function ContentCreationDialog(props: ContentCreationDialogProps) {
  const mode = props.mode ?? "create";

  if (mode === "generate") {
    return <GenerateModeDialog {...(props as GenerateModeProps)} />;
  }

  return <CreateModeDialog {...(props as CreateModeProps)} />;
}

// ============================================================================
// Create Mode Dialog
// ============================================================================

function CreateModeDialog({
  onContentCreated,
  onOpenChange,
  open,
  defaultContentType = "lesson",
  allowedContentTypes = ["lesson", "topic", "exercise"],
  topicId,
  lessonId,
  trigger,
  isCreating: externalIsCreating,
  error: externalError,
}: CreateModeProps) {
  // Form state
  const [contentType, setContentType] =
    useState<ContentType>(defaultContentType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhancement hook for description
  const enhancement = useInstructionEnhancement();

  const isLoading = externalIsCreating || isSubmitting;
  const displayError = externalError || error;
  const isEnhanceDisabled =
    isLoading ||
    enhancement.isEnhancing ||
    !enhancement.canEnhance(description);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setContent("");
    setDifficulty("medium");
    setError(null);
    enhancement.reset();
  }, [enhancement]);

  const handleEnhanceDescription = useCallback(async () => {
    if (isEnhanceDisabled) return;
    // Map "topic" to "course" since the API doesn't support "topic"
    const apiContentType: EnhancementContentType =
      contentType === "topic" ? "course" : contentType;
    await enhancement.enhance(description, { contentType: apiContentType });
  }, [description, contentType, isEnhanceDisabled, enhancement]);

  const handleAcceptEnhancement = useCallback(() => {
    const enhanced = enhancement.accept();
    if (enhanced) {
      setDescription(enhanced);
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
    if (!title.trim()) {
      return "Title is required";
    }
    if (title.trim().length < 3) {
      return "Title must be at least 3 characters";
    }
    if (title.trim().length > 100) {
      return "Title must be less than 100 characters";
    }
    return null;
  };

  const buildContentData = (): ContentData => {
    const baseData: BaseContentData = {
      title: title.trim(),
      description: description.trim() || undefined,
    };

    switch (contentType) {
      case "lesson":
        return {
          ...baseData,
          type: "lesson",
          content: content.trim() || undefined,
          topicId,
        };
      case "topic":
        return {
          ...baseData,
          type: "topic",
        };
      case "exercise":
        return {
          ...baseData,
          type: "exercise",
          difficulty,
          lessonId,
        };
    }
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
      const data = buildContentData();
      await onContentCreated(data);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while creating content"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContentTypeSpecificFields = () => {
    switch (contentType) {
      case "lesson":
        return (
          <div className="space-y-2">
            <Label htmlFor="content">Lesson Content (optional)</Label>
            <Textarea
              id="content"
              placeholder="Start writing your lesson content here. You can include explanations, examples, and key concepts..."
              className="min-h-24"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
            />
          </div>
        );
      case "exercise":
        return (
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={difficulty}
              onValueChange={(value) =>
                setDifficulty(value as "easy" | "medium" | "hard")
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="p-1">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      default:
        return null;
    }
  };

  const currentConfig = CONTENT_TYPE_CONFIG[contentType];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <Button render={DialogTrigger}>
          <Plus className="w-4 h-4" />
          <span>Create Content</span>
        </Button>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentConfig.icon}
            {currentConfig.dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {currentConfig.dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
              {displayError}
            </div>
          )}

          {allowedContentTypes.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select
                value={contentType}
                onValueChange={(value) => setContentType(value as ContentType)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="p-1">
                  {allowedContentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center gap-2">
                        {CONTENT_TYPE_CONFIG[type].icon}
                        {CONTENT_TYPE_CONFIG[type].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">{currentConfig.label} Title</Label>
            <Input
              id="title"
              placeholder={currentConfig.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description (optional)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEnhanceDescription}
                disabled={isEnhanceDisabled}
              >
                {enhancement.isEnhancing ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Enhance with AI
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="description"
              placeholder={currentConfig.descriptionPlaceholder}
              className="min-h-20"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                // Clear enhanced description when user edits
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

            {/* Enhanced description preview with accept/reject */}
            {enhancement.enhancedInstruction && (
              <EnhancedInstructionPreview
                enhancedInstruction={enhancement.enhancedInstruction}
                onAccept={handleAcceptEnhancement}
                onReject={handleRejectEnhancement}
                title="Enhanced Description"
                disabled={isLoading}
              />
            )}
          </div>

          {renderContentTypeSpecificFields()}

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={isLoading} />}
            >
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
                  <Plus className="w-4 h-4" />
                  Create {currentConfig.label}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Generate Mode Dialog
// ============================================================================

function GenerateModeDialog({
  onGenerate,
  onOpenChange,
  open,
  generationType,
  trigger,
  isCreating: externalIsCreating,
  error: externalError,
  contentContext,
}: GenerateModeProps) {
  const { settings } = useSettings();

  // Form state
  const [model, setModel] = useState<string>(() =>
    getValidModel(settings.llm.defaultModel)
  );
  const [instructions, setInstructions] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhancement hook for instructions
  const enhancement = useInstructionEnhancement();

  const isLoading = externalIsCreating || isSubmitting;
  const displayError = externalError || error;
  const isEnhanceDisabled =
    isLoading ||
    enhancement.isEnhancing ||
    !enhancement.canEnhance(instructions);

  // Map generation type to enhancement content type
  const getEnhancementContentType = (
    genType: GenerationType
  ): EnhancementContentType => {
    switch (genType) {
      case "theory":
        return "lesson";
      case "exercises":
        return "exercise";
      case "flashcards":
      case "quiz":
        return "test";
      default:
        return "lesson";
    }
  };

  // Sync model with settings when they change
  useEffect(() => {
    setModel(getValidModel(settings.llm.defaultModel));
  }, [settings.llm.defaultModel]);

  const resetForm = useCallback(() => {
    setModel(getValidModel(settings.llm.defaultModel));
    setInstructions("");
    setError(null);
    enhancement.reset();
  }, [settings.llm.defaultModel, enhancement]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetForm();
      }
      onOpenChange?.(newOpen);
    },
    [onOpenChange, resetForm]
  );

  const handleEnhanceInstructions = useCallback(async () => {
    if (isEnhanceDisabled) return;
    await enhancement.enhance(instructions, {
      contentType: getEnhancementContentType(generationType),
      courseTitle: contentContext?.courseTitle,
      topicTitle: contentContext?.topicTitle,
      lessonTitle: contentContext?.lessonTitle,
      skillLevel: contentContext?.skillLevel,
    });
  }, [
    instructions,
    generationType,
    contentContext,
    isEnhanceDisabled,
    enhancement,
  ]);

  const handleAcceptEnhancement = useCallback(() => {
    const enhanced = enhancement.accept();
    if (enhanced) {
      setInstructions(enhanced);
    }
  }, [enhancement]);

  const handleRejectEnhancement = useCallback(() => {
    enhancement.reject();
  }, [enhancement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const data: ContentGenerationData = {
        type: generationType,
        model,
        instructions: instructions.trim(),
      };
      await onGenerate(data);
      // Note: We don't reset form here - the parent handles closing the dialog on success
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while generating content"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const config = GENERATION_TYPE_CONFIG[generationType];

  const promptId =
    generationType === "theory"
      ? "lesson-generation"
      : generationType === "exercises"
        ? "exercises-generation"
        : generationType === "flashcards"
          ? "flashcards-generation"
          : "quiz-generation";

  const promptVariables = useMemo(() => {
    const additionalInstructions = instructions.trim()
      ? `\nAdditional Instructions from user: ${instructions.trim()}`
      : "";
    return {
      courseTitle: contentContext?.courseTitle ?? "",
      topicTitle: contentContext?.topicTitle ?? "",
      topicDescription: contentContext?.topicDescription ?? "",
      lessonTitle: contentContext?.lessonTitle ?? "",
      lessonDescription: contentContext?.lessonDescription ?? "",
      additionalInstructions,
    };
  }, [contentContext, instructions]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <Button render={DialogTrigger} size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          Create {config.label}
        </Button>
      )}

      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            {config.dialogTitle}
          </DialogTitle>
          <DialogDescription>{config.dialogDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select
              value={model}
              onValueChange={(value) => value && setModel(value)}
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
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="instructions">
                Additional Instructions (Optional)
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEnhanceInstructions}
                disabled={isEnhanceDisabled}
              >
                {enhancement.isEnhancing ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles />
                    Enhance with AI
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="instructions"
              placeholder={config.instructionsPlaceholder}
              value={instructions}
              onChange={(e) => {
                setInstructions(e.target.value);
                // Clear enhanced instruction when user edits
                if (enhancement.enhancedInstruction) {
                  enhancement.reject();
                }
              }}
              className="h-32 resize-none"
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
          </div>

          <PromptPreview promptId={promptId} variables={promptVariables} />

          {displayError && (
            <div className="text-sm text-destructive font-medium">
              {displayError}
            </div>
          )}

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={isLoading} />}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {config.generatingText}
                </>
              ) : (
                config.buttonText
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ContentCreationDialog;
