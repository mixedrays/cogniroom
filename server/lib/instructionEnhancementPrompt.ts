/**
 * Prompt template for enhancing user-provided instructions before
 * sending them to the LLM for content generation.
 *
 * This helps transform brief or vague user instructions into more
 * detailed, actionable prompts that yield better generation results.
 */

export interface InstructionEnhancementContext {
  /** The original user instruction to enhance */
  userInstruction: string;
  /** The type of content being generated (e.g., 'lesson', 'exercise', 'test') */
  contentType: 'lesson' | 'exercise' | 'test' | 'course';
  /** Optional course title for context */
  courseTitle?: string;
  /** Optional topic title for context */
  topicTitle?: string;
  /** Optional lesson title for context */
  lessonTitle?: string;
  /** Target skill level */
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Returns content-type specific guidelines for instruction enhancement
 */
export function getContentTypeGuidelines(contentType: InstructionEnhancementContext['contentType']): string {
  const guidelines: Record<typeof contentType, string[]> = {
    lesson: [
      "For lesson content, ensure the enhanced instruction addresses:",
      "- Learning objectives and outcomes",
      "- Depth of theoretical explanation",
      "- Use of examples and analogies",
      "- Code samples or practical demonstrations (if applicable)",
      "- Summary or key takeaways",
    ],
    exercise: [
      "For exercise content, ensure the enhanced instruction addresses:",
      "- Clear problem statement and requirements",
      "- Difficulty level and estimated time",
      "- Expected deliverables or outputs",
      "- Hints or scaffolding for learners",
      "- Success criteria and validation approach",
    ],
    test: [
      "For test/quiz content, ensure the enhanced instruction addresses:",
      "- Question types and variety (multiple choice, coding, etc.)",
      "- Coverage of key concepts",
      "- Difficulty distribution",
      "- Clear answer explanations",
      "- Time constraints if applicable",
    ],
    course: [
      "For course structure, ensure the enhanced instruction addresses:",
      "- Learning path and progression",
      "- Topic organization and dependencies",
      "- Balance between theory and practice",
      "- Milestones and assessments",
      "- Prerequisites and target outcomes",
    ],
  };

  return guidelines[contentType].join("\n");
}

/**
 * Validates that a user instruction is suitable for enhancement
 * Returns null if valid, or an error message if invalid
 */
export function validateInstructionForEnhancement(instruction: string): string | null {
  const trimmed = instruction.trim();

  if (!trimmed) {
    return "Instruction cannot be empty";
  }

  if (trimmed.length < 3) {
    return "Instruction is too short to enhance meaningfully";
  }

  if (trimmed.length > 2000) {
    return "Instruction is too long. Please provide a more concise instruction (max 2000 characters)";
  }

  return null;
}

/**
 * Default enhancement templates for common instruction patterns
 * These can be used as fallbacks or suggestions
 */
export const ENHANCEMENT_TEMPLATES = {
  focusOnPractical: "Focus on practical, hands-on examples. Include working code snippets that learners can run and modify. Prioritize real-world applications over theoretical concepts.",

  beginnerFriendly: "Explain concepts as if teaching someone with no prior experience. Use simple analogies, break down complex terms, and provide step-by-step explanations.",

  advancedDeep: "Provide in-depth technical details. Include edge cases, performance considerations, and best practices. Assume familiarity with foundational concepts.",

  interactiveQuiz: "Include interactive elements like quizzes, reflection questions, or self-assessment checkpoints throughout the content.",

  projectBased: "Structure around a practical project. Each section should build toward a tangible deliverable that learners can showcase.",

  visualLearning: "Emphasize visual explanations. Include diagrams, flowcharts, or suggest visual representations for complex concepts.",
} as const;

export type EnhancementTemplateKey = keyof typeof ENHANCEMENT_TEMPLATES;
