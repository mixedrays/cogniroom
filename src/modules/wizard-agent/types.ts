export interface WizardAgentContext {
  contentType: "roadmap" | "lesson" | "quiz" | "flashcards" | "exercise";
  courseId?: string;
  lessonId?: string;
  topic?: string;
  lessonTitle?: string;
  courseTitle?: string;
}

// The subset of context the content-preview tools (ContentBubble) need to save
// generated content against. Threaded through the generic agent layer as an
// opaque map, then narrowed back to this on the wizard side.
export interface WizardToolContext {
  courseId?: string;
  lessonId?: string;
}

export interface WizardAgentAttachment {
  id: string;
  label: string;
  content: string;
}

export interface SessionMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  scope: {
    contentType: WizardAgentContext["contentType"];
    courseId?: string;
    lessonId?: string;
  };
}
