import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Loader2,
  Plus,
  FileText,
  BookOpen,
  ListChecks,
  Sparkles,
  Wand2,
  ChevronDown,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import { getValidModel } from "@/lib/llm-models";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import { useSettings } from "@/modules/settings";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";

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
 * Per-type generation options that tune how content is produced.
 * Only fields relevant to the selected GenerationType are used.
 */
export type TheoryDepth = "short" | "standard" | "deep";
export type FlashcardStyle = "qa" | "cloze" | "definition";
export type FlashcardFocus =
  | "definitions"
  | "concepts"
  | "application"
  | "mixed";
export type QuizQuestionType = "single" | "multi" | "true-false" | "mixed";
export type Difficulty = "easy" | "medium" | "hard" | "mixed";
export type ExerciseFormat = "coding" | "conceptual" | "mixed";

export interface GenerationOptions {
  depth?: TheoryDepth;
  count?: number;
  cardStyle?: FlashcardStyle;
  focus?: FlashcardFocus;
  questionType?: QuizQuestionType;
  difficulty?: Difficulty;
  format?: ExerciseFormat;
}

/**
 * Data for AI content generation
 */
export interface ContentGenerationData {
  type: GenerationType;
  model: string;
  instructions: string;
  includeContent: boolean;
  options: GenerationOptions;
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
        <DialogTrigger render={<Button />}>
          <Plus className="w-4 h-4" />
          <span>Create Content</span>
        </DialogTrigger>
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
              <ErrorMessage message={displayError} />
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

const DEFAULT_OPTIONS: Record<GenerationType, GenerationOptions> = {
  theory: { depth: "standard" },
  flashcards: { count: 10, cardStyle: "qa", focus: "mixed" },
  quiz: { count: 8, questionType: "mixed", difficulty: "mixed" },
  exercises: { count: 4, difficulty: "mixed", format: "mixed" },
};

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

  const showIncludeContentToggle =
    generationType === "flashcards" ||
    generationType === "quiz" ||
    generationType === "exercises";

  // Form state
  const [model, setModel] = useState<string>(() =>
    getValidModel(settings.llm.defaultModel)
  );
  const [instructions, setInstructions] = useState("");
  const [includeContent, setIncludeContent] = useState(true);
  const [options, setOptions] = useState<GenerationOptions>(
    () => DEFAULT_OPTIONS[generationType]
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);

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

  // Reset options when generation type changes
  useEffect(() => {
    setOptions(DEFAULT_OPTIONS[generationType]);
  }, [generationType]);

  const resetForm = useCallback(() => {
    setModel(getValidModel(settings.llm.defaultModel));
    setInstructions("");
    setIncludeContent(true);
    setOptions(DEFAULT_OPTIONS[generationType]);
    setAdvancedOpen(false);
    setError(null);
    enhancement.reset();
  }, [settings.llm.defaultModel, enhancement, generationType]);

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
        includeContent,
        options,
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
    const optionsBlock = formatGenerationOptions(generationType, options);
    const userBlock = instructions.trim()
      ? `Additional Instructions from user: ${instructions.trim()}`
      : "";
    const combined = [optionsBlock, userBlock].filter(Boolean).join("\n\n");
    const additionalInstructions = combined ? `\n${combined}` : "";
    const lessonContent =
      showIncludeContentToggle && includeContent
        ? "\n\nLesson Theory Content:\n---\n[lesson theory content will be included if available]\n---"
        : "";
    return {
      courseTitle: contentContext?.courseTitle ?? "",
      topicTitle: contentContext?.topicTitle ?? "",
      topicDescription: contentContext?.topicDescription ?? "",
      lessonTitle: contentContext?.lessonTitle ?? "",
      lessonDescription: contentContext?.lessonDescription ?? "",
      lessonContent,
      additionalInstructions,
    };
  }, [
    contentContext,
    instructions,
    showIncludeContentToggle,
    includeContent,
    generationType,
    options,
  ]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button size="lg" className="gap-2" />}>
          <Plus className="w-4 h-4" />
          Create {config.label}
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            {config.dialogTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="divide-y divide-border/60">
            <FieldRow label="Model">
              <ModelSelect
                value={model}
                onValueChange={setModel}
                disabled={isLoading}
                className="p-1"
                triggerClassName="w-50"
              />
            </FieldRow>

            <TypeSpecificControls
              generationType={generationType}
              options={options}
              onChange={setOptions}
              disabled={isLoading}
            />

            {showIncludeContentToggle && (
              <FieldRow label="Use lesson theory as source">
                <Checkbox
                  id="include-content"
                  checked={includeContent}
                  onCheckedChange={(checked) =>
                    setIncludeContent(checked === true)
                  }
                  disabled={isLoading}
                />
              </FieldRow>
            )}
          </div>

          <Collapsible
            open={advancedOpen}
            onOpenChange={setAdvancedOpen}
            className="pt-3"
          >
            <CollapsibleTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between text-muted-foreground hover:text-foreground"
                />
              }
            >
              <span>Advanced</span>
              <ChevronDown
                className={cn(
                  "transition-transform",
                  advancedOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
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
                    if (enhancement.enhancedInstruction) {
                      enhancement.reject();
                    }
                  }}
                  className="h-28 resize-none"
                  disabled={isLoading || enhancement.isEnhancing}
                />

                {enhancement.error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
                    {enhancement.error}
                  </div>
                )}

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
            </CollapsibleContent>
          </Collapsible>

          {displayError && (
            <div className="text-sm text-destructive font-medium">
              <ErrorMessage message={displayError} />
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

// ============================================================================
// Type-specific controls
// ============================================================================

const DEPTH_OPTIONS: Array<{ value: TheoryDepth; label: string }> = [
  { value: "short", label: "Short" },
  { value: "standard", label: "Standard" },
  { value: "deep", label: "Deep" },
];

const CARD_STYLE_OPTIONS: Array<{ value: FlashcardStyle; label: string }> = [
  { value: "qa", label: "Q&A" },
  { value: "cloze", label: "Cloze" },
  { value: "definition", label: "Definition" },
];

const FOCUS_OPTIONS: Array<{ value: FlashcardFocus; label: string }> = [
  { value: "mixed", label: "Mixed" },
  { value: "definitions", label: "Defs" },
  { value: "concepts", label: "Concepts" },
  { value: "application", label: "Applied" },
];

const QUESTION_TYPE_OPTIONS: Array<{
  value: QuizQuestionType;
  label: string;
}> = [
  { value: "mixed", label: "Mixed" },
  { value: "single", label: "Single" },
  { value: "multi", label: "Multi" },
  { value: "true-false", label: "T/F" },
];

const DIFFICULTY_LEVEL_OPTIONS: Array<{ value: Difficulty; label: string }> = [
  { value: "mixed", label: "Mixed" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const FORMAT_OPTIONS: Array<{ value: ExerciseFormat; label: string }> = [
  { value: "mixed", label: "Mixed" },
  { value: "coding", label: "Coding" },
  { value: "conceptual", label: "Conceptual" },
];

interface TypeSpecificControlsProps {
  generationType: GenerationType;
  options: GenerationOptions;
  onChange: (next: GenerationOptions) => void;
  disabled?: boolean;
}

function TypeSpecificControls({
  generationType,
  options,
  onChange,
  disabled,
}: TypeSpecificControlsProps) {
  const update = <K extends keyof GenerationOptions>(
    key: K,
    value: GenerationOptions[K]
  ) => onChange({ ...options, [key]: value });

  if (generationType === "theory") {
    return (
      <FieldRow label="Length">
        <SegmentedField
          value={options.depth ?? "standard"}
          options={DEPTH_OPTIONS}
          onChange={(v) => update("depth", v as TheoryDepth)}
          disabled={disabled}
        />
      </FieldRow>
    );
  }

  if (generationType === "flashcards") {
    return (
      <>
        <FieldRow label="Count">
          <CountInput
            value={options.count ?? 10}
            min={3}
            max={40}
            onChange={(n) => update("count", n)}
            disabled={disabled}
          />
        </FieldRow>
        <FieldRow label="Style">
          <SegmentedField
            value={options.cardStyle ?? "qa"}
            options={CARD_STYLE_OPTIONS}
            onChange={(v) => update("cardStyle", v as FlashcardStyle)}
            disabled={disabled}
          />
        </FieldRow>
        <FieldRow label="Focus">
          <SegmentedField
            value={options.focus ?? "mixed"}
            options={FOCUS_OPTIONS}
            onChange={(v) => update("focus", v as FlashcardFocus)}
            disabled={disabled}
          />
        </FieldRow>
      </>
    );
  }

  if (generationType === "quiz") {
    return (
      <>
        <FieldRow label="Count">
          <CountInput
            value={options.count ?? 8}
            min={3}
            max={30}
            onChange={(n) => update("count", n)}
            disabled={disabled}
          />
        </FieldRow>
        <FieldRow label="Difficulty">
          <SegmentedField
            value={options.difficulty ?? "mixed"}
            options={DIFFICULTY_LEVEL_OPTIONS}
            onChange={(v) => update("difficulty", v as Difficulty)}
            disabled={disabled}
          />
        </FieldRow>
        <FieldRow label="Type">
          <SegmentedField
            value={options.questionType ?? "mixed"}
            options={QUESTION_TYPE_OPTIONS}
            onChange={(v) => update("questionType", v as QuizQuestionType)}
            disabled={disabled}
          />
        </FieldRow>
      </>
    );
  }

  // exercises
  return (
    <>
      <FieldRow label="Count">
        <CountInput
          value={options.count ?? 4}
          min={1}
          max={15}
          onChange={(n) => update("count", n)}
          disabled={disabled}
        />
      </FieldRow>
      <FieldRow label="Difficulty">
        <SegmentedField
          value={options.difficulty ?? "mixed"}
          options={DIFFICULTY_LEVEL_OPTIONS}
          onChange={(v) => update("difficulty", v as Difficulty)}
          disabled={disabled}
        />
      </FieldRow>
      <FieldRow label="Format">
        <SegmentedField
          value={options.format ?? "mixed"}
          options={FORMAT_OPTIONS}
          onChange={(v) => update("format", v as ExerciseFormat)}
          disabled={disabled}
        />
      </FieldRow>
    </>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <p className="font-medium">{label}</p>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

interface CountInputProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function CountInput({ value, min, max, onChange, disabled }: CountInputProps) {
  return (
    <Input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => {
        const next = Number(e.target.value);
        if (Number.isFinite(next)) {
          onChange(Math.min(max, Math.max(min, next)));
        }
      }}
      disabled={disabled}
      className="w-20"
    />
  );
}

interface SegmentedFieldProps<T extends string> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
}

function SegmentedField<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: SegmentedFieldProps<T>) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        if (values.length > 0) {
          onChange(values[values.length - 1] as T);
        }
      }}
      variant="outline"
      disabled={disabled}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value}>
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

// ============================================================================
// Options → text helpers
// ============================================================================

const DEPTH_INSTRUCTIONS: Record<TheoryDepth, string> = {
  short: "Length: short (~400-700 words). Be concise; cover essentials only.",
  standard: "Length: standard (~800-1500 words).",
  deep: "Length: deep dive (~1800-2800 words). Include extended examples and edge cases.",
};

const CARD_STYLE_INSTRUCTIONS: Record<FlashcardStyle, string> = {
  qa: "Card style: question-and-answer.",
  cloze:
    "Card style: cloze deletion (fill-in-the-blank). Phrase questions as sentences with a key term replaced by ___.",
  definition: "Card style: term/definition pairs.",
};

const FOCUS_INSTRUCTIONS: Record<FlashcardFocus, string> = {
  mixed: "Focus: balanced mix of definitions, concepts, and application.",
  definitions: "Focus: prioritize definitions and terminology.",
  concepts: "Focus: prioritize core concepts and how things relate.",
  application: "Focus: prioritize applied/use-case questions.",
};

const QUESTION_TYPE_INSTRUCTIONS: Record<QuizQuestionType, string> = {
  mixed: "Question types: mix of single-choice, multi-select, and true/false.",
  single:
    "Question types: single-choice only (one correct option per question).",
  multi:
    "Question types: multi-select choice questions (2+ correct options per question).",
  "true-false": "Question types: true/false only.",
};

const DIFFICULTY_INSTRUCTIONS: Record<Difficulty, string> = {
  mixed: "Difficulty: spread across easy, medium, and hard.",
  easy: "Difficulty: all easy.",
  medium: "Difficulty: all medium.",
  hard: "Difficulty: all hard.",
};

const FORMAT_INSTRUCTIONS: Record<ExerciseFormat, string> = {
  mixed: "Format: mix of coding and conceptual exercises as appropriate.",
  coding:
    "Format: coding exercises only — hands-on programming tasks with expected output.",
  conceptual:
    "Format: conceptual exercises only — written analysis, scenario design, or step-by-step reasoning.",
};

/**
 * Build the human-readable "Generation Options:" block appended to the prompt.
 * Returns an empty string when no options apply.
 */
export function formatGenerationOptions(
  type: GenerationType,
  options: GenerationOptions
): string {
  const lines: string[] = [];

  if (type === "theory" && options.depth) {
    lines.push(`- ${DEPTH_INSTRUCTIONS[options.depth]}`);
  }

  if (type === "flashcards") {
    if (typeof options.count === "number") {
      lines.push(`- Total number of flashcards to generate: ${options.count}.`);
    }
    if (options.cardStyle) {
      lines.push(`- ${CARD_STYLE_INSTRUCTIONS[options.cardStyle]}`);
    }
    if (options.focus) {
      lines.push(`- ${FOCUS_INSTRUCTIONS[options.focus]}`);
    }
  }

  if (type === "quiz") {
    if (typeof options.count === "number") {
      lines.push(
        `- Total number of quiz questions to generate: ${options.count}.`
      );
    }
    if (options.questionType) {
      lines.push(`- ${QUESTION_TYPE_INSTRUCTIONS[options.questionType]}`);
    }
    if (options.difficulty) {
      lines.push(`- ${DIFFICULTY_INSTRUCTIONS[options.difficulty]}`);
    }
  }

  if (type === "exercises") {
    if (typeof options.count === "number") {
      lines.push(`- Total number of exercises to generate: ${options.count}.`);
    }
    if (options.difficulty) {
      lines.push(`- ${DIFFICULTY_INSTRUCTIONS[options.difficulty]}`);
    }
    if (options.format) {
      lines.push(`- ${FORMAT_INSTRUCTIONS[options.format]}`);
    }
  }

  if (lines.length === 0) return "";
  return ["Generation Options:", ...lines].join("\n");
}

export default ContentCreationDialog;
