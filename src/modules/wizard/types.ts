import type { AgentMessage } from "./schema";

export type WizardMessage =
  | {
      id: string;
      role: "assistant";
      data: AgentMessage;
      status: "streaming" | "complete";
    }
  | { id: string; role: "user"; text: string; sourceWidget?: AgentMessage };

export type WizardContext = Record<string, unknown>;

export interface WizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: WizardContext;
  onGenerate?: (prompt: string, contentType: string) => void;
  trigger?: React.ReactElement;
}
