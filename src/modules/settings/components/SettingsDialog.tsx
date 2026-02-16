import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SettingsContent } from "./SettingsContent";

interface SettingsDialogProps {
  trigger?: React.ReactElement;
  defaultTab?: "appearance" | "llm" | "prompts" | "history";
  defaultPromptId?: string;
}

export function SettingsDialog({ trigger, defaultTab, defaultPromptId }: SettingsDialogProps) {
  return (
    <Dialog>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-3xl h-[min(80vh,600px)] overflow-hidden p-0 gap-0">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <SettingsContent defaultTab={defaultTab} defaultPromptId={defaultPromptId} />
      </DialogContent>
    </Dialog>
  );
}
