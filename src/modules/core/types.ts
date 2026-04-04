export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  hasContent?: boolean;
  hasFlashcards?: boolean;
  hasQuiz?: boolean;
  hasExercises?: boolean;
  theoryCompleted?: boolean;
  theoryCompletedAt?: string;
  flashcardsCompleted?: boolean;
  flashcardsCompletedAt?: string;
  quizCompleted?: boolean;
  quizCompletedAt?: string;
  exercisesCompleted?: boolean;
  exercisesCompletedAt?: string;
  /** @deprecated Use theoryCompleted instead */
  completed?: boolean;
  /** @deprecated Use theoryCompletedAt instead */
  completedAt?: string;
}

export type LessonSection = "theory" | "flashcards" | "quiz" | "exercises";

export interface Topic {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  source: "llm" | "import" | "extract";
  sourceUrl?: string;
  topics: Topic[];
}

/** @deprecated Use Course instead */
export type Roadmap = Course;

export interface CourseMetadata {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  source: "llm" | "import" | "extract";
  topicCount: number;
  lessonCount: number;
  completedCount: number;
  progress: number;
}

/** @deprecated Use CourseMetadata instead */
export type RoadmapMetadata = CourseMetadata;

/**
 * Normalized lesson snapshot used for shape-based comparisons between generated
 * roadmap previews and persisted course data.
 */
export interface NormalizedLesson extends Pick<
  Lesson,
  "title" | "description"
> {
  description: string;
}

/**
 * Normalized topic snapshot that keeps only comparison-relevant fields and
 * ensures nested lessons follow the same normalized shape.
 */
export interface NormalizedTopic extends Pick<Topic, "title" | "description"> {
  description: string;
  lessons: NormalizedLesson[];
}

/**
 * Metadata-free course shape for deterministic roadmap matching. It excludes
 * persistence fields such as ids, timestamps, and source information.
 */
export interface NormalizedCourse extends Pick<
  Course,
  "title" | "description"
> {
  description: string;
  topics: NormalizedTopic[];
}

/**
 * Backward-compatible alias for roadmap terminology in agent-facing code.
 */
export type NormalizedRoadmap = NormalizedCourse;

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface ChoiceQuizQuestion {
  type: "choice";
  id: string;
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface TrueFalseQuizQuestion {
  type: "true-false";
  id: string;
  question: string;
  answer: boolean;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

export type QuizQuestion = ChoiceQuizQuestion | TrueFalseQuizQuestion;

export interface FlashcardsContent {
  version: 2;
  flashcards: Flashcard[];
}

export interface QuizContent {
  version: 2;
  quizQuestions: QuizQuestion[];
}

export interface ReviewEntry {
  itemId: string;
  repetitions: number;
  easeFactor: number;
  interval: number;
  lastReviewedAt: string;
  nextReviewAt: string;
}

export interface ReviewData {
  lessonId: string;
  entries: ReviewEntry[];
}
