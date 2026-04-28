import type { WizardAgentContext } from "./components/WizardAgentDialog";

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
