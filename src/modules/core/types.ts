export type LessonSection = "theory" | "flashcards" | "quiz" | "exercises";

export interface LessonSectionProgress {
  completed: boolean;
  completedAt?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  hasContent?: boolean;
  hasFlashcards?: boolean;
  hasQuiz?: boolean;
  hasExercises?: boolean;
  /**
   * Per-section completion state, keyed by {@link LessonSection}. A missing
   * section entry means that section has not been completed.
   */
  progress?: Partial<Record<LessonSection, LessonSectionProgress>>;
}

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

export type DeckKind = "flashcards" | "quiz";

export type DeckSource = "llm" | "manual" | "import";

export interface Deck {
  id: string;
  title: string;
  description?: string;
  kind: DeckKind;
  createdAt: string;
  updatedAt: string;
  source: DeckSource;
}

export interface DeckMetadata {
  id: string;
  title: string;
  description?: string;
  kind: DeckKind;
  createdAt: string;
  updatedAt: string;
  source: DeckSource;
  itemCount: number;
}

/**
 * External material a user attaches so the wizard agent can extract and consider
 * it during content generation (see .features/chat-attachments.md). Files
 * (image/pdf/document/text) are supported now; links (webpage/youtube) are
 * modeled here but processed in a later phase.
 */
export type SourceKind =
  | "image"
  | "pdf"
  | "document"
  | "text"
  | "webpage"
  | "youtube";

export type SourceStatus = "processing" | "ready" | "error";

/** How the source reaches the model: native multimodal part or extracted text. */
export type SourceDelivery = "native" | "text";

/** A course/lesson a source is attached to (many-to-many; drives the picker view). */
export interface SourceScope {
  courseId?: string;
  lessonId?: string;
}

export interface SourceMeta {
  title?: string;
  author?: string;
  durationSec?: number;
  pageCount?: number;
  width?: number;
  height?: number;
}

export interface Source {
  /** sha256 of the blob content — also the dedup key. */
  id: string;
  kind: SourceKind;
  origin: "upload" | "link";
  delivery: SourceDelivery;
  /** Display name: filename, page title, or "Notes". */
  label: string;
  /** Original filename or URL. */
  source: string;
  mimeType?: string;
  byteSize?: number;
  /** Link sources (phase 2). */
  url?: string;
  status: SourceStatus;
  error?: string;
  /**
   * Extracted text form for `delivery: "text"` sources (documents now; web/yt
   * later; pdf fallback). Persisted separately on disk, not embedded in
   * listings — populated only when a source is loaded for use.
   */
  extractedText?: string;
  /** ~chars / 4, so size is known without loading the text. */
  extractedTokens?: number;
  meta?: SourceMeta;
  /** Course/lesson associations this source is attached to. */
  scopes: SourceScope[];
  refCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight derivation for chips and message attachment refs. */
export type SourceRef = Pick<Source, "id" | "kind" | "label" | "status">;
